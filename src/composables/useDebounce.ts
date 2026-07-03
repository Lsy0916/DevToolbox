/**
 * useDebounce — 防抖工具集
 *
 * 提供两种防抖模式：
 * 1. `useDebounce` — 响应式防抖：监听 WatchSource，变化后延迟更新返回的 ref
 * 2. `debounceFn` — 函数防抖：包装普通函数，连续调用只执行最后一次
 *
 * 典型场景：搜索框输入过滤、窗口 resize 回调、按钮防连点。
 */
import { ref, watch, type Ref, type WatchSource } from 'vue'

/**
 * 创建响应式防抖 ref。
 * 源变化后等待 delay 毫秒无新变化，才将新值同步到返回的 ref。
 * @param source - 被监听的响应式源（ref 或 getter）
 * @param delay - 防抖延迟毫秒数，默认 300ms
 * @returns 防抖后的 ref，初始值为 source 的当前值
 */
export function useDebounce<T>(source: WatchSource<T>, delay = 300): Ref<T | undefined> {
  const debounced = ref<T | undefined>(
    typeof source === 'function' ? (source as () => T)() : source.value,
  ) as Ref<T | undefined>
  let timer: ReturnType<typeof setTimeout> | null = null

  watch(source, (val) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = val
    }, delay)
  })

  return debounced
}

/**
 * 创建防抖函数。连续调用时只执行最后一次，前几次的定时器被取消。
 * @param fn - 需要防抖的函数
 * @param delay - 防抖延迟毫秒数，默认 300ms
 * @returns 包装后的防抖函数，签名与原函数一致
 */
export function debounceFn<T extends (...args: never[]) => void>(
  fn: T,
  delay = 300,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
