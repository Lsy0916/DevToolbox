/**
 * 数据管理（导入/导出/清理）工具集
 *
 * - 支持按分类（收藏、最近、主题、语言、历史等）导出为 JSON 备份
 * - 解析导入文件并按选中分类应用到本地设置与 IndexedDB
 * - 提供分类清理与默认全选集合管理
 */
import type { AppSettings, FavoritesGroup, HistoryItem } from '@/types'
import { getSettings, saveSettings } from '@/utils/localStorage'
import { exportAllData, importAllData, clearAllHistory } from '@/utils/db'

export type ExportCategory =
  | 'favoritesGroups'
  | 'recentTools'
  | 'theme'
  | 'locale'
  | 'sidebarCollapsed'
  | 'history'

export interface CategoryMeta {
  key: ExportCategory
  labelKey: string
  descKey: string
  group: 'settings' | 'data'
}

export const EXPORT_CATEGORIES: CategoryMeta[] = [
  { key: 'favoritesGroups', labelKey: 'tools.datamanager.categories.favoritesGroups', descKey: 'tools.datamanager.categories.favoritesGroupsDesc', group: 'settings' },
  { key: 'recentTools', labelKey: 'tools.datamanager.categories.recentTools', descKey: 'tools.datamanager.categories.recentToolsDesc', group: 'settings' },
  { key: 'theme', labelKey: 'tools.datamanager.categories.theme', descKey: 'tools.datamanager.categories.themeDesc', group: 'settings' },
  { key: 'locale', labelKey: 'tools.datamanager.categories.locale', descKey: 'tools.datamanager.categories.localeDesc', group: 'settings' },
  { key: 'sidebarCollapsed', labelKey: 'tools.datamanager.categories.sidebarCollapsed', descKey: 'tools.datamanager.categories.sidebarCollapsedDesc', group: 'settings' },
  { key: 'history', labelKey: 'tools.datamanager.categories.history', descKey: 'tools.datamanager.categories.historyDesc', group: 'data' },
]

const ALL_CATEGORIES: ExportCategory[] = EXPORT_CATEGORIES.map((c) => c.key)

export interface ExportBundle {
  version: number
  exportedAt: string
  data: Partial<{
    favoritesGroups: FavoritesGroup[]
    recentTools: string[]
    theme: string
    locale: string
    sidebarCollapsed: boolean
    history: Array<Omit<HistoryItem, 'createdAt'> & { createdAt: string }>
  }>
}

export async function gatherExportData(selected: Set<ExportCategory>): Promise<ExportBundle['data']> {
  const settings = getSettings()
  const data: ExportBundle['data'] = {}

  if (selected.has('favoritesGroups')) {
    data.favoritesGroups = settings.favoritesGroups
  }
  if (selected.has('recentTools')) {
    data.recentTools = settings.recentTools
  }
  if (selected.has('theme')) {
    data.theme = settings.theme
  }
  if (selected.has('locale')) {
    data.locale = settings.locale
  }
  if (selected.has('sidebarCollapsed')) {
    data.sidebarCollapsed = settings.sidebarCollapsed
  }
  if (selected.has('history')) {
    const raw = await exportAllData()
    const parsed = JSON.parse(raw) as { history: ExportBundle['data']['history'] }
    data.history = parsed.history
  }

  return data
}

export function generateExportJson(data: ExportBundle['data']): string {
  const bundle: ExportBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  }
  return JSON.stringify(bundle, null, 2)
}

export function downloadJson(jsonStr: string): void {
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  a.download = `devtoolbox-backup-${ts}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export interface ParsedImport {
  bundle: ExportBundle | null
  error: string | null
  availableCategories: ExportCategory[]
}

export function parseImportJson(jsonStr: string): ParsedImport {
  try {
    const parsed = JSON.parse(jsonStr) as ExportBundle
    if (!parsed || typeof parsed !== 'object' || !parsed.data) {
      return { bundle: null, error: 'InvalidFormat', availableCategories: [] }
    }
    const available: ExportCategory[] = []
    const d = parsed.data
    if (Array.isArray(d.favoritesGroups)) available.push('favoritesGroups')
    if (Array.isArray(d.recentTools)) available.push('recentTools')
    if (typeof d.theme === 'string') available.push('theme')
    if (typeof d.locale === 'string') available.push('locale')
    if (typeof d.sidebarCollapsed === 'boolean') available.push('sidebarCollapsed')
    if (Array.isArray(d.history)) available.push('history')
    return { bundle: parsed, error: null, availableCategories: available }
  } catch {
    return { bundle: null, error: 'ParseError', availableCategories: [] }
  }
}

export async function applyImportData(
  bundle: ExportBundle,
  selected: Set<ExportCategory>,
): Promise<void> {
  const d = bundle.data
  const settingsPatch: Partial<AppSettings> = {}

  if (selected.has('favoritesGroups') && d.favoritesGroups) {
    settingsPatch.favoritesGroups = d.favoritesGroups
  }
  if (selected.has('recentTools') && d.recentTools) {
    settingsPatch.recentTools = d.recentTools
  }
  if (selected.has('theme') && d.theme) {
    settingsPatch.theme = d.theme === 'dark' ? 'dark' : 'light'
  }
  if (selected.has('locale') && d.locale) {
    settingsPatch.locale = d.locale === 'en-US' ? 'en-US' : 'zh-CN'
  }
  if (selected.has('sidebarCollapsed') && typeof d.sidebarCollapsed === 'boolean') {
    settingsPatch.sidebarCollapsed = d.sidebarCollapsed
  }

  if (Object.keys(settingsPatch).length > 0) {
    saveSettings(settingsPatch)
  }

  if (selected.has('history') && d.history) {
    await importAllData(JSON.stringify({ history: d.history }))
  }
}

export function getDefaultSelected(): Set<ExportCategory> {
  return new Set(ALL_CATEGORIES)
}

export async function clearSelectedData(selected: Set<ExportCategory>): Promise<void> {
  const patch: Partial<AppSettings> = {}

  if (selected.has('favoritesGroups')) {
    patch.favoritesGroups = []
  }
  if (selected.has('recentTools')) {
    patch.recentTools = []
  }
  if (selected.has('theme')) {
    patch.theme = 'light'
  }
  if (selected.has('locale')) {
    patch.locale = 'zh-CN'
  }
  if (selected.has('sidebarCollapsed')) {
    patch.sidebarCollapsed = false
  }
  if (Object.keys(patch).length > 0) {
    saveSettings(patch)
  }

  if (selected.has('history')) {
    await clearAllHistory()
  }
}
