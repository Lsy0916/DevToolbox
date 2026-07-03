import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  gatherExportData,
  generateExportJson,
  downloadJson,
  parseImportJson,
  applyImportData,
  getDefaultSelected,
  clearSelectedData,
  EXPORT_CATEGORIES,
} from './dataManagerUtils'
import type { AppSettings } from '@/types'

// Mock the localStorage and db dependencies so we test only dataManagerUtils logic.
vi.mock('@/utils/localStorage', () => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
}))

vi.mock('@/utils/db', () => ({
  exportAllData: vi.fn(),
  importAllData: vi.fn(),
  clearAllHistory: vi.fn(),
}))

import { getSettings, saveSettings } from '@/utils/localStorage'
import { exportAllData, importAllData, clearAllHistory } from '@/utils/db'

const mockSettings: AppSettings = {
  theme: 'dark',
  locale: 'en-US',
  sidebarCollapsed: true,
  favoritesGroups: [{ id: 'g1', name: 'Group 1', toolIds: ['t1', 't2'], collapsed: false }],
  recentTools: ['t1', 't2'],
}

describe('gatherExportData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSettings).mockReturnValue(mockSettings)
  })

  it('returns an empty object for an empty selection', async () => {
    const data = await gatherExportData(new Set())
    expect(data).toEqual({})
  })

  it('gathers favoritesGroups when selected', async () => {
    const data = await gatherExportData(new Set(['favoritesGroups']))
    expect(data.favoritesGroups).toEqual(mockSettings.favoritesGroups)
  })

  it('gathers recentTools when selected', async () => {
    const data = await gatherExportData(new Set(['recentTools']))
    expect(data.recentTools).toEqual(mockSettings.recentTools)
  })

  it('gathers theme when selected', async () => {
    const data = await gatherExportData(new Set(['theme']))
    expect(data.theme).toBe('dark')
  })

  it('gathers locale when selected', async () => {
    const data = await gatherExportData(new Set(['locale']))
    expect(data.locale).toBe('en-US')
  })

  it('gathers sidebarCollapsed when selected', async () => {
    const data = await gatherExportData(new Set(['sidebarCollapsed']))
    expect(data.sidebarCollapsed).toBe(true)
  })

  it('gathers history by calling exportAllData and parsing the result', async () => {
    const historyData = [
      { tool: 't', input: 'i', output: 'o', createdAt: '2026-01-01T00:00:00.000Z' },
    ]
    vi.mocked(exportAllData).mockResolvedValue(JSON.stringify({ history: historyData }))
    const data = await gatherExportData(new Set(['history']))
    expect(exportAllData).toHaveBeenCalledTimes(1)
    expect(data.history).toEqual(historyData)
  })

  it('gathers every category when all are selected', async () => {
    vi.mocked(exportAllData).mockResolvedValue(JSON.stringify({ history: [] }))
    const data = await gatherExportData(getDefaultSelected())
    expect(data.favoritesGroups).toBeDefined()
    expect(data.recentTools).toBeDefined()
    expect(data.theme).toBeDefined()
    expect(data.locale).toBeDefined()
    expect(data.sidebarCollapsed).toBeDefined()
    expect(data.history).toBeDefined()
  })

  it('does not call exportAllData when history is not selected', async () => {
    await gatherExportData(new Set(['theme']))
    expect(exportAllData).not.toHaveBeenCalled()
  })
})

describe('generateExportJson', () => {
  it('generates a valid JSON bundle with version 1', () => {
    const json = generateExportJson({ theme: 'dark' })
    const parsed = JSON.parse(json)
    expect(parsed.version).toBe(1)
    expect(parsed.data).toEqual({ theme: 'dark' })
    expect(typeof parsed.exportedAt).toBe('string')
  })

  it('pretty-prints the JSON with 2-space indentation', () => {
    const json = generateExportJson({})
    expect(json).toContain('\n  ')
  })

  it('includes an ISO-formatted exportedAt timestamp', () => {
    const json = generateExportJson({})
    const parsed = JSON.parse(json)
    // Should be a valid ISO date string
    expect(() => new Date(parsed.exportedAt).toISOString()).not.toThrow()
    expect(parsed.exportedAt).toContain('T')
  })
})

describe('downloadJson', () => {
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url')
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates an anchor, sets the download name and clicks it', () => {
    const anchorEl = document.createElement('a')
    const clickSpy = vi.spyOn(anchorEl, 'click')
    const createElSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchorEl)
    const appendSpy = vi.spyOn(document.body, 'appendChild')
    const removeSpy = vi.spyOn(document.body, 'removeChild')

    downloadJson('{"test":true}')

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
    expect(anchorEl.href).toContain('blob:fake-url')
    expect(anchorEl.download).toContain('devtoolbox-backup-')
    expect(anchorEl.download).toContain('.json')
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(appendSpy).toHaveBeenCalledWith(anchorEl)
    expect(removeSpy).toHaveBeenCalledWith(anchorEl)
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:fake-url')

    createElSpy.mockRestore()
    appendSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('produces a download filename containing the timestamp', () => {
    const anchorEl = document.createElement('a')
    vi.spyOn(anchorEl, 'click')
    vi.spyOn(document, 'createElement').mockReturnValue(anchorEl)
    vi.spyOn(document.body, 'appendChild')
    vi.spyOn(document.body, 'removeChild')

    downloadJson('{}')
    // Expected format: devtoolbox-backup-YYYY-MM-DD-HH-MM-SS.json
    expect(anchorEl.download).toMatch(/^devtoolbox-backup-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.json$/)
  })
})

describe('parseImportJson', () => {
  it('parses a valid bundle and detects every available category', () => {
    const bundle = {
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      data: {
        favoritesGroups: [],
        recentTools: [],
        theme: 'dark',
        locale: 'en-US',
        sidebarCollapsed: false,
        history: [],
      },
    }
    const result = parseImportJson(JSON.stringify(bundle))
    expect(result.error).toBeNull()
    expect(result.bundle).not.toBeNull()
    expect(result.bundle!.version).toBe(1)
    expect(result.availableCategories).toEqual([
      'favoritesGroups',
      'recentTools',
      'theme',
      'locale',
      'sidebarCollapsed',
      'history',
    ])
  })

  it('returns ParseError for invalid JSON', () => {
    const result = parseImportJson('not json at all')
    expect(result.bundle).toBeNull()
    expect(result.error).toBe('ParseError')
    expect(result.availableCategories).toEqual([])
  })

  it('returns InvalidFormat when the data field is missing', () => {
    const result = parseImportJson(JSON.stringify({ version: 1 }))
    expect(result.bundle).toBeNull()
    expect(result.error).toBe('InvalidFormat')
    expect(result.availableCategories).toEqual([])
  })

  it('returns InvalidFormat when the parsed value is null', () => {
    const result = parseImportJson(JSON.stringify(null))
    expect(result.error).toBe('InvalidFormat')
    expect(result.bundle).toBeNull()
  })

  it('detects only the categories that are actually present', () => {
    const bundle = { version: 1, data: { theme: 'dark' } }
    const result = parseImportJson(JSON.stringify(bundle))
    expect(result.availableCategories).toEqual(['theme'])
  })

  it('does not include categories whose values have the wrong type', () => {
    const bundle = {
      version: 1,
      data: { theme: 123, locale: true, sidebarCollapsed: 'no', favoritesGroups: 'x', recentTools: {}, history: 5 },
    }
    const result = parseImportJson(JSON.stringify(bundle))
    expect(result.availableCategories).toEqual([])
  })
})

describe('applyImportData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(importAllData).mockResolvedValue(1)
  })

  it('patches settings for all selected setting categories', async () => {
    const favoritesGroups = [{ id: 'g1', name: 'G', toolIds: [], collapsed: false }]
    const bundle = {
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      data: {
        theme: 'dark',
        locale: 'en-US',
        sidebarCollapsed: true,
        favoritesGroups,
        recentTools: ['t1'],
      },
    }
    await applyImportData(bundle as never, new Set([
      'theme', 'locale', 'sidebarCollapsed', 'favoritesGroups', 'recentTools',
    ]))
    expect(saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: 'dark',
        locale: 'en-US',
        sidebarCollapsed: true,
        favoritesGroups,
        recentTools: ['t1'],
      }),
    )
  })

  it('normalizes a non-"dark" theme to "light"', async () => {
    const bundle = { version: 1, exportedAt: '', data: { theme: 'something' } }
    await applyImportData(bundle as never, new Set(['theme']))
    expect(saveSettings).toHaveBeenCalledWith({ theme: 'light' })
  })

  it('normalizes a non-"en-US" locale to "zh-CN"', async () => {
    const bundle = { version: 1, exportedAt: '', data: { locale: 'fr-FR' } }
    await applyImportData(bundle as never, new Set(['locale']))
    expect(saveSettings).toHaveBeenCalledWith({ locale: 'zh-CN' })
  })

  it('imports history by calling importAllData with the history payload', async () => {
    const history = [{ tool: 't', input: 'i', output: 'o', createdAt: '2026-01-01T00:00:00.000Z' }]
    const bundle = { version: 1, exportedAt: '', data: { history } }
    await applyImportData(bundle as never, new Set(['history']))
    expect(importAllData).toHaveBeenCalledTimes(1)
    const arg = vi.mocked(importAllData).mock.calls[0][0]
    expect(JSON.parse(arg)).toEqual({ history })
  })

  it('does not call saveSettings when only history is selected', async () => {
    const bundle = { version: 1, exportedAt: '', data: { history: [] } }
    await applyImportData(bundle as never, new Set(['history']))
    expect(saveSettings).not.toHaveBeenCalled()
    expect(importAllData).toHaveBeenCalled()
  })

  it('does nothing when no categories are selected', async () => {
    const bundle = { version: 1, exportedAt: '', data: { theme: 'dark' } }
    await applyImportData(bundle as never, new Set())
    expect(saveSettings).not.toHaveBeenCalled()
    expect(importAllData).not.toHaveBeenCalled()
  })

  it('skips sidebarCollapsed when its value is not a boolean', async () => {
    const bundle = { version: 1, exportedAt: '', data: { sidebarCollapsed: 'yes' as never } }
    await applyImportData(bundle as never, new Set(['sidebarCollapsed']))
    expect(saveSettings).not.toHaveBeenCalled()
  })
})

describe('getDefaultSelected', () => {
  it('returns a set containing every export category', () => {
    const selected = getDefaultSelected()
    expect(selected.size).toBe(EXPORT_CATEGORIES.length)
    for (const cat of EXPORT_CATEGORIES) {
      expect(selected.has(cat.key)).toBe(true)
    }
  })
})

describe('clearSelectedData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(clearAllHistory).mockResolvedValue(undefined)
  })

  it('resets settings categories to their defaults when selected', async () => {
    await clearSelectedData(
      new Set(['favoritesGroups', 'recentTools', 'theme', 'locale', 'sidebarCollapsed']),
    )
    expect(saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        favoritesGroups: [],
        recentTools: [],
        theme: 'light',
        locale: 'zh-CN',
        sidebarCollapsed: false,
      }),
    )
  })

  it('clears history when the history category is selected', async () => {
    await clearSelectedData(new Set(['history']))
    expect(clearAllHistory).toHaveBeenCalledTimes(1)
  })

  it('does not call saveSettings when only history is selected', async () => {
    await clearSelectedData(new Set(['history']))
    expect(saveSettings).not.toHaveBeenCalled()
  })

  it('does nothing when no categories are selected', async () => {
    await clearSelectedData(new Set())
    expect(saveSettings).not.toHaveBeenCalled()
    expect(clearAllHistory).not.toHaveBeenCalled()
  })
})

describe('EXPORT_CATEGORIES', () => {
  it('contains all six expected category keys', () => {
    const keys = EXPORT_CATEGORIES.map((c) => c.key)
    expect(keys).toEqual([
      'favoritesGroups',
      'recentTools',
      'theme',
      'locale',
      'sidebarCollapsed',
      'history',
    ])
  })

  it('splits categories between settings and data groups', () => {
    expect(EXPORT_CATEGORIES.some((c) => c.group === 'settings')).toBe(true)
    expect(EXPORT_CATEGORIES.some((c) => c.group === 'data')).toBe(true)
  })
})
