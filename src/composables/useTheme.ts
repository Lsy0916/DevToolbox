/**
 * useTheme — 主题切换组合式函数
 *
 * 封装 appStore 的主题操作，提供只读的 isDark 计算属性与 toggle 方法。
 * 实际的主题 class 应用与持久化由 appStore 负责。
 */
import { computed, type ComputedRef } from 'vue'
import { useAppStore } from '@/stores/appStore'

export function useTheme(): {
  isDark: ComputedRef<boolean>
  toggle: () => void
} {
  const appStore = useAppStore()
  /** 当前是否为暗色主题（计算属性，响应 store 变化） */
  const isDark = computed(() => appStore.theme === 'dark')

  /** 切换明/暗主题，由 store 负责应用 class 与持久化 */
  function toggle(): void {
    appStore.toggleTheme()
  }

  return { isDark, toggle }
}
