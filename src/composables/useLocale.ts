/**
 * useLocale — 界面语言切换组合式函数
 *
 * 封装 vue-i18n 与 appStore 的语言操作：
 * - `locale`: 只读计算属性，反映当前语言
 * - `setLocale`: 设置指定语言（同步 i18n 实例与持久化）
 * - `toggleLocale`: 在 zh-CN / en-US 之间快速切换
 */
import { computed, type ComputedRef } from 'vue'
import { i18n, type AppLocale } from '@/locales'
import { useAppStore } from '@/stores/appStore'

export function useLocale(): {
  locale: ComputedRef<AppLocale>
  setLocale: (locale: AppLocale) => void
  toggleLocale: () => void
} {
  /** 当前界面语言（zh-CN 或 en-US） */
  const locale = computed<AppLocale>(() => i18n.global.locale.value as AppLocale)

  /**
   * 设置界面语言。同时更新 i18n 实例（即时生效）与 appStore（持久化）。
   * @param next - 目标语言
   */
  function setLocale(next: AppLocale): void {
    i18n.global.locale.value = next
    useAppStore().setLocale(next)
  }

  /** 在中英文之间切换：当前是中文则切英文，反之亦然 */
  function toggleLocale(): void {
    setLocale(locale.value === 'zh-CN' ? 'en-US' : 'zh-CN')
  }

  return { locale, setLocale, toggleLocale }
}
