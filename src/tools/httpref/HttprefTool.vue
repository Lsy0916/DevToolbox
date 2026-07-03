<!--
  HttprefTool HTTP 参考工具
  用于查询 HTTP 状态码、请求方法和头部字段的参考工具。
  - 提供状态码、方法、头部三个分类标签页切换浏览
  - 支持按关键字搜索并按状态码类别着色区分
  - 内置完整的 HTTP 规范参考数据，便于快速查阅
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import { HTTP_STATUS_CODES, HTTP_METHODS, HTTP_HEADERS, statusCategory } from './httprefUtils'

defineOptions({ name: 'HttprefTool' })

const { t } = useI18n()

const activeTab = ref<'status' | 'methods' | 'headers'>('status')
const search = ref('')

const tabs: { key: typeof activeTab.value; labelKey: string }[] = [
  { key: 'status', labelKey: 'tools.httpref.labels.tabStatus' },
  { key: 'methods', labelKey: 'tools.httpref.labels.tabMethods' },
  { key: 'headers', labelKey: 'tools.httpref.labels.tabHeaders' },
]

const filteredStatus = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return HTTP_STATUS_CODES
  return HTTP_STATUS_CODES.filter(
    (s) => String(s.code).includes(q) || s.text.toLowerCase().includes(q) || t(s.descKey).toLowerCase().includes(q),
  )
})

const filteredMethods = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return HTTP_METHODS
  return HTTP_METHODS.filter((m) => m.name.toLowerCase().includes(q) || t(m.descKey).toLowerCase().includes(q))
})

const filteredHeaders = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return HTTP_HEADERS
  return HTTP_HEADERS.filter((h) => h.name.toLowerCase().includes(q) || t(h.descKey).toLowerCase().includes(q))
})

const statusClass = (code: number): string => {
  const cat = statusCategory(code)
  return {
    info: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    redirect: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    client: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    server: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  }[cat]
}

const categoryLabel = (cat: string): string => t(`tools.httpref.labels.cat${cat.charAt(0).toUpperCase()}${cat.slice(1)}`)
</script>

<template>
  <ToolCard
    :title="t('tools.httpref.title')"
    :description="t('tools.httpref.description')"
    tool-id="httpref"
  >
    <template #actions>
      <div class="flex flex-wrap items-center gap-3">
        <div class="mag-tab-group">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['mag-tab', activeTab === tab.key && 'mag-tab-active']"
            @click="activeTab = tab.key"
          >
            {{ t(tab.labelKey) }}
          </button>
        </div>
        <input
          v-model="search"
          type="text"
          class="mag-input min-w-[200px] flex-1"
          :placeholder="t('tools.httpref.labels.search')"
        />
      </div>
    </template>

    <template #output>
      <div class="overflow-auto" style="max-height: 520px">
        <!-- 状态码 -->
        <div v-if="activeTab === 'status'" class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="s in filteredStatus"
            :key="s.code"
            class="mag-cell"
          >
            <div class="flex items-center gap-2">
              <span class="rounded px-2 py-0.5 text-xs font-bold" :class="statusClass(s.code)">{{ s.code }}</span>
              <span class="mag-mono">{{ s.text }}</span>
            </div>
            <div class="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{{ t(s.descKey) }}</div>
          </div>
          <div v-if="!filteredStatus.length" class="col-span-full py-16 text-center text-sm font-light text-slate-400">
            {{ t('tools.httpref.messages.noResults') }}
          </div>
        </div>

        <!-- 方法 -->
        <div v-else-if="activeTab === 'methods'" class="space-y-3">
          <div
            v-for="m in filteredMethods"
            :key="m.name"
            class="mag-card"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="mag-section-title mb-0">{{ m.name }}</h3>
              <div class="flex flex-wrap gap-2 text-xs">
                <span class="rounded bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {{ t('tools.httpref.labels.safe') }}: {{ m.safe ? '✓' : '✕' }}
                </span>
                <span class="rounded bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {{ t('tools.httpref.labels.idempotent') }}: {{ m.idempotent ? '✓' : '✕' }}
                </span>
                <span class="rounded bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {{ t('tools.httpref.labels.hasBody') }}: {{ m.hasBody ? '✓' : '✕' }}
                </span>
              </div>
            </div>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">{{ t(m.descKey) }}</p>
          </div>
          <div v-if="!filteredMethods.length" class="py-16 text-center text-sm font-light text-slate-400">
            {{ t('tools.httpref.messages.noResults') }}
          </div>
        </div>

        <!-- 请求头 -->
        <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div
            v-for="h in filteredHeaders"
            :key="h.name"
            class="mag-cell"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span class="mag-mono font-medium text-slate-800 dark:text-slate-100">{{ h.name }}</span>
              <span class="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">{{ categoryLabel(h.category) }}</span>
            </div>
            <div class="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{{ t(h.descKey) }}</div>
          </div>
          <div v-if="!filteredHeaders.length" class="col-span-full py-16 text-center text-sm font-light text-slate-400">
            {{ t('tools.httpref.messages.noResults') }}
          </div>
        </div>
      </div>
    </template>
  </ToolCard>
</template>

