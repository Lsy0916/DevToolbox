/**
 * useNotification — 通知推送组合式函数
 *
 * 封装 notificationStore，提供按级别的便捷推送方法。
 * 调用方负责将 message 做 i18n 翻译后传入。
 *
 * 推送的 toast 由 NotificationContainer.vue 统一渲染，
 * 按级别自动设定停留时长（error 5s，其余 3s）。
 */
import { useNotificationStore } from '@/stores/notificationStore'

export function useNotification(): {
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
  showWarning: (message: string) => void
  showErrorWithCode: (code: string, message?: string) => void
} {
  const store = useNotificationStore()

  /** 推送成功通知（绿色，3 秒消失） */
  function showSuccess(message: string): void {
    store.push('success', message)
  }

  /** 推送错误通知（红色，5 秒消失） */
  function showError(message: string): void {
    store.push('error', message)
  }

  /** 推送信息通知（蓝色，3 秒消失） */
  function showInfo(message: string): void {
    store.push('info', message)
  }

  /** 推送警告通知（黄色，3 秒消失） */
  function showWarning(message: string): void {
    store.push('warning', message)
  }

  /**
   * 推送带错误码的错误通知，格式为 `[CODE] message`。
   * 用于 API/解析等已知错误码场景，便于用户反馈时定位问题。
   * @param code - 错误码（如 'PARSE_ERROR'）
   * @param message - 可选的错误描述
   */
  function showErrorWithCode(code: string, message?: string): void {
    const text = message ? `[${code}] ${message}` : `[${code}]`
    store.push('error', text)
  }

  return { showSuccess, showError, showInfo, showWarning, showErrorWithCode }
}
