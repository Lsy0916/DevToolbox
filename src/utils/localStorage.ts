/**
 * 应用设置持久化（localStorage）
 *
 * 主题、语言、侧边栏状态、收藏分组、最近使用工具均持久化于 localStorage。
 * 当 localStorage 不可用（隐私模式 / 配额满）时，降级为内存 Map，保证应用可用。
 *
 * 支持旧格式迁移：单收藏列表 → 多分组结构（favoritesGroups）。
 */
import type { AppLocale, AppSettings, FavoritesGroup, ThemeMode } from '@/types'

const STORAGE_KEY = 'devtoolbox:settings'

const defaultSettings: AppSettings = {
  theme: 'light',
  locale: 'zh-CN',
  sidebarCollapsed: false,
  favoritesGroups: [],
  recentTools: [],
}

// 隐私模式降级：localStorage 不可用时用内存 Map
const memoryFallback = new Map<string, string>()
let useMemoryFallback = false

/**
 * 检测 localStorage 是否可用。
 * 首次失败后设标志位，后续直接返回 false 避免重复探测。
 */
function isLocalStorageAvailable(): boolean {
  if (useMemoryFallback) return false
  try {
    const testKey = '__devtoolbox_test__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
    return true
  } catch {
    useMemoryFallback = true
    return false
  }
}

/** 读取原始字符串（localStorage 优先，降级走内存 Map） */
function readRaw(key: string): string | null {
  if (isLocalStorageAvailable()) {
    return localStorage.getItem(key)
  }
  return memoryFallback.get(key) ?? null
}

function writeRaw(key: string, value: string): void {
  if (isLocalStorageAvailable()) {
    localStorage.setItem(key, value)
  } else {
    memoryFallback.set(key, value)
  }
}

export function getSettings(): AppSettings {
  try {
    const raw = readRaw(STORAGE_KEY)
    if (!raw) return { ...defaultSettings }
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const settings: AppSettings = {
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      locale: parsed.locale === 'en-US' ? 'en-US' : 'zh-CN',
      sidebarCollapsed: parsed.sidebarCollapsed === true,
      favoritesGroups: [],
      recentTools: Array.isArray(parsed.recentTools) ? (parsed.recentTools as string[]) : [],
    }
    // 迁移：旧格式 favorites/favoritesCollapsed/favoritesGroupName → favoritesGroups
    if (Array.isArray(parsed.favoritesGroups)) {
      settings.favoritesGroups = (parsed.favoritesGroups as FavoritesGroup[]).filter(
        (g) => g && typeof g.id === 'string' && Array.isArray(g.toolIds),
      )
    } else if (Array.isArray(parsed.favorites) && (parsed.favorites as string[]).length) {
      settings.favoritesGroups = [
        {
          id: 'default',
          name: typeof parsed.favoritesGroupName === 'string' ? parsed.favoritesGroupName : '',
          toolIds: parsed.favorites as string[],
          collapsed: parsed.favoritesCollapsed === true,
        },
      ]
    }
    return settings
  } catch {
    return { ...defaultSettings }
  }
}

/**
 * 合并保存应用设置（浅合并）。
 * @param partial - 仅需传入要更新的字段
 */
export function saveSettings(partial: Partial<AppSettings>): void {
  const current = getSettings()
  const next = { ...current, ...partial }
  try {
    writeRaw(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 静默失败，不影响应用运行
  }
}

export function addRecentTool(toolId: string): string[] {
  const settings = getSettings()
  const filtered = settings.recentTools.filter((id) => id !== toolId)
  const next = [toolId, ...filtered].slice(0, 5)
  saveSettings({ recentTools: next })
  return next
}

export function setTheme(theme: ThemeMode): void {
  saveSettings({ theme })
}

/** 设置界面语言并持久化 */
export function setLocale(locale: AppLocale): void {
  saveSettings({ locale })
}
