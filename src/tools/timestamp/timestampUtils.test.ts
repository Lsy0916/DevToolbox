import { describe, it, expect } from 'vitest'
import {
  detectUnit,
  timestampToDate,
  dateToTimestamp,
  formatLocal,
  formatUtc,
  formatIso,
  formatCustom,
  parseDate,
  getTimezone,
  getTimezoneOffset,
  formatRelative,
  diffTimestamps,
  getCurrentTimestamp,
} from './timestampUtils'

describe('timestampUtils', () => {
  // ---------- detectUnit ----------
  describe('detectUnit', () => {
    it('returns "s" for second timestamps (< 1e12)', () => {
      expect(detectUnit(1700000000)).toBe('s')
    })
    it('returns "s" for 0', () => {
      expect(detectUnit(0)).toBe('s')
    })
    it('returns "s" for 999999999999 (1e12 - 1)', () => {
      expect(detectUnit(999999999999)).toBe('s')
    })
    it('returns "s" for negative timestamps', () => {
      expect(detectUnit(-1)).toBe('s')
      expect(detectUnit(-1000000)).toBe('s')
    })
    it('returns "ms" for millisecond timestamps (>= 1e12)', () => {
      expect(detectUnit(1700000000000)).toBe('ms')
    })
    it('treats exactly 1e12 as milliseconds', () => {
      expect(detectUnit(1e12)).toBe('ms')
    })
    it('returns "ms" for 1e13', () => {
      expect(detectUnit(1e13)).toBe('ms')
    })
  })

  // ---------- timestampToDate ----------
  describe('timestampToDate', () => {
    it('converts a second timestamp to Date', () => {
      expect(timestampToDate(1767225600, 's')).toEqual(new Date('2026-01-01T00:00:00Z'))
    })
    it('converts a millisecond timestamp to Date', () => {
      expect(timestampToDate(1767225600000, 'ms')).toEqual(new Date('2026-01-01T00:00:00Z'))
    })
    it('converts epoch 0 seconds to 1970-01-01', () => {
      const d = timestampToDate(0, 's')
      expect(d.getTime()).toBe(0)
      expect(d.toISOString()).toBe('1970-01-01T00:00:00.000Z')
    })
    it('converts epoch 0 milliseconds to 1970-01-01', () => {
      const d = timestampToDate(0, 'ms')
      expect(d.getTime()).toBe(0)
    })
    it('treats the same number differently based on unit', () => {
      expect(timestampToDate(1000, 's').getTime()).toBe(1000 * 1000)
      expect(timestampToDate(1000, 'ms').getTime()).toBe(1000)
    })
    it('handles negative timestamps (before epoch)', () => {
      const d = timestampToDate(-1, 's')
      expect(d.getTime()).toBe(-1000)
      expect(d.toISOString()).toBe('1969-12-31T23:59:59.000Z')
    })
  })

  // ---------- dateToTimestamp ----------
  describe('dateToTimestamp', () => {
    const date = new Date('2026-01-01T00:00:00Z')
    it('converts a Date to a second timestamp', () => {
      expect(dateToTimestamp(date, 's')).toBe(1767225600)
    })
    it('converts a Date to a millisecond timestamp', () => {
      expect(dateToTimestamp(date, 'ms')).toBe(1767225600000)
    })
    it('converts epoch Date to 0 in both units', () => {
      expect(dateToTimestamp(new Date(0), 's')).toBe(0)
      expect(dateToTimestamp(new Date(0), 'ms')).toBe(0)
    })
    it('floors to seconds (1500ms -> 1s)', () => {
      expect(dateToTimestamp(new Date(1500), 's')).toBe(1)
      expect(dateToTimestamp(new Date(1999), 's')).toBe(1)
    })
    it('preserves milliseconds exactly', () => {
      expect(dateToTimestamp(new Date(1500), 'ms')).toBe(1500)
    })
  })

  // ---------- round-trip conversions ----------
  describe('round-trip conversions', () => {
    it('round-trips seconds through Date and back', () => {
      const ts = 1767225600
      expect(dateToTimestamp(timestampToDate(ts, 's'), 's')).toBe(ts)
    })
    it('round-trips milliseconds through Date and back', () => {
      const ts = 1767225600000
      expect(dateToTimestamp(timestampToDate(ts, 'ms'), 'ms')).toBe(ts)
    })
  })

  // ---------- formatLocal ----------
  describe('formatLocal', () => {
    it('returns a non-empty string', () => {
      const result = formatLocal(new Date('2026-01-01T00:00:00Z'))
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
    it('matches Date.toLocaleString output', () => {
      const d = new Date(0)
      expect(formatLocal(d)).toBe(d.toLocaleString())
    })
  })

  // ---------- formatUtc ----------
  describe('formatUtc', () => {
    it('formats a Date as a UTC string', () => {
      expect(formatUtc(new Date('2026-01-01T00:00:00Z'))).toBe('Thu, 01 Jan 2026 00:00:00 GMT')
    })
    it('formats epoch as 1970 UTC string', () => {
      expect(formatUtc(new Date(0))).toBe('Thu, 01 Jan 1970 00:00:00 GMT')
    })
    it('matches Date.toUTCString output', () => {
      const d = new Date(1700000000000)
      expect(formatUtc(d)).toBe(d.toUTCString())
    })
  })

  // ---------- formatIso ----------
  describe('formatIso', () => {
    it('formats a Date as an ISO string', () => {
      expect(formatIso(new Date('2026-01-01T00:00:00Z'))).toBe('2026-01-01T00:00:00.000Z')
    })
    it('formats epoch as 1970 ISO string', () => {
      expect(formatIso(new Date(0))).toBe('1970-01-01T00:00:00.000Z')
    })
  })

  // ---------- formatCustom ----------
  describe('formatCustom', () => {
    it('formats using local time components', () => {
      const date = new Date(2026, 0, 1, 12, 30, 45)
      expect(formatCustom(date, 'YYYY-MM-DD HH:mm:ss')).toBe('2026-01-01 12:30:45')
    })
    it('supports partial format tokens', () => {
      const date = new Date(2026, 5, 15, 8, 5, 0)
      expect(formatCustom(date, 'YYYY/MM/DD')).toBe('2026/06/15')
    })
    it('returns the format string unchanged when no tokens match', () => {
      const date = new Date(2026, 0, 1)
      expect(formatCustom(date, 'hello')).toBe('hello')
    })
    it('formats time only', () => {
      const d = new Date(2023, 0, 1, 9, 5, 3)
      expect(formatCustom(d, 'HH:mm:ss')).toBe('09:05:03')
    })
    it('formats compact date', () => {
      const d = new Date(2023, 0, 1, 0, 0, 0)
      expect(formatCustom(d, 'YYYYMMDD')).toBe('20230101')
    })
    it('returns empty string for empty format', () => {
      expect(formatCustom(new Date(2023, 0, 1), '')).toBe('')
    })
    it('pads single-digit month/day', () => {
      const d = new Date(2023, 1, 2) // Feb 2
      expect(formatCustom(d, 'MM-DD')).toBe('02-02')
    })
  })

  // ---------- parseDate ----------
  describe('parseDate', () => {
    it('parses a valid ISO date string', () => {
      const result = parseDate('2026-01-01T00:00:00Z')
      expect(result).not.toBeNull()
      expect(result?.getTime()).toBe(new Date('2026-01-01T00:00:00Z').getTime())
    })
    it('parses a date-only string', () => {
      expect(parseDate('2026-01-01')).not.toBeNull()
    })
    it('trims whitespace before parsing', () => {
      const d = parseDate('  2023-01-01T00:00:00Z  ')
      expect(d).not.toBeNull()
    })
    it('returns null for an empty string', () => {
      expect(parseDate('')).toBeNull()
    })
    it('returns null for a whitespace-only string', () => {
      expect(parseDate('   ')).toBeNull()
    })
    it('returns null for an invalid date string', () => {
      expect(parseDate('not a date')).toBeNull()
    })
    it('returns null for "invalid"', () => {
      expect(parseDate('invalid')).toBeNull()
    })
  })

  // ---------- getTimezone ----------
  describe('getTimezone', () => {
    it('returns a non-empty timezone string', () => {
      const tz = getTimezone()
      expect(typeof tz).toBe('string')
      expect(tz.length).toBeGreaterThan(0)
    })
  })

  // ---------- getTimezoneOffset ----------
  describe('getTimezoneOffset', () => {
    it('returns a string matching the UTC offset format', () => {
      expect(getTimezoneOffset()).toMatch(/^UTC[+-]\d+(:\d{2})?$/)
    })
  })

  // ---------- formatRelative ----------
  describe('formatRelative', () => {
    it('returns seconds for a diff under 60 seconds (future)', () => {
      // ts=30s, now=0 → 30 seconds future
      expect(formatRelative(30, 's', 0)).toEqual({ value: 30, unit: 'second', isPast: false })
    })
    it('returns minutes for a diff under 1 hour', () => {
      // ts=120s, now=0 → 2 minutes future
      expect(formatRelative(120, 's', 0)).toEqual({ value: 2, unit: 'minute', isPast: false })
    })
    it('returns hours for a diff under 1 day', () => {
      // ts=7200s, now=0 → 2 hours future
      expect(formatRelative(7200, 's', 0)).toEqual({ value: 2, unit: 'hour', isPast: false })
    })
    it('returns days for a diff under 30 days', () => {
      // ts=172800s, now=0 → 2 days future
      expect(formatRelative(172800, 's', 0)).toEqual({ value: 2, unit: 'day', isPast: false })
    })
    it('returns months for a diff under 1 year', () => {
      // ts=5184000s, now=0 → 2 months future
      expect(formatRelative(5184000, 's', 0)).toEqual({ value: 2, unit: 'month', isPast: false })
    })
    it('returns years for a diff of at least 1 year', () => {
      // ts=63072000s, now=0 → 2 years future
      expect(formatRelative(63072000, 's', 0)).toEqual({ value: 2, unit: 'year', isPast: false })
    })

    it('returns 0 seconds for identical time', () => {
      const now = 1000000
      expect(formatRelative(now, 'ms', now)).toEqual({ value: 0, unit: 'second', isPast: false })
    })
    it('returns seconds at boundary 59s', () => {
      // 59000ms = 59s → second
      expect(formatRelative(59000, 'ms', 0)).toEqual({ value: 59, unit: 'second', isPast: false })
    })
    it('returns minutes at boundary 60s', () => {
      // 60000ms = 60s → minute
      expect(formatRelative(60000, 'ms', 0)).toEqual({ value: 1, unit: 'minute', isPast: false })
    })
    it('returns hours at boundary 3600s', () => {
      expect(formatRelative(3600 * 1000, 'ms', 0)).toEqual({ value: 1, unit: 'hour', isPast: false })
    })
    it('returns days at boundary 86400s', () => {
      expect(formatRelative(86400 * 1000, 'ms', 0)).toEqual({ value: 1, unit: 'day', isPast: false })
    })
    it('returns months at boundary 2592000s (30 days)', () => {
      expect(formatRelative(2592000 * 1000, 'ms', 0)).toEqual({ value: 1, unit: 'month', isPast: false })
    })
    it('returns years at boundary 31536000s (365 days)', () => {
      expect(formatRelative(31536000 * 1000, 'ms', 0)).toEqual({ value: 1, unit: 'year', isPast: false })
    })

    it('sets isPast=true when the timestamp is before now', () => {
      // ts=0s (0ms), now=60000ms (60s) → 60 seconds in the past → 1 minute
      expect(formatRelative(0, 's', 60000)).toEqual({ value: 1, unit: 'minute', isPast: true })
    })
    it('marks future correctly (isPast=false)', () => {
      // ts=100s, now=0 → 100 seconds future → 1 minute
      expect(formatRelative(100, 's', 0).isPast).toBe(false)
    })
    it('handles millisecond unit', () => {
      // ts=30000ms, now=0 → 30 seconds future
      expect(formatRelative(30000, 'ms', 0)).toEqual({ value: 30, unit: 'second', isPast: false })
    })
    it('defaults unit to seconds', () => {
      // ts=100s, now=0 → 1 minute future (default unit = 's')
      expect(formatRelative(100, undefined as never, 0)).toEqual({ value: 1, unit: 'minute', isPast: false })
    })
    it('uses Date.now() as default now', () => {
      const future = Date.now() + 5000 // 5s in the future (ms)
      const result = formatRelative(future, 'ms')
      expect(result.unit).toBe('second')
      expect(result.isPast).toBe(false)
    })
  })

  // ---------- diffTimestamps ----------
  describe('diffTimestamps', () => {
    it('returns zero diff for equal timestamps', () => {
      expect(diffTimestamps(100, 100, 's')).toEqual({
        days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0,
      })
    })
    it('computes a 1-day diff in seconds', () => {
      expect(diffTimestamps(0, 86400, 's')).toEqual({
        days: 1, hours: 0, minutes: 0, seconds: 0, totalSeconds: 86400,
      })
    })
    it('computes a 1d 1h 1m 1s diff', () => {
      expect(diffTimestamps(0, 90061, 's')).toEqual({
        days: 1, hours: 1, minutes: 1, seconds: 1, totalSeconds: 90061,
      })
    })
    it('handles millisecond unit', () => {
      expect(diffTimestamps(0, 86400000, 'ms')).toEqual({
        days: 1, hours: 0, minutes: 0, seconds: 0, totalSeconds: 86400,
      })
    })
    it('uses absolute difference regardless of argument order', () => {
      expect(diffTimestamps(86400, 0, 's').totalSeconds).toBe(86400)
    })
    it('defaults to seconds unit', () => {
      expect(diffTimestamps(0, 60).totalSeconds).toBe(60)
    })
    it('handles large differences (365 days)', () => {
      const r = diffTimestamps(0, 31536000, 's')
      expect(r.days).toBe(365)
      expect(r.totalSeconds).toBe(31536000)
    })
  })

  // ---------- getCurrentTimestamp ----------
  describe('getCurrentTimestamp', () => {
    it('returns a second timestamp within the current second', () => {
      const before = Math.floor(Date.now() / 1000)
      const ts = getCurrentTimestamp('s')
      const after = Math.floor(Date.now() / 1000)
      expect(ts).toBeGreaterThanOrEqual(before)
      expect(ts).toBeLessThanOrEqual(after)
    })
    it('returns a millisecond timestamp close to Date.now()', () => {
      const before = Date.now()
      const ts = getCurrentTimestamp('ms')
      const after = Date.now()
      expect(ts).toBeGreaterThanOrEqual(before)
      expect(ts).toBeLessThanOrEqual(after)
    })
    it('defaults to seconds unit', () => {
      const ts = getCurrentTimestamp()
      expect(ts).toBeGreaterThan(1e9) // plausible seconds value
      expect(ts).toBeLessThan(1e12) // not in ms range
    })
  })
})
