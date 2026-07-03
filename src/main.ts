/**
 * 应用入口
 *
 * 创建 Vue 应用实例，按序注册 Pinia / vue-i18n / Vue Router。
 * CSS 导入顺序关键：Tailwind 基础 → Element Plus 主题 → EP 暗色变量 → 自定义覆盖，
 * 后导入的样式可覆盖前者。
 *
 * 主题与语言在 router mount 前初始化，避免首屏闪烁。
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { useAppStore } from './stores/appStore'
import { i18n } from './locales'

// CSS 导入顺序（关键）：Tailwind → Element Plus → EP 深色变量 → 自定义覆盖
import './styles/index.css'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles/element-overrides.css'

const app = createApp(App)
app.use(createPinia())
app.use(i18n)

// 初始化主题与语言（在 router mount 前应用，避免闪烁）
useAppStore().initApp()

app.use(router)
app.mount('#app')
