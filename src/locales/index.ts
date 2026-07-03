/**
 * i18n 国际化配置入口
 *
 * 使用 vue-i18n 9 的 Composition API 模式（legacy: false）。
 * 支持两种语言：zh-CN（简体中文，默认）、en-US（美式英文，回退语言）。
 *
 * 语言切换由 useLocale composable 驱动，切换时同步更新 appStore 持久化。
 */
import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

export type AppLocale = 'zh-CN' | 'en-US'

export const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

export default i18n
