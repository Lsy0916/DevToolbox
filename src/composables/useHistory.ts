/**
 * useHistory — 工具历史记录组合式函数
 *
 * 为每个工具提供独立的输入输出快照历史，存于 IndexedDB。
 * 关键设计：按 toolName 缓存共享 ref，使同一工具的多次组件实例
 * （如 keep-alive 缓存 + HistoryList 侧边栏）共享同一份历史数据，
 * 一处保存、多处同步更新。
 *
 * 数据流：工具组件调用 saveHistory → 写入 IndexedDB → loadHistory 刷新共享 ref → UI 自动更新
 */
import { ref, onMounted, type Ref } from 'vue'
import type { HistoryItem } from '@/types'
import * as db from '@/utils/db'

/**
 * 按 toolName 共享 history ref 的模块级缓存。
 * key: 工具 ID（如 'json'），value: 该工具的历史记录 ref。
 * 同一工具多次调用 useHistory 返回同一个 ref 实例。
 */
const historyCache = new Map<string, Ref<HistoryItem[]>>()

/**
 * 获取指定工具的历史记录管理接口。
 * @param toolName - 工具 ID，用于区分不同工具的历史
 */
export function useHistory(toolName: string): {
  history: Ref<HistoryItem[]>
  saveHistory: (input: string, output: string) => Promise<void>
  deleteHistory: (id: number) => Promise<void>
  clearHistory: () => Promise<void>
  loadHistory: () => Promise<void>
} {
  // 复用已缓存的 ref，保证同工具多实例共享状态
  let history = historyCache.get(toolName)
  if (!history) {
    history = ref<HistoryItem[]>([])
    historyCache.set(toolName, history)
  }

  /** 从 IndexedDB 重新加载该工具的全部历史，刷新共享 ref */
  async function loadHistory(): Promise<void> {
    history!.value = await db.getHistory(toolName)
  }

  /**
   * 保存一条历史快照。input 或 output 为空时跳过（避免无意义空记录）。
   * @param input - 工具输入快照
   * @param output - 工具输出快照
   */
  async function saveHistory(input: string, output: string): Promise<void> {
    if (!input || !output) return
    await db.saveHistory(toolName, input, output)
    await loadHistory()
  }

  /**
   * 按 ID 删除单条历史记录。
   * @param id - 历史记录的自增主键
   */
  async function deleteHistory(id: number): Promise<void> {
    await db.deleteHistory(id)
    await loadHistory()
  }

  /** 清空当前工具的全部历史记录 */
  async function clearHistory(): Promise<void> {
    await db.clearHistory(toolName)
    await loadHistory()
  }

  // 组件挂载时自动加载一次历史，确保 UI 即时显示
  onMounted(() => {
    void loadHistory()
  })

  return { history, saveHistory, deleteHistory, clearHistory, loadHistory }
}
