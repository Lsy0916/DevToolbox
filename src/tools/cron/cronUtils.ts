/**
 * Cron 表达式解析与生成工具集
 *
 * - 基于 cron-parser 校验表达式并计算下次/上次执行时间
 * - 基于 cronstrue 生成人类可读描述（支持中英文）
 * - 支持字段级解析/构建及结构化表达式生成器
 */
import cronParser from 'cron-parser'
import cronstrue from 'cronstrue'
import 'cronstrue/locales/zh_CN'
import type { CronNextRun, CronFieldDesc } from '@/types'

export interface CronPreset {
  name: string
  expr: string
  nameKey: string
}

export const CRON_PRESETS: CronPreset[] = [
  { name: 'Every minute', nameKey: 'tools.cron.presets.everyMinute', expr: '* * * * *' },
  { name: 'Every 5 minutes', nameKey: 'tools.cron.presets.every5Min', expr: '*/5 * * * *' },
  { name: 'Every 15 minutes', nameKey: 'tools.cron.presets.every15Min', expr: '*/15 * * * *' },
  { name: 'Every 30 minutes', nameKey: 'tools.cron.presets.every30Min', expr: '*/30 * * * *' },
  { name: 'Every hour', nameKey: 'tools.cron.presets.everyHour', expr: '0 * * * *' },
  { name: 'Every 12 hours', nameKey: 'tools.cron.presets.every12Hour', expr: '0 */12 * * *' },
  { name: 'Every day at midnight', nameKey: 'tools.cron.presets.daily', expr: '0 0 * * *' },
  { name: 'Every day at 9am', nameKey: 'tools.cron.presets.daily9am', expr: '0 9 * * *' },
  { name: 'Every Sunday', nameKey: 'tools.cron.presets.sunday', expr: '0 0 * * 0' },
  { name: 'Every Monday', nameKey: 'tools.cron.presets.monday', expr: '0 0 * * 1' },
  { name: 'Weekdays at 9am', nameKey: 'tools.cron.presets.weekdays9am', expr: '0 9 * * 1-5' },
  { name: 'Weekends', nameKey: 'tools.cron.presets.weekends', expr: '0 0 * * 6,0' },
  { name: 'First of month', nameKey: 'tools.cron.presets.firstOfMonth', expr: '0 0 1 * *' },
  { name: 'Every 15 days', nameKey: 'tools.cron.presets.every15Days', expr: '0 0 */15 * *' },
  { name: 'Quarterly', nameKey: 'tools.cron.presets.quarterly', expr: '0 0 1 */3 *' },
  { name: 'Half year', nameKey: 'tools.cron.presets.halfYear', expr: '0 0 1 1,7 *' },
  { name: 'New year', nameKey: 'tools.cron.presets.newYear', expr: '0 0 1 1 *' },
]

const FIELD_DEFS = [
  { name: 'minute', nameKey: 'tools.cron.fields.minute', range: '0-59', min: 0, max: 59 },
  { name: 'hour', nameKey: 'tools.cron.fields.hour', range: '0-23', min: 0, max: 23 },
  { name: 'dayOfMonth', nameKey: 'tools.cron.fields.dayOfMonth', range: '1-31', min: 1, max: 31 },
  { name: 'month', nameKey: 'tools.cron.fields.month', range: '1-12', min: 1, max: 12 },
  { name: 'dayOfWeek', nameKey: 'tools.cron.fields.dayOfWeek', range: '0-6 (0=Sun)', min: 0, max: 6 },
] as const

export type FieldName = 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek'
export type FieldMode = 'every' | 'step' | 'range' | 'list' | 'specific'

export interface ParsedField {
  mode: FieldMode
  values: number[]
  step?: number
  invalid?: boolean
}

export function getFieldRange(field: FieldName): { min: number; max: number } {
  const def = FIELD_DEFS.find((d) => d.name === field)
  return def ? { min: def.min, max: def.max } : { min: 0, max: 59 }
}

export function validateCron(expr: string): { valid: boolean; error?: string } {
  try {
    cronParser.parse(expr)
    return { valid: true }
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : 'Invalid cron expression' }
  }
}

// === 字段级解析与构建 ===

export function parseField(value: string): ParsedField {
  const v = value.trim()
  if (!v || v === '*') return { mode: 'every', values: [] }
  if (v.startsWith('*/')) {
    const step = parseInt(v.slice(2), 10)
    if (isNaN(step) || step < 1) return { mode: 'every', values: [], invalid: true }
    return { mode: 'step', values: [], step }
  }
  if (v.includes(',')) {
    const parts = v.split(',').map((p) => parseInt(p.trim(), 10))
    if (parts.some(isNaN)) return { mode: 'every', values: [], invalid: true }
    return { mode: 'list', values: parts }
  }
  if (v.includes('-')) {
    const parts = v.split('-').map((p) => parseInt(p.trim(), 10))
    const a = parts[0] ?? NaN
    const b = parts[1] ?? NaN
    if (isNaN(a) || isNaN(b)) return { mode: 'every', values: [], invalid: true }
    return { mode: 'range', values: [a, b] }
  }
  const n = parseInt(v, 10)
  if (isNaN(n)) return { mode: 'every', values: [], invalid: true }
  return { mode: 'specific', values: [n] }
}

export function buildField(mode: FieldMode, values: number[], step?: number): string {
  switch (mode) {
    case 'every':
      return '*'
    case 'step':
      return `*/${step ?? 1}`
    case 'range':
      if (values.length < 2) return '*'
      return `${values[0]}-${values[1]}`
    case 'list':
      return values.length > 0 ? values.join(',') : '*'
    case 'specific':
      return values.length > 0 ? String(values[0]) : '*'
    default:
      return '*'
  }
}

// === 结构化生成器（保留兼容） ===

export type CronFrequencyType =
  | 'everyMinute'
  | 'everyHour'
  | 'everyDay'
  | 'everyWeek'
  | 'everyMonth'
  | 'custom'

export interface CronGeneratorConfig {
  frequency: CronFrequencyType
  count: number
  hour: number
  minute: number
  daysOfWeek: number[]
  dayOfMonth: number
}

export function generateCron(config: CronGeneratorConfig): string {
  const { frequency, count, hour, minute, daysOfWeek, dayOfMonth } = config
  const h = Math.max(0, Math.min(23, hour))
  const m = Math.max(0, Math.min(59, minute))
  const n = Math.max(1, count)
  const dom = Math.max(1, Math.min(31, dayOfMonth))
  const sortedDow = [...daysOfWeek].filter((d) => d >= 0 && d <= 6).sort((a, b) => a - b)
  const dowStr = sortedDow.length ? sortedDow.join(',') : '*'

  switch (frequency) {
    case 'everyMinute':
      return n > 1 ? `*/${n} * * * *` : '* * * * *'
    case 'everyHour':
      return n > 1 ? `0 */${n} * * *` : '0 * * * *'
    case 'everyDay':
      return `${m} ${h} * * *`
    case 'everyWeek':
      return `${m} ${h} * * ${dowStr}`
    case 'everyMonth':
      return `${m} ${h} ${dom} * *`
    case 'custom':
      return `${m} ${h} ${dom} * ${dowStr}`
    default:
      return '* * * * *'
  }
}

export const CRON_DESCRIBE_FAILED = '__DESCRIBE_FAILED__'

export function describeCron(expr: string, locale: string = 'en'): string {
  try {
    const localeCode = locale === 'zh-CN' ? 'zh_CN' : 'en'
    return cronstrue.toString(expr, { locale: localeCode })
  } catch {
    return CRON_DESCRIBE_FAILED
  }
}

export function getNextRuns(expr: string, count: number = 5): CronNextRun[] {
  try {
    const interval = cronParser.parse(expr)
    const runs: CronNextRun[] = []
    for (let i = 0; i < count; i++) {
      const date = interval.next().toDate()
      runs.push({
        date,
        formatted: formatCronDate(date),
      })
    }
    return runs
  } catch {
    return []
  }
}

export function getPreviousRuns(expr: string, count: number = 5): CronNextRun[] {
  try {
    const interval = cronParser.parse(expr)
    const runs: CronNextRun[] = []
    for (let i = 0; i < count; i++) {
      const date = interval.prev().toDate()
      runs.push({
        date,
        formatted: formatCronDate(date),
      })
    }
    return runs.reverse()
  } catch {
    return []
  }
}

export function describeFields(expr: string): CronFieldDesc[] {
  const parts = expr.trim().split(/\s+/)
  return FIELD_DEFS.map((def, i) => {
    const value = parts[i] ?? '*'
    const { key, params } = describeField(value, def.nameKey)
    return {
      name: def.name,
      value,
      meaningKey: key,
      meaningParams: params,
    }
  })
}

function describeField(value: string, fieldLabelKey: string): {
  key: string
  params?: Record<string, string>
} {
  if (!value || value === '*') {
    return { key: 'tools.cron.fieldDesc.every', params: { field: fieldLabelKey } }
  }
  if (value.startsWith('*/')) {
    const step = value.slice(2)
    return {
      key: 'tools.cron.fieldDesc.step',
      params: { field: fieldLabelKey, step },
    }
  }
  if (value.includes(',')) {
    return {
      key: 'tools.cron.fieldDesc.list',
      params: { field: fieldLabelKey, value },
    }
  }
  if (value.includes('-')) {
    return {
      key: 'tools.cron.fieldDesc.range',
      params: { field: fieldLabelKey, value },
    }
  }
  return {
    key: 'tools.cron.fieldDesc.specific',
    params: { field: fieldLabelKey, value },
  }
}

function formatCronDate(date: Date): string {
  const pad = (n: number): string => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
