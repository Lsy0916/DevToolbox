<!--
  ToolSidebar
  工具侧边栏组件，展示工具列表并提供导航功能。
  - 提供搜索、收藏分组管理、最近使用和按分类浏览
  - 支持新建/重命名/删除收藏分组，星标弹窗可一键加入分组
  - 通过 appStore 管理工具选中状态并同步路由
-->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/appStore'
import { TOOLS, TOOL_CATEGORIES } from '@/utils/constants'
import type { FavoritesGroup, ToolDefinition } from '@/types'

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()

const categoryOrder: string[] = ['data', 'encoding', 'text', 'time', 'dev']

const recentTools = computed<ToolDefinition[]>(() =>
  appStore.recentTools
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter((t): t is ToolDefinition => t !== undefined),
)

// === 分组 UI 状态 ===
const addingGroup = ref(false)
const newGroupName = ref('')
const newGroupInputEl = ref<HTMLInputElement | null>(null)
const editingGroupId = ref<string | null>(null)
const groupNameInput = ref('')
const groupNameInputEl = ref<HTMLInputElement | null>(null)

// === 星标弹窗 UI 状态 ===
const activeStarToolId = ref<string | null>(null)
const popupPos = ref({ top: 0, left: 0 })
const popupNewGroup = ref(false)
const popupNewGroupName = ref('')
const popupNewGroupEl = ref<HTMLInputElement | null>(null)

function toolsInGroup(group: FavoritesGroup): ToolDefinition[] {
  return group.toolIds
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter((t): t is ToolDefinition => t !== undefined)
}

function selectTool(toolId: string): void {
  appStore.addRecent(toolId)
  appStore.currentToolId = toolId
  router.push(`/${toolId}`)
}

function isActive(toolId: string): boolean {
  return router.currentRoute.value.path === `/${toolId}`
}

// === 分组操作 ===
function startAddGroup(): void {
  addingGroup.value = true
  newGroupName.value = ''
  void nextTick(() => {
    newGroupInputEl.value?.focus()
  })
}

function confirmAddGroup(): void {
  const name = newGroupName.value.trim()
  if (name) {
    appStore.addFavoritesGroup(name)
  }
  addingGroup.value = false
  newGroupName.value = ''
}

function cancelAddGroup(): void {
  addingGroup.value = false
  newGroupName.value = ''
}

function startRenameGroup(id: string, currentName: string): void {
  editingGroupId.value = id
  groupNameInput.value = currentName
  void nextTick(() => {
    groupNameInputEl.value?.focus()
    groupNameInputEl.value?.select()
  })
}

function saveRenameGroup(): void {
  if (editingGroupId.value) {
    appStore.renameFavoritesGroup(editingGroupId.value, groupNameInput.value)
  }
  editingGroupId.value = null
}

function cancelRenameGroup(): void {
  editingGroupId.value = null
}

function handleDeleteGroup(id: string): void {
  if (window.confirm(t('sidebar.confirmDeleteGroup'))) {
    appStore.removeFavoritesGroup(id)
  }
}

// === 星标弹窗 ===
function toggleStarPopup(event: MouseEvent, toolId: string): void {
  if (activeStarToolId.value === toolId) {
    closeStarPopup()
    return
  }
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const popupWidth = 220
  const left = Math.max(8, Math.min(rect.right - popupWidth, window.innerWidth - popupWidth - 8))
  const top = rect.bottom + 6
  const adjustedTop = top + 320 > window.innerHeight ? rect.top - 6 - 300 : top
  popupPos.value = { top: adjustedTop, left }
  activeStarToolId.value = toolId
  popupNewGroup.value = false
  popupNewGroupName.value = ''
}

function closeStarPopup(): void {
  activeStarToolId.value = null
  popupNewGroup.value = false
  popupNewGroupName.value = ''
}

function toggleToolInGroup(groupId: string): void {
  if (activeStarToolId.value) {
    appStore.toggleToolInGroup(groupId, activeStarToolId.value)
  }
}

function startPopupNewGroup(): void {
  popupNewGroup.value = true
  popupNewGroupName.value = ''
  void nextTick(() => {
    popupNewGroupEl.value?.focus()
  })
}

function confirmPopupNewGroup(): void {
  const name = popupNewGroupName.value.trim()
  if (name && activeStarToolId.value) {
    const id = appStore.addFavoritesGroup(name)
    appStore.toggleToolInGroup(id, activeStarToolId.value)
    popupNewGroup.value = false
    popupNewGroupName.value = ''
  }
}

function cancelPopupNewGroup(): void {
  popupNewGroup.value = false
  popupNewGroupName.value = ''
}
</script>

<template>
  <nav class="flex h-full flex-col gap-4 overflow-y-auto p-3">
    <!-- 搜索 -->
    <div>
      <input
        v-model="appStore.searchQuery"
        type="text"
        :placeholder="t('sidebar.searchPlaceholder')"
        class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none transition-colors focus:border-primary focus:bg-white dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-200 dark:focus:bg-slate-700"
        :aria-label="t('sidebar.searchPlaceholder')"
      />
    </div>

    <!-- 收藏分组 -->
    <div v-if="!appStore.searchQuery && (appStore.favoritesGroups.length > 0 || addingGroup)">
      <div v-for="group in appStore.favoritesGroups" :key="group.id" class="mb-3">
        <!-- 分组头部 -->
        <div class="group/title mb-1.5 flex items-center gap-1 px-2">
          <button
            class="flex shrink-0 items-center text-slate-400 transition-transform"
            :class="group.collapsed ? '' : 'rotate-90'"
            :aria-label="t('sidebar.toggleCollapse')"
            @click="appStore.toggleGroupCollapsed(group.id)"
          >
            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <input
            v-if="editingGroupId === group.id"
            ref="groupNameInputEl"
            v-model="groupNameInput"
            type="text"
            class="flex-1 rounded border border-primary bg-white px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 outline-none dark:bg-slate-700 dark:text-slate-200"
            :placeholder="t('sidebar.favorites')"
            @blur="saveRenameGroup"
            @keydown.enter="saveRenameGroup"
            @keydown.escape="cancelRenameGroup"
          />
          <button
            v-else
            class="flex-1 truncate text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
            @click="appStore.toggleGroupCollapsed(group.id)"
          >
            {{ group.name || t('sidebar.favorites') }}
          </button>
          <button
            v-if="editingGroupId !== group.id"
            class="shrink-0 text-slate-300 opacity-0 transition-opacity hover:text-primary group-hover/title:opacity-100"
            :aria-label="t('sidebar.renameFavorites')"
            @click.stop="startRenameGroup(group.id, group.name)"
          >
            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            v-if="editingGroupId !== group.id"
            class="shrink-0 text-slate-300 opacity-0 transition-opacity hover:text-red-500 group-hover/title:opacity-100"
            :aria-label="t('sidebar.deleteGroup')"
            @click.stop="handleDeleteGroup(group.id)"
          >
            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <!-- 分组工具列表 -->
        <ul v-show="!group.collapsed && group.toolIds.length" class="space-y-0.5">
          <li v-for="tool in toolsInGroup(group)" :key="tool.id">
            <button
              class="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors"
              :class="isActive(tool.id)
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60'"
              @click="selectTool(tool.id)"
            >
              <span class="flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded bg-slate-100 px-1 text-[10px] font-bold tracking-tight dark:bg-slate-700">
                {{ tool.icon }}
              </span>
              <span class="truncate">{{ t(tool.name) }}</span>
            </button>
          </li>
        </ul>
      </div>

      <!-- 添加分组 -->
      <div v-if="!addingGroup" class="px-2">
        <button
          class="flex items-center gap-1 text-[10px] font-medium text-slate-400 transition-colors hover:text-primary"
          @click="startAddGroup"
        >
          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {{ t('sidebar.addGroup') }}
        </button>
      </div>
      <div v-else class="flex items-center gap-1 px-2">
        <input
          ref="newGroupInputEl"
          v-model="newGroupName"
          type="text"
          class="flex-1 rounded border border-primary bg-white px-2 py-1 text-xs text-slate-600 outline-none dark:bg-slate-700 dark:text-slate-200"
          :placeholder="t('sidebar.groupNamePlaceholder')"
          @keydown.enter="confirmAddGroup"
          @keydown.escape="cancelAddGroup"
        />
        <button
          class="rounded bg-primary px-2 py-1 text-xs text-white hover:bg-primary/90"
          @click="confirmAddGroup"
        >✓</button>
        <button
          class="rounded border border-slate-200 px-2 py-1 text-xs text-slate-400 hover:text-slate-600 dark:border-slate-600"
          @click="cancelAddGroup"
        >✕</button>
      </div>
    </div>

    <!-- 最近使用 -->
    <div v-if="recentTools.length && !appStore.searchQuery">
      <h3 class="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {{ t('sidebar.recent') }}
      </h3>
      <ul class="space-y-0.5">
        <li v-for="tool in recentTools" :key="tool.id">
          <button
            class="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors"
            :class="isActive(tool.id)
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60'"
            @click="selectTool(tool.id)"
          >
            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-mono dark:bg-slate-700">
              {{ tool.icon }}
            </span>
            <span class="truncate">{{ t(tool.name) }}</span>
          </button>
        </li>
      </ul>
    </div>

    <!-- 按分类分组的工具列表 -->
    <div v-for="cat in categoryOrder" :key="cat" v-show="appStore.toolsByCategory[cat]">
      <h3 class="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {{ t(TOOL_CATEGORIES[cat] ?? '') }}
      </h3>
      <ul class="space-y-0.5">
        <li v-for="tool in appStore.toolsByCategory[cat]" :key="tool.id">
          <div class="group relative">
            <button
              class="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors"
              :class="isActive(tool.id)
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60'"
              @click="selectTool(tool.id)"
            >
              <span class="flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded bg-slate-100 px-1 text-[10px] font-bold tracking-tight dark:bg-slate-700">
                {{ tool.icon }}
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate">{{ t(tool.name) }}</span>
              </span>
            </button>
            <button
              class="absolute right-1 top-1/2 -translate-y-1/2 text-slate-300 transition-opacity hover:text-amber-400 group-hover:opacity-100"
              :class="appStore.isToolInAnyFavorite(tool.id) ? 'opacity-100 text-amber-400' : 'opacity-0'"
              :aria-label="t('sidebar.addToFavorites')"
              @click.stop="toggleStarPopup($event, tool.id)"
            >
              <svg class="h-3.5 w-3.5" :fill="appStore.isToolInAnyFavorite(tool.id) ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          </div>
        </li>
      </ul>
    </div>

    <!-- 无搜索结果 -->
    <div v-if="appStore.searchQuery && !appStore.filteredTools.length" class="px-2 py-4 text-center text-xs text-slate-400">
      {{ t('sidebar.noToolsFound') }}
    </div>
  </nav>

  <!-- 星标弹窗（Teleport 到 body 避免被 overflow 裁剪） -->
  <Teleport to="body">
    <div v-if="activeStarToolId" class="fixed inset-0 z-40" @click="closeStarPopup" @contextmenu.prevent="closeStarPopup">
      <div
        class="absolute w-[220px] rounded-lg border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-600 dark:bg-slate-800"
        :style="{ top: popupPos.top + 'px', left: popupPos.left + 'px' }"
        @click.stop
      >
        <!-- 标题 -->
        <p class="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {{ t('sidebar.addToFavorites') }}
        </p>
        <!-- 分组列表 -->
        <div v-if="appStore.favoritesGroups.length" class="space-y-0.5">
          <button
            v-for="group in appStore.favoritesGroups"
            :key="group.id"
            class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/60"
            @click="toggleToolInGroup(group.id)"
          >
            <svg class="h-4 w-4 shrink-0" :class="appStore.isToolInGroup(group.id, activeStarToolId) ? 'text-primary' : 'text-slate-300'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path v-if="appStore.isToolInGroup(group.id, activeStarToolId)" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span class="truncate text-slate-700 dark:text-slate-300">{{ group.name || t('sidebar.favorites') }}</span>
          </button>
        </div>
        <div v-else class="px-2 py-2 text-center text-xs text-slate-400">
          {{ t('sidebar.noGroups') }}
        </div>
        <!-- 分隔线 -->
        <div class="my-1.5 border-t border-slate-100 dark:border-slate-700"></div>
        <!-- 新建分组 -->
        <div v-if="!popupNewGroup">
          <button
            class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-700/60"
            @click="startPopupNewGroup"
          >
            <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {{ t('sidebar.addGroup') }}
          </button>
        </div>
        <div v-else class="flex items-center gap-1 px-1">
          <input
            ref="popupNewGroupEl"
            v-model="popupNewGroupName"
            type="text"
            class="flex-1 rounded border border-primary bg-white px-2 py-1 text-xs text-slate-600 outline-none dark:bg-slate-700 dark:text-slate-200"
            :placeholder="t('sidebar.groupNamePlaceholder')"
            @keydown.enter="confirmPopupNewGroup"
            @keydown.escape="cancelPopupNewGroup"
          />
          <button class="rounded bg-primary px-2 py-1 text-xs text-white hover:bg-primary/90" @click="confirmPopupNewGroup">✓</button>
          <button class="rounded border border-slate-200 px-2 py-1 text-xs text-slate-400 hover:text-slate-600 dark:border-slate-600" @click="cancelPopupNewGroup">✕</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
