import { describe, it, expect } from 'vitest'
import {
  CRON_PRESETS,
  CRON_DESCRIBE_FAILED,
  getFieldRange,
  validateCron,
  parseField,
  buildField,
  generateCron,
  describeCron,
  getNextRuns,
  getPreviousRuns,
  describeFields,
} from './cronUtils'
import type { CronGeneratorConfig } from './cronUtils'

describe('cronUtils', () => {
  // ---------- CRON_PRESETS ----------
  describe('CRON_PRESETS', () => {
    it('contains a non-empty list of presets', () => {
      expect(CRON_PRESETS.length).toBeGreaterThan(0)
    })
    it('every preset has name, nameKey, and expr', () => {
      for (const preset of CRON_PRESETS) {
        expect(typeof preset.name).toBe('string')
        expect(preset.name.length).toBeGreaterThan(0)
        expect(typeof preset.nameKey).toBe('string')
        expect(typeof preset.expr).toBe('string')
      }
    })
    it('includes the every-minute preset', () => {
      expect(CRON_PRESETS.some((p) => p.expr === '* * * * *')).toBe(true)
    })
    it('includes the every-5-minutes preset', () => {
      expect(CRON_PRESETS.some((p) => p.expr === '*/5 * * * *')).toBe(true)
    })
    it('includes the weekdays-9am preset', () => {
      expect(CRON_PRESETS.some((p) => p.expr === '0 9 * * 1-5')).toBe(true)
    })
    it('every preset expression has at least 5 fields', () => {
      for (const p of CRON_PRESETS) {
        expect(p.expr.split(/\s+/).length).toBeGreaterThanOrEqual(5)
      }
    })
  })

  // ---------- getFieldRange ----------
  describe('getFieldRange', () => {
    it('returns the minute range', () => {
      expect(getFieldRange('minute')).toEqual({ min: 0, max: 59 })
    })
    it('returns the hour range', () => {
      expect(getFieldRange('hour')).toEqual({ min: 0, max: 23 })
    })
    it('returns the day-of-month range', () => {
      expect(getFieldRange('dayOfMonth')).toEqual({ min: 1, max: 31 })
    })
    it('returns the month range', () => {
      expect(getFieldRange('month')).toEqual({ min: 1, max: 12 })
    })
    it('returns the day-of-week range', () => {
      expect(getFieldRange('dayOfWeek')).toEqual({ min: 0, max: 6 })
    })
  })

  // ---------- validateCron ----------
  describe('validateCron', () => {
    it('accepts a valid 5-field expression', () => {
      expect(validateCron('* * * * *')).toEqual({ valid: true })
    })
    it('accepts a valid complex expression', () => {
      expect(validateCron('0 9 * * 1-5').valid).toBe(true)
    })
    it('accepts */5 * * * *', () => {
      expect(validateCron('*/5 * * * *').valid).toBe(true)
    })
    it('accepts 0 0 1 1 *', () => {
      expect(validateCron('0 0 1 1 *').valid).toBe(true)
    })
    it('rejects an out-of-range field', () => {
      const result = validateCron('60 * * * *')
      expect(result.valid).toBe(false)
      expect(result.error).toBeTruthy()
    })
    it('rejects an out-of-range hour', () => {
      expect(validateCron('* 24 * * *').valid).toBe(false)
    })
    it('rejects an out-of-range day-of-month', () => {
      expect(validateCron('* * 32 * *').valid).toBe(false)
    })
    it('rejects an out-of-range month', () => {
      expect(validateCron('* * * 13 *').valid).toBe(false)
    })
    it('rejects an expression with too many fields (7 fields)', () => {
      // cron-parser v5 accepts up to 6 fields (with seconds); 7 is invalid
      const result = validateCron('* * * * * * *')
      expect(result.valid).toBe(false)
    })
    it('rejects non-numeric garbage', () => {
      const result = validateCron('abc def ghi jkl mno')
      expect(result.valid).toBe(false)
      expect(result.error).toBeTruthy()
    })
    it('returns an error message string on failure', () => {
      const result = validateCron('99 * * * *')
      expect(result.valid).toBe(false)
      expect(typeof result.error).toBe('string')
      expect(result.error!.length).toBeGreaterThan(0)
    })
  })

  // ---------- parseField ----------
  describe('parseField', () => {
    it('parses "*" as every', () => {
      expect(parseField('*')).toEqual({ mode: 'every', values: [] })
    })
    it('parses an empty string as every', () => {
      expect(parseField('')).toEqual({ mode: 'every', values: [] })
    })
    it('parses "*/5" as a step', () => {
      expect(parseField('*/5')).toEqual({ mode: 'step', values: [], step: 5 })
    })
    it('parses "*/15" as a step', () => {
      expect(parseField('*/15')).toEqual({ mode: 'step', values: [], step: 15 })
    })
    it('parses "1,2,3" as a list', () => {
      expect(parseField('1,2,3')).toEqual({ mode: 'list', values: [1, 2, 3] })
    })
    it('parses "1-5" as a range', () => {
      expect(parseField('1-5')).toEqual({ mode: 'range', values: [1, 5] })
    })
    it('parses "30" as a specific value', () => {
      expect(parseField('30')).toEqual({ mode: 'specific', values: [30] })
    })
    it('marks a non-numeric value as invalid', () => {
      expect(parseField('abc')).toEqual({ mode: 'every', values: [], invalid: true })
    })
    it('marks a step of 0 as invalid', () => {
      expect(parseField('*/0')).toEqual({ mode: 'every', values: [], invalid: true })
    })
    it('marks a list with non-numeric entries as invalid', () => {
      expect(parseField('1,abc,3')).toEqual({ mode: 'every', values: [], invalid: true })
    })
    it('marks a range with non-numeric entries as invalid', () => {
      expect(parseField('1-abc')).toEqual({ mode: 'every', values: [], invalid: true })
    })
    it('trims whitespace before parsing', () => {
      expect(parseField('  30  ')).toEqual({ mode: 'specific', values: [30] })
      expect(parseField('  *  ')).toEqual({ mode: 'every', values: [] })
    })
  })

  // ---------- buildField ----------
  describe('buildField', () => {
    it('builds an every field', () => {
      expect(buildField('every', [])).toBe('*')
    })
    it('builds a step field', () => {
      expect(buildField('step', [], 5)).toBe('*/5')
    })
    it('defaults the step to 1 when undefined', () => {
      expect(buildField('step', [])).toBe('*/1')
    })
    it('builds a range field', () => {
      expect(buildField('range', [1, 5])).toBe('1-5')
    })
    it('falls back to "*" for a range with fewer than 2 values', () => {
      expect(buildField('range', [1])).toBe('*')
      expect(buildField('range', [])).toBe('*')
    })
    it('builds a list field', () => {
      expect(buildField('list', [1, 2, 3])).toBe('1,2,3')
    })
    it('falls back to "*" for an empty list', () => {
      expect(buildField('list', [])).toBe('*')
    })
    it('builds a specific field', () => {
      expect(buildField('specific', [30])).toBe('30')
    })
    it('falls back to "*" for specific with empty values', () => {
      expect(buildField('specific', [])).toBe('*')
    })
  })

  // ---------- generateCron ----------
  describe('generateCron', () => {
    it('generates every-minute with count 1', () => {
      const config: CronGeneratorConfig = {
        frequency: 'everyMinute', count: 1, hour: 0, minute: 0, daysOfWeek: [], dayOfMonth: 1,
      }
      expect(generateCron(config)).toBe('* * * * *')
    })
    it('generates every-N-minutes', () => {
      const config: CronGeneratorConfig = {
        frequency: 'everyMinute', count: 5, hour: 0, minute: 0, daysOfWeek: [], dayOfMonth: 1,
      }
      expect(generateCron(config)).toBe('*/5 * * * *')
    })
    it('generates every-hour', () => {
      const config: CronGeneratorConfig = {
        frequency: 'everyHour', count: 6, hour: 0, minute: 0, daysOfWeek: [], dayOfMonth: 1,
      }
      expect(generateCron(config)).toBe('0 */6 * * *')
    })
    it('generates every-hour with count 1', () => {
      const config: CronGeneratorConfig = {
        frequency: 'everyHour', count: 1, hour: 0, minute: 0, daysOfWeek: [], dayOfMonth: 1,
      }
      expect(generateCron(config)).toBe('0 * * * *')
    })
    it('generates every-day at a given time', () => {
      const config: CronGeneratorConfig = {
        frequency: 'everyDay', count: 1, hour: 9, minute: 30, daysOfWeek: [], dayOfMonth: 1,
      }
      expect(generateCron(config)).toBe('30 9 * * *')
    })
    it('generates every-week on selected days', () => {
      const config: CronGeneratorConfig = {
        frequency: 'everyWeek', count: 1, hour: 0, minute: 0, daysOfWeek: [3, 1], dayOfMonth: 1,
      }
      expect(generateCron(config)).toBe('0 0 * * 1,3')
    })
    it('generates every-month on a given day', () => {
      const config: CronGeneratorConfig = {
        frequency: 'everyMonth', count: 1, hour: 0, minute: 0, daysOfWeek: [], dayOfMonth: 15,
      }
      expect(generateCron(config)).toBe('0 0 15 * *')
    })
    it('generates a custom expression', () => {
      const config: CronGeneratorConfig = {
        frequency: 'custom', count: 1, hour: 9, minute: 30, daysOfWeek: [1, 3, 5], dayOfMonth: 15,
      }
      expect(generateCron(config)).toBe('30 9 15 * 1,3,5')
    })
    it('clamps hour/minute to valid ranges', () => {
      const config: CronGeneratorConfig = {
        frequency: 'everyDay', count: 1, hour: 25, minute: -5, daysOfWeek: [], dayOfMonth: 1,
      }
      expect(generateCron(config)).toBe('0 23 * * *')
    })
    it('clamps dayOfMonth to 1-31', () => {
      const config: CronGeneratorConfig = {
        frequency: 'everyMonth', count: 1, hour: 0, minute: 0, daysOfWeek: [], dayOfMonth: 50,
      }
      expect(generateCron(config)).toBe('0 0 31 * *')
    })
    it('clamps count to minimum 1', () => {
      const config: CronGeneratorConfig = {
        frequency: 'everyMinute', count: 0, hour: 0, minute: 0, daysOfWeek: [], dayOfMonth: 1,
      }
      expect(generateCron(config)).toBe('* * * * *')
    })
    it('filters out invalid days of week and sorts them', () => {
      const config: CronGeneratorConfig = {
        frequency: 'everyWeek', count: 1, hour: 0, minute: 0, daysOfWeek: [5, 1, 8, -1, 3], dayOfMonth: 1,
      }
      expect(generateCron(config)).toBe('0 0 * * 1,3,5')
    })
    it('uses "*" for daysOfWeek when empty', () => {
      const config: CronGeneratorConfig = {
        frequency: 'everyWeek', count: 1, hour: 0, minute: 0, daysOfWeek: [], dayOfMonth: 1,
      }
      expect(generateCron(config)).toBe('0 0 * * *')
    })
  })

  // ---------- describeCron ----------
  describe('describeCron', () => {
    it('describes a valid expression in English', () => {
      const result = describeCron('* * * * *', 'en')
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      expect(result).not.toBe(CRON_DESCRIBE_FAILED)
    })
    it('describes "Every minute" for * * * * *', () => {
      expect(describeCron('* * * * *', 'en')).toBe('Every minute')
    })
    it('describes */5 * * * * in English', () => {
      const desc = describeCron('*/5 * * * *')
      expect(desc).not.toBe(CRON_DESCRIBE_FAILED)
      expect(desc.toLowerCase()).toContain('5')
    })
    it('describes a valid expression in Chinese', () => {
      const result = describeCron('0 0 * * *', 'zh-CN')
      expect(result.length).toBeGreaterThan(0)
      expect(result).not.toBe(CRON_DESCRIBE_FAILED)
    })
    it('defaults to English for unknown locale', () => {
      const result = describeCron('*/5 * * * *', 'fr')
      expect(result).not.toBe(CRON_DESCRIBE_FAILED)
    })
    it('defaults locale to en when not specified', () => {
      const result = describeCron('* * * * *')
      expect(result).not.toBe(CRON_DESCRIBE_FAILED)
    })
    it('returns the failed marker for an invalid expression', () => {
      expect(describeCron('abc', 'en')).toBe(CRON_DESCRIBE_FAILED)
    })
  })

  // ---------- getNextRuns ----------
  describe('getNextRuns', () => {
    it('returns the requested number of future runs for a valid expression', () => {
      const runs = getNextRuns('* * * * *', 3)
      expect(runs).toHaveLength(3)
      for (const run of runs) {
        expect(run.date).toBeInstanceOf(Date)
        expect(typeof run.formatted).toBe('string')
        expect(run.formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
      }
    })
    it('returns runs in ascending chronological order', () => {
      const runs = getNextRuns('0 * * * *', 5)
      for (let i = 1; i < runs.length; i++) {
        expect(runs[i].date.getTime()).toBeGreaterThan(runs[i - 1].date.getTime())
      }
    })
    it('returns runs 5 minutes apart for "*/5 * * * *"', () => {
      const runs = getNextRuns('*/5 * * * *', 3)
      for (let i = 1; i < runs.length; i++) {
        const diff = runs[i].date.getTime() - runs[i - 1].date.getTime()
        expect(diff).toBe(5 * 60 * 1000)
      }
    })
    it('returns runs 1 hour apart for "0 * * * *"', () => {
      const runs = getNextRuns('0 * * * *', 3)
      for (let i = 1; i < runs.length; i++) {
        const diff = runs[i].date.getTime() - runs[i - 1].date.getTime()
        expect(diff).toBe(60 * 60 * 1000)
      }
    })
    it('defaults to 5 runs', () => {
      expect(getNextRuns('* * * * *')).toHaveLength(5)
    })
    it('returns an empty array for count 0', () => {
      expect(getNextRuns('* * * * *', 0)).toEqual([])
    })
    it('returns an empty array for an invalid expression', () => {
      expect(getNextRuns('invalid', 3)).toEqual([])
    })
  })

  // ---------- getPreviousRuns ----------
  describe('getPreviousRuns', () => {
    it('returns the requested number of past runs for a valid expression', () => {
      const runs = getPreviousRuns('* * * * *', 3)
      expect(runs).toHaveLength(3)
      for (const run of runs) {
        expect(run.date).toBeInstanceOf(Date)
      }
    })
    it('returns runs in ascending chronological order', () => {
      const runs = getPreviousRuns('* * * * *', 3)
      expect(runs[0].date.getTime()).toBeLessThanOrEqual(runs[1].date.getTime())
      expect(runs[1].date.getTime()).toBeLessThanOrEqual(runs[2].date.getTime())
    })
    it('returns runs 5 minutes apart for "*/5 * * * *"', () => {
      const runs = getPreviousRuns('*/5 * * * *', 3)
      for (let i = 1; i < runs.length; i++) {
        const diff = runs[i].date.getTime() - runs[i - 1].date.getTime()
        expect(diff).toBe(5 * 60 * 1000)
      }
    })
    it('defaults to 5 runs', () => {
      expect(getPreviousRuns('* * * * *')).toHaveLength(5)
    })
    it('returns an empty array for count 0', () => {
      expect(getPreviousRuns('* * * * *', 0)).toEqual([])
    })
    it('returns an empty array for an invalid expression', () => {
      expect(getPreviousRuns('invalid', 3)).toEqual([])
    })
    it('all previous runs are before or at now', () => {
      const now = Date.now()
      const runs = getPreviousRuns('*/5 * * * *', 3)
      for (const r of runs) {
        expect(r.date.getTime()).toBeLessThanOrEqual(now)
      }
    })
  })

  // ---------- describeFields ----------
  describe('describeFields', () => {
    it('returns 5 field descriptors', () => {
      const fields = describeFields('* * * * *')
      expect(fields).toHaveLength(5)
      for (const f of fields) {
        expect(typeof f.name).toBe('string')
        expect(typeof f.value).toBe('string')
        expect(typeof f.meaningKey).toBe('string')
      }
    })
    it('field names are minute, hour, dayOfMonth, month, dayOfWeek', () => {
      const fields = describeFields('* * * * *')
      expect(fields.map((f) => f.name)).toEqual([
        'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek',
      ])
    })
    it('classifies "*" as every', () => {
      const fields = describeFields('* * * * *')
      for (const f of fields) {
        expect(f.meaningKey).toBe('tools.cron.fieldDesc.every')
      }
    })
    it('classifies "*" as every and a number as specific', () => {
      const fields = describeFields('0 9 * * *')
      expect(fields[0].meaningKey).toBe('tools.cron.fieldDesc.specific')
      expect(fields[2].meaningKey).toBe('tools.cron.fieldDesc.every')
    })
    it('classifies a range field', () => {
      const fields = describeFields('0 0 * * 1-5')
      expect(fields[4].meaningKey).toBe('tools.cron.fieldDesc.range')
      expect(fields[4].meaningParams?.value).toBe('1-5')
    })
    it('classifies a step field', () => {
      const fields = describeFields('*/5 * * * *')
      expect(fields[0].meaningKey).toBe('tools.cron.fieldDesc.step')
      expect(fields[0].meaningParams?.step).toBe('5')
    })
    it('classifies a list field', () => {
      const fields = describeFields('0 0 * * 6,0')
      expect(fields[4].meaningKey).toBe('tools.cron.fieldDesc.list')
      expect(fields[4].meaningParams?.value).toBe('6,0')
    })
    it('meaningParams contains the field key', () => {
      const fields = describeFields('0 9 * * *')
      expect(fields[0].meaningParams?.field).toBe('tools.cron.fields.minute')
      expect(fields[1].meaningParams?.field).toBe('tools.cron.fields.hour')
    })
    it('handles short expression by defaulting missing fields to "*"', () => {
      const fields = describeFields('0 0')
      expect(fields[0].value).toBe('0')
      expect(fields[1].value).toBe('0')
      expect(fields[2].value).toBe('*')
      expect(fields[3].value).toBe('*')
      expect(fields[4].value).toBe('*')
    })
  })
})
