import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ComposerTranslation } from 'vue-i18n'
import { formatRelativeTime } from './formatTime'

// Mock t function: returns the key plus serialized params so the tests can
// verify which translation key was used and with which arguments.
function makeT() {
  return vi.fn((key: string, params?: Record<string, unknown>) => {
    if (params && 'n' in params) return `${key}:${String(params.n)}`
    return key
  })
}

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-03T12:00:00'))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('returns justNow for the current time', () => {
    const t = makeT()
    expect(formatRelativeTime(new Date(), t as unknown as ComposerTranslation)).toBe(
      'common.relativeTime.justNow',
    )
    expect(t).toHaveBeenCalledWith('common.relativeTime.justNow')
  })

  it('returns justNow for 30 seconds ago', () => {
    const t = makeT()
    const date = new Date(Date.now() - 30 * 1000)
    expect(formatRelativeTime(date, t as unknown as ComposerTranslation)).toBe(
      'common.relativeTime.justNow',
    )
  })

  it('returns justNow for a future date (diff < 0)', () => {
    const t = makeT()
    const date = new Date(Date.now() + 60 * 1000)
    expect(formatRelativeTime(date, t as unknown as ComposerTranslation)).toBe(
      'common.relativeTime.justNow',
    )
  })

  it('returns justNow at 59 seconds (boundary just under 60s)', () => {
    const t = makeT()
    const date = new Date(Date.now() - 59 * 1000)
    expect(formatRelativeTime(date, t as unknown as ComposerTranslation)).toBe(
      'common.relativeTime.justNow',
    )
  })

  it('returns minutesAgo:1 at exactly 60 seconds', () => {
    const t = makeT()
    const date = new Date(Date.now() - 60 * 1000)
    expect(formatRelativeTime(date, t as unknown as ComposerTranslation)).toBe(
      'common.relativeTime.minutesAgo:1',
    )
    expect(t).toHaveBeenCalledWith('common.relativeTime.minutesAgo', { n: 1 })
  })

  it('returns minutesAgo for 5 minutes ago', () => {
    const t = makeT()
    const date = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatRelativeTime(date, t as unknown as ComposerTranslation)).toBe(
      'common.relativeTime.minutesAgo:5',
    )
  })

  it('returns minutesAgo:59 at just under 60 minutes', () => {
    const t = makeT()
    const date = new Date(Date.now() - 59 * 60 * 1000)
    expect(formatRelativeTime(date, t as unknown as ComposerTranslation)).toBe(
      'common.relativeTime.minutesAgo:59',
    )
  })

  it('returns hoursAgo:1 at exactly 60 minutes', () => {
    const t = makeT()
    const date = new Date(Date.now() - 60 * 60 * 1000)
    expect(formatRelativeTime(date, t as unknown as ComposerTranslation)).toBe(
      'common.relativeTime.hoursAgo:1',
    )
  })

  it('returns hoursAgo for 3 hours ago', () => {
    const t = makeT()
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000)
    expect(formatRelativeTime(date, t as unknown as ComposerTranslation)).toBe(
      'common.relativeTime.hoursAgo:3',
    )
  })

  it('returns yesterday at exactly 24 hours', () => {
    const t = makeT()
    const date = new Date(Date.now() - 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(date, t as unknown as ComposerTranslation)).toBe(
      'common.relativeTime.yesterday',
    )
    expect(t).toHaveBeenCalledWith('common.relativeTime.yesterday')
  })

  it('returns yesterday for 30 hours ago', () => {
    const t = makeT()
    const date = new Date(Date.now() - 30 * 60 * 60 * 1000)
    expect(formatRelativeTime(date, t as unknown as ComposerTranslation)).toBe(
      'common.relativeTime.yesterday',
    )
  })

  it('returns daysAgo:2 at exactly 48 hours (no longer "yesterday")', () => {
    const t = makeT()
    const date = new Date(Date.now() - 48 * 60 * 60 * 1000)
    expect(formatRelativeTime(date, t as unknown as ComposerTranslation)).toBe(
      'common.relativeTime.daysAgo:2',
    )
  })

  it('returns daysAgo for 3 days ago', () => {
    const t = makeT()
    const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(date, t as unknown as ComposerTranslation)).toBe(
      'common.relativeTime.daysAgo:3',
    )
  })

  it('returns daysAgo:6 at exactly 6 days', () => {
    const t = makeT()
    const date = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(date, t as unknown as ComposerTranslation)).toBe(
      'common.relativeTime.daysAgo:6',
    )
  })

  it('returns a formatted YYYY-MM-DD date at exactly 7 days and beyond', () => {
    const t = makeT()
    // now = 2026-07-03T12:00:00 local; 7 days earlier = 2026-06-26T12:00:00 local
    const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const result = formatRelativeTime(date, t as unknown as ComposerTranslation)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result).toBe('2026-06-26')
  })

  it('returns a formatted date for 30 days ago', () => {
    const t = makeT()
    const date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const result = formatRelativeTime(date, t as unknown as ComposerTranslation)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('zero-pads month and day in the formatted date', () => {
    const t = makeT()
    // Use a date far enough in the past to trigger the formatted branch.
    // now = 2026-07-03; pick 2026-01-05 (well over 7 days ago) by setting the
    // input date directly via its timestamp relative to the fixed "now".
    const target = new Date('2026-01-05T00:00:00')
    // Ensure it is more than 7 days before "now"
    const diff = Date.now() - target.getTime()
    expect(diff).toBeGreaterThan(7 * 24 * 60 * 60 * 1000)
    const result = formatRelativeTime(target, t as unknown as ComposerTranslation)
    expect(result).toBe('2026-01-05')
  })
})
