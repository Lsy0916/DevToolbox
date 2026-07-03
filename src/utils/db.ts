/**
 * IndexedDB 历史记录存储
 *
 * 使用 idb 库封装 IndexedDB 操作，按工具 ID 索引历史记录。
 * 每个工具最多保留 50 条，查询时按时间倒序返回前 20 条。
 *
 * 支持导出/导入全部数据（JSON），用于数据管理工具的备份功能。
 * IndexedDB 不可用时（如隐私模式）降级为空操作，不影响应用运行。
 */
import { openDB, type IDBPDatabase } from 'idb'
import type { HistoryItem } from '@/types'

const DB_NAME = 'devtoolbox-db'
const DB_VERSION = 1
const STORE_NAME = 'history'
const MAX_HISTORY = 50

let dbPromise: Promise<IDBPDatabase> | null = null
let dbAvailable = true

/**
 * 获取 DB 实例（单例懒加载）。
 * 首次打开失败后标记不可用，后续直接返回 null。
 */
async function getDB(): Promise<IDBPDatabase | null> {
  if (!dbAvailable) return null
  if (dbPromise) return dbPromise
  try {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          })
          store.createIndex('tool', 'tool')
        }
      },
    })
    return dbPromise
  } catch (e) {
    console.error('[DevToolbox] IndexedDB open failed:', e)
    dbAvailable = false
    return null
  }
}

/** IndexedDB 是否可用（getDB 失败后变为 false） */
export function isDbAvailable(): boolean {
  return dbAvailable
}

/**
 * 保存一条历史记录。
 * 去重规则：相同 tool + input + output 则更新时间，否则新增。
 * 超过上限（50 条）时删除最旧记录。
 */
export async function saveHistory(
  tool: string,
  input: string,
  output: string,
): Promise<void> {
  const db = await getDB()
  if (!db) return
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const index = tx.store.index('tool')
    // 去重：相同 tool + input + output 才更新，允许同输入不同输出分别保存
    let existingId: number | undefined
    let cursor = await index.openCursor(IDBKeyRange.only(tool))
    while (cursor) {
      const value = cursor.value as HistoryItem
      if (value.input === input && value.output === output) {
        existingId = value.id
        break
      }
      cursor = await cursor.continue()
    }

    if (existingId !== undefined) {
      await tx.store.put({
        id: existingId,
        tool,
        input,
        output,
        createdAt: new Date(),
      })
    } else {
      await tx.store.add({
        tool,
        input,
        output,
        createdAt: new Date(),
      })
      // 超出上限删除最旧
      const count = await tx.store.count()
      if (count > MAX_HISTORY) {
        const allCursor = await tx.store.openCursor()
        let deleteCount = count - MAX_HISTORY
        let c = allCursor
        while (c && deleteCount > 0) {
          await c.delete()
          deleteCount -= 1
          c = await c.continue()
        }
      }
    }
    await tx.done
  } catch (e) {
    console.error('[DevToolbox] saveHistory failed:', e)
  }
}

/**
 * 查询某工具的历史记录，按时间倒序返回前 20 条。
 * @param tool - 工具 ID
 */
export async function getHistory(tool: string): Promise<HistoryItem[]> {
  const db = await getDB()
  if (!db) return []
  try {
    const index = db.transaction(STORE_NAME).store.index('tool')
    const all = (await index.getAll(IDBKeyRange.only(tool))) as HistoryItem[]
    return all
      .sort((a, b) => {
        const ta = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
        const tb = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
        return tb - ta
      })
      .slice(0, 20)
  } catch (e) {
    console.error('[DevToolbox] getHistory failed:', e)
    return []
  }
}

export async function deleteHistory(id: number): Promise<void> {
  const db = await getDB()
  if (!db) return
  try {
    await db.delete(STORE_NAME, id)
  } catch (e) {
    console.error('[DevToolbox] deleteHistory failed:', e)
  }
}

export async function clearHistory(tool: string): Promise<void> {
  const db = await getDB()
  if (!db) return
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const index = tx.store.index('tool')
    let cursor = await index.openCursor(IDBKeyRange.only(tool))
    while (cursor) {
      await cursor.delete()
      cursor = await cursor.continue()
    }
    await tx.done
  } catch (e) {
    console.error('[DevToolbox] clearHistory failed:', e)
  }
}

/** 清空所有工具的全部历史记录 */
export async function clearAllHistory(): Promise<void> {
  const db = await getDB()
  if (!db) return
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    await tx.store.clear()
    await tx.done
  } catch (e) {
    console.error('[DevToolbox] clearAllHistory failed:', e)
  }
}

export async function exportAllData(): Promise<string> {
  const db = await getDB()
  if (!db) return JSON.stringify({ history: [] })
  try {
    const all = (await db.getAll(STORE_NAME)) as HistoryItem[]
    return JSON.stringify(
      {
        history: all.map((item) => ({
          ...item,
          createdAt:
            item.createdAt instanceof Date
              ? item.createdAt.toISOString()
              : item.createdAt,
        })),
      },
      null,
      2,
    )
  } catch (e) {
    console.error('[DevToolbox] exportAllData failed:', e)
    return JSON.stringify({ history: [] })
  }
}

/**
 * 从 JSON 字符串导入历史记录（先清空再写入）。
 * @returns 成功导入的条数
 */
export async function importAllData(jsonString: string): Promise<number> {
  const db = await getDB()
  if (!db) return 0
  try {
    const parsed = JSON.parse(jsonString) as {
      history: Array<Omit<HistoryItem, 'createdAt'> & { createdAt: string }>
    }
    if (!parsed.history || !Array.isArray(parsed.history)) return 0
    const tx = db.transaction(STORE_NAME, 'readwrite')
    await tx.store.clear()
    let count = 0
    for (const item of parsed.history) {
      await tx.store.add({
        tool: item.tool,
        input: item.input,
        output: item.output,
        createdAt: new Date(item.createdAt),
      })
      count += 1
    }
    await tx.done
    return count
  } catch (e) {
    console.error('[DevToolbox] importAllData failed:', e)
    return 0
  }
}
