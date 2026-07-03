/**
 * 时间戳转换与格式化工具集
 *
 * - 支持时间戳与日期互转，自动识别秒/毫秒单位
 * - 提供本地、UTC、ISO 及自定义格式化输出
 * - 支持相对时间、时间差计算与时区信息获取
 */
export type TimestampUnit = 's' | 'ms'

export function detectUnit(ts: number): TimestampUnit {
  if (ts >= 1e12) return 'ms'
  return 's'
}

export function timestampToDate(ts: number, unit: TimestampUnit): Date {
  return new Date(unit === 's' ? ts * 1000 : ts)
}

export function dateToTimestamp(date: Date, unit: TimestampUnit): number {
  const ms = date.getTime()
  return unit === 's' ? Math.floor(ms / 1000) : ms
}

export function formatLocal(date: Date): string {
  return date.toLocaleString()
}

export function formatUtc(date: Date): string {
  return date.toUTCString()
}

export function formatIso(date: Date): string {
  return date.toISOString()
}

export function formatCustom(date: Date, fmt: string): string {
  const pad = (n: number, len = 2): string => String(n).padStart(len, '0')
  const map: Record<string, string> = {
    YYYY: String(date.getFullYear()),
    MM: pad(date.getMonth() + 1),
    DD: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  }
  let result = fmt
  for (const [token, value] of Object.entries(map)) {
    result = result.split(token).join(value)
  }
  return result
}

export function parseDate(str: string): Date | null {
  const trimmed = str.trim()
  if (!trimmed) return null
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export function getTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

export function getTimezoneOffset(): string {
  const offset = -new Date().getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const hours = Math.floor(Math.abs(offset) / 60)
  const minutes = Math.abs(offset) % 60
  return `UTC${sign}${hours}${minutes > 0 ? `:${String(minutes).padStart(2, '0')}` : ''}`
}

// 相对时间结构化数据（由组件用 i18n 格式化）
export interface RelativeTimeInfo {
  value: number
  unit: 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year'
  isPast: boolean
}

export function formatRelative(ts: number, unit: TimestampUnit = 's', now: number = Date.now()): RelativeTimeInfo {
  const ms = unit === 's' ? ts * 1000 : ts
  const diffMs = ms - now
  const absSec = Math.abs(Math.floor(diffMs / 1000))
  const isPast = diffMs < 0
  if (absSec < 60) return { value: absSec, unit: 'second', isPast }
  if (absSec < 3600) return { value: Math.floor(absSec / 60), unit: 'minute', isPast }
  if (absSec < 86400) return { value: Math.floor(absSec / 3600), unit: 'hour', isPast }
  if (absSec < 2592000) return { value: Math.floor(absSec / 86400), unit: 'day', isPast }
  if (absSec < 31536000) return { value: Math.floor(absSec / 2592000), unit: 'month', isPast }
  return { value: Math.floor(absSec / 31536000), unit: 'year', isPast }
}

// 两个时间戳差值（天/时/分/秒）
export interface TimestampDiff {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
}

export function diffTimestamps(ts1: number, ts2: number, unit: TimestampUnit = 's'): TimestampDiff {
  const ms1 = unit === 's' ? ts1 * 1000 : ts1
  const ms2 = unit === 's' ? ts2 * 1000 : ts2
  const diffMs = Math.abs(ms1 - ms2)
  const totalSeconds = Math.floor(diffMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds, totalSeconds }
}

// 获取当前时间戳
export function getCurrentTimestamp(unit: TimestampUnit = 's'): number {
  return unit === 's' ? Math.floor(Date.now() / 1000) : Date.now()
}
