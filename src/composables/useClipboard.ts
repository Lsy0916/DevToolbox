/**
 * useClipboard — 复制到剪贴板的组合式函数
 *
 * 提供带视觉反馈的复制能力：
 * - 优先使用现代 Clipboard API（需 HTTPS 安全上下文）
 * - 降级到 deprecated execCommand('copy') 兼容旧环境/HTTP
 * - 复制成功后 `copied` 置 true 持续 2 秒，供按钮显示"已复制"状态
 * - 错误信息已做 i18n 翻译，可直接展示给用户
 */
import { ref, type Ref } from 'vue'
import { i18n } from '@/locales'

export function useClipboard(): {
  copy: (text: string) => Promise<boolean>
  copied: Ref<boolean>
  error: Ref<string | null>
} {
  /** 是否刚复制成功（2 秒后自动复位），用于 UI 反馈 */
  const copied = ref(false)
  /** 最近一次错误信息（已 i18n），null 表示无错误 */
  const error = ref<string | null>(null)
  /** 复位 copied 的定时器句柄，多次复制时取消上一个 */
  let timer: ReturnType<typeof setTimeout> | null = null

  /**
   * 将文本写入剪贴板。
   * @param text - 待复制内容，空字符串会报错并返回 false
   * @returns 复制是否成功
   */
  async function copy(text: string): Promise<boolean> {
    error.value = null
    if (!text) {
      error.value = i18n.global.t('common.nothingToCopy')
      return false
    }

    // 优先使用现代 Clipboard API（要求安全上下文：HTTPS 或 localhost）
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text)
        markCopied()
        return true
      } catch {
        // 权限被拒或不支持，降级到 execCommand 方案
      }
    }

    // 降级方案：临时 textarea + execCommand('copy')
    // 通过将 textarea 移出视口避免焦点跳动，兼容 HTTP 环境与旧浏览器
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      textarea.style.top = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      if (ok) {
        markCopied()
        return true
      }
      error.value = i18n.global.t('common.copyFailed')
      return false
    } catch {
      error.value = i18n.global.t('common.copyFailed')
      return false
    }
  }

  /**
   * 标记复制成功并启动 2 秒复位定时器。
   * 多次连续复制时取消上一个定时器，避免提前复位。
   */
  function markCopied(): void {
    copied.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      copied.value = false
    }, 2000)
  }

  return { copy, copied, error }
}
