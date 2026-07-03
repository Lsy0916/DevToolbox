/**
 * 相对时间格式化
 *
 * 将时间戳转为本地化的相对时间文案（"刚刚 / N 分钟前 / 昨天 / N 天前 / YYYY-MM-DD"）。
 * 所有文案通过 i18n 翻译函数输出，支持中英文切换。
 */
import type { ComposerTranslation } from 'vue-i18n'

/**
 * 格式化为相对时间字符串。
 *
 * @param date - 目标时间
 * @param t - vue-i18n 翻译函数，用于输出本地化文案
 * @returns 相对时间字符串；超过 7 天则返回 YYYY-MM-DD 格式
 */
export function formatRelativeTime(
  date: Date,
  t: ComposerTranslation,
): string {
  const now = Date.now()
  const ts = date instanceof Date ? date.getTime() : new Date(date).getTime()
  const diff = now - ts

  if (diff < 0 || diff < 60 * 1000) return t('common.relativeTime.justNow')
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return t('common.relativeTime.minutesAgo', { n: minutes })
  }
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return t('common.relativeTime.hoursAgo', { n: hours })
  }
  if (diff < 48 * 60 * 60 * 1000) return t('common.relativeTime.yesterday')
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    return t('common.relativeTime.daysAgo', { n: days })
  }
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
