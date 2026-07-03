/**
 * NotificationStore — 全局通知（Toast）状态管理
 *
 * 管理屏幕右上角浮层通知队列。通知按类型自动设定停留时长：
 * - error: 5000ms（用户需要更多时间阅读错误）
 * - success/info/warning: 3000ms
 * 到时自动移除；用户也可手动关闭。
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { NotificationItem, NotificationType } from '@/types'

/** 自增 ID 种子，保证每个通知拥有唯一 ID 供 setTimeout 定位 */
let nextID = 1

export const useNotificationStore = defineStore('notification', () => {
  /** 当前待显示的通知列表，由 NotificationContainer.vue 渲染 */
  const items = ref<NotificationItem[]>([])

  /**
   * 推送一条新通知并设定自动消失定时器。
   * @param type - 通知级别，决定图标颜色与停留时长
   * @param message - 通知正文（已由调用方做 i18n 翻译）
   */
  function push(type: NotificationType, message: string): void {
    const id = nextID++
    items.value.push({ id, type, message })
    const duration = type === 'error' ? 5000 : 3000
    setTimeout(() => {
      remove(id)
    }, duration)
  }

  /**
   * 按 ID 移除通知（手动关闭或定时器触发）。
   * @param id - 目标通知 ID
   */
  function remove(id: number): void {
    items.value = items.value.filter((item) => item.id !== id)
  }

  return { items, push, remove }
})
