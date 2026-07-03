/**
 * AppStore — 应用全局状态管理中心
 *
 * 集中管理以下状态域：
 * - 主题（明/暗）与 i18n 语言
 * - 侧边栏折叠状态与当前激活工具
 * - 工具搜索过滤与按分类分组
 * - 收藏分组（多分组、可重命名、可折叠）
 * - 最近使用工具（最多 5 个，按时间倒序去重）
 *
 * 所有可持久化状态变更会立即通过 saveSettings() 同步到 localStorage，
 * 保证刷新后状态一致。
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AppLocale, FavoritesGroup, ThemeMode, ToolDefinition } from '@/types'
import { TOOLS } from '@/utils/constants'
import { getSettings, saveSettings } from '@/utils/localStorage'
import { i18n } from '@/locales'

/**
 * 生成收藏分组唯一 ID。
 * 格式：`grp-{时间戳}-{5位随机base36}`，保证同毫秒创建不冲突。
 */
function genGroupId(): string {
  return `grp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export const useAppStore = defineStore('app', () => {
  /** 当前主题模式，影响 Tailwind `dark:` 变体 */
  const theme = ref<ThemeMode>('light')
  /** 当前界面语言，驱动 vue-i18n 切换 */
  const locale = ref<AppLocale>('zh-CN')
  /** 侧边栏是否折叠（窄态） */
  const sidebarCollapsed = ref(false)
  /** 工具搜索框当前输入，空字符串表示不过滤 */
  const searchQuery = ref('')
  /** 当前激活的工具 ID，用于侧边栏高亮 */
  const currentToolId = ref('json')
  /** 收藏分组列表，用户可创建多个分组管理工具 */
  const favoritesGroups = ref<FavoritesGroup[]>([])
  /** 最近使用的工具 ID 列表，最多保留 5 个，最新在前 */
  const recentTools = ref<string[]>([])

  /**
   * 根据搜索关键字过滤工具列表。
   * 匹配规则：工具的 i18n 显示名（小写）包含搜索词（小写）即命中。
   * 空搜索词时返回全部工具。
   */
  const filteredTools = computed<ToolDefinition[]>(() => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return TOOLS
    return TOOLS.filter((t) => i18n.global.t(t.name).toLowerCase().includes(q))
  })

  /**
   * 将过滤后的工具按 category 字段分组。
   * 返回对象 key 为分类 ID（如 'data'/'encoding'），value 为该分类下的工具数组。
   * 用于侧边栏按分类渲染。
   */
  const toolsByCategory = computed<Record<string, ToolDefinition[]>>(() => {
    const map: Record<string, ToolDefinition[]> = {}
    for (const tool of filteredTools.value) {
      const existing = map[tool.category]
      if (existing) {
        existing.push(tool)
      } else {
        map[tool.category] = [tool]
      }
    }
    return map
  })

  /** 是否存在任意非空收藏分组，用于控制收藏区是否显示 */
  const hasAnyFavorite = computed(() =>
    favoritesGroups.value.some((g) => g.toolIds.length > 0),
  )

  /**
   * 将主题模式应用到 <html> 根元素。
   * 通过增删 `dark` class 触发 Tailwind 暗色变体。
   * @param mode - 'dark' 添加 class，'light' 移除 class
   */
  function applyTheme(mode: ThemeMode): void {
    const root = document.documentElement
    if (mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  /**
   * 应用启动时调用一次，从 localStorage 读取持久化设置并同步到内存状态。
   * 同时应用主题 class 并切换 i18n 语言。
   */
  function initApp(): void {
    const settings = getSettings()
    theme.value = settings.theme
    locale.value = settings.locale
    sidebarCollapsed.value = settings.sidebarCollapsed
    favoritesGroups.value = settings.favoritesGroups
    recentTools.value = settings.recentTools
    applyTheme(theme.value)
    i18n.global.locale.value = settings.locale
  }

  /** 切换明/暗主题并持久化 */
  function toggleTheme(): void {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    applyTheme(theme.value)
    saveSettings({ theme: theme.value })
  }

  /**
   * 切换界面语言并持久化。
   * @param next - 目标语言，仅接受 'zh-CN' 或 'en-US'
   */
  function setLocale(next: AppLocale): void {
    locale.value = next
    i18n.global.locale.value = next
    saveSettings({ locale: next })
  }

  /** 切换侧边栏折叠状态并持久化 */
  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value
    saveSettings({ sidebarCollapsed: sidebarCollapsed.value })
  }

  /**
   * 记录最近使用的工具：将 toolId 提至列表头部、去重、截断至 5 条。
   * @param toolId - 刚被使用的工具 ID
   */
  function addRecent(toolId: string): void {
    recentTools.value = [
      toolId,
      ...recentTools.value.filter((id) => id !== toolId),
    ].slice(0, 5)
    saveSettings({ recentTools: recentTools.value })
  }

  // === 收藏分组管理 ===

  /**
   * 创建新的收藏分组。
   * @param name - 分组显示名，会做 trim 处理
   * @returns 新建分组的 ID（可用于后续操作）
   */
  function addFavoritesGroup(name: string): string {
    const id = genGroupId()
    favoritesGroups.value = [
      ...favoritesGroups.value,
      { id, name: name.trim(), toolIds: [], collapsed: false },
    ]
    saveSettings({ favoritesGroups: favoritesGroups.value })
    return id
  }

  /**
   * 删除指定收藏分组。分组内的工具不会被删除，仅解除收藏关系。
   * @param id - 目标分组 ID
   */
  function removeFavoritesGroup(id: string): void {
    favoritesGroups.value = favoritesGroups.value.filter((g) => g.id !== id)
    saveSettings({ favoritesGroups: favoritesGroups.value })
  }

  /**
   * 重命名收藏分组。
   * @param id - 目标分组 ID
   * @param name - 新名称，会做 trim 处理
   */
  function renameFavoritesGroup(id: string, name: string): void {
    favoritesGroups.value = favoritesGroups.value.map((g) =>
      g.id === id ? { ...g, name: name.trim() } : g,
    )
    saveSettings({ favoritesGroups: favoritesGroups.value })
  }

  /**
   * 切换分组折叠状态（侧边栏中展开/收起）。
   * @param id - 目标分组 ID
   */
  function toggleGroupCollapsed(id: string): void {
    favoritesGroups.value = favoritesGroups.value.map((g) =>
      g.id === id ? { ...g, collapsed: !g.collapsed } : g,
    )
    saveSettings({ favoritesGroups: favoritesGroups.value })
  }

  /**
   * 查询工具是否在指定分组中。
   * @param groupId - 分组 ID
   * @param toolId - 工具 ID
   * @returns 存在返回 true，分组不存在或工具未收藏返回 false
   */
  function isToolInGroup(groupId: string, toolId: string): boolean {
    return favoritesGroups.value.find((g) => g.id === groupId)?.toolIds.includes(toolId) ?? false
  }

  /**
   * 查询工具是否被收藏到任意分组（用于工具卡片星标状态判断）。
   * @param toolId - 工具 ID
   */
  function isToolInAnyFavorite(toolId: string): boolean {
    return favoritesGroups.value.some((g) => g.toolIds.includes(toolId))
  }

  /**
   * 列出包含指定工具的所有分组 ID（用于取消收藏时批量移除）。
   * @param toolId - 工具 ID
   * @returns 分组 ID 数组，可能为空
   */
  function groupsContainingTool(toolId: string): string[] {
    return favoritesGroups.value.filter((g) => g.toolIds.includes(toolId)).map((g) => g.id)
  }

  /**
   * 在指定分组中添加或移除工具（toggle 语义）。
   * 已在分组中则移除，不在则添加。
   * @param groupId - 目标分组 ID
   * @param toolId - 工具 ID
   */
  function toggleToolInGroup(groupId: string, toolId: string): void {
    favoritesGroups.value = favoritesGroups.value.map((g) => {
      if (g.id !== groupId) return g
      const has = g.toolIds.includes(toolId)
      return {
        ...g,
        toolIds: has ? g.toolIds.filter((id) => id !== toolId) : [...g.toolIds, toolId],
      }
    })
    saveSettings({ favoritesGroups: favoritesGroups.value })
  }

  return {
    theme,
    locale,
    sidebarCollapsed,
    searchQuery,
    currentToolId,
    favoritesGroups,
    recentTools,
    filteredTools,
    toolsByCategory,
    hasAnyFavorite,
    initApp,
    toggleTheme,
    setLocale,
    toggleSidebar,
    addRecent,
    addFavoritesGroup,
    removeFavoritesGroup,
    renameFavoritesGroup,
    toggleGroupCollapsed,
    isToolInGroup,
    isToolInAnyFavorite,
    groupsContainingTool,
    toggleToolInGroup,
  }
})
