<!--
  使用指南页
  展示全部 26 个工具的使用说明，支持搜索过滤和分类导航。
  包含快速链接入口和动态更新日期。
-->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { TOOLS } from '@/utils/constants'
import type { ToolCategory, ToolDefinition } from '@/types'
import ToolHelpContent from '@/components/ToolHelpContent.vue'

defineOptions({ name: 'GuidePage' })

const { t, te } = useI18n()
const route = useRoute()
const router = useRouter()

const CATEGORY_ORDER: ToolCategory[] = ['data', 'encoding', 'text', 'time', 'dev']

const searchQuery = ref('')
const lastUpdated = computed(() => new Date().toISOString().slice(0, 10))

const quickLinks: { id: string; nameKey: string }[] = [
  { id: 'data-manager', nameKey: 'tools.datamanager.name' },
]

function toolMatches(tool: ToolDefinition, q: string): boolean {
  if (!q) return true
  const lower = q.toLowerCase()
  const name = te(tool.name) ? t(tool.name) : tool.id
  if (name.toLowerCase().includes(lower)) return true
  const desc = te(tool.description) ? t(tool.description) : ''
  if (desc.toLowerCase().includes(lower)) return true
  const normalizedId = tool.id.replace(/-/g, '')
  const overviewKey = `tools.${normalizedId}.help.overview`
  if (te(overviewKey)) {
    const overview = t(overviewKey)
    if (overview.toLowerCase().includes(lower)) return true
  }
  return false
}

const grouped = computed(() => {
  const q = searchQuery.value.trim()
  return CATEGORY_ORDER.map((cat) => ({
    category: cat,
    tools: TOOLS.filter((tool) => tool.category === cat && toolMatches(tool, q)),
  })).filter((g) => g.tools.length > 0)
})

const hasResults = computed(() => grouped.value.length > 0)

const activeId = ref<string>('')

let observer: IntersectionObserver | null = null

function setupObserver(): void {
  observer?.disconnect()
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
      if (visible[0]) {
        const id = (visible[0].target as HTMLElement).id
        activeId.value = id
      }
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.1, 0.3] },
  )
  document.querySelectorAll('[id^="tool-"]').forEach((el) => {
    observer?.observe(el)
  })
}

function scrollToTool(toolId: string, updateHash = true): void {
  const el = document.getElementById(`tool-${toolId}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeId.value = `tool-${toolId}`
    if (updateHash) {
      void router.replace({ hash: `#tool-${toolId}` })
    }
  }
}

function handleTocClick(e: Event, toolId: string): void {
  e.preventDefault()
  scrollToTool(toolId)
}

function handleQuickLink(toolId: string): void {
  searchQuery.value = ''
  void nextTick(() => scrollToTool(toolId))
}

function toolName(tool: ToolDefinition): string {
  return te(tool.name) ? t(tool.name) : tool.id
}

function toolDesc(tool: ToolDefinition): string {
  return te(tool.description) ? t(tool.description) : ''
}

let observerDebounce: ReturnType<typeof setTimeout> | null = null
watch(grouped, () => {
  activeId.value = ''
  if (observerDebounce) clearTimeout(observerDebounce)
  observerDebounce = setTimeout(() => {
    void nextTick(() => setupObserver())
  }, 200)
})

onMounted(() => {
  void nextTick(() => {
    setupObserver()
    const hash = route.hash
    if (hash && hash.startsWith('#tool-')) {
      const toolId = hash.slice(6)
      void nextTick(() => scrollToTool(toolId, false))
    }
  })
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-6 py-10 md:px-10">
    <div class="flex gap-12">
      <!-- 主内容 -->
      <main class="min-w-0 max-w-3xl flex-1">
        <!-- 标题区 -->
        <header class="mb-10 border-b border-slate-200 pb-6 dark:border-slate-700">
          <p class="mb-2 text-xs font-medium uppercase tracking-wider text-primary">
            DevToolbox
          </p>
          <h1 class="font-serif text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-5xl">
            {{ t('guide.title') }}
          </h1>
          <p class="mt-3 max-w-2xl text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400">
            {{ t('guide.description') }}
          </p>
          <p class="mt-2 text-xs text-slate-400">
            {{ t('guide.lastUpdated') }}: {{ lastUpdated }}
          </p>
        </header>

        <!-- 搜索 + 快速链接 -->
        <div class="mb-10 space-y-4">
          <div class="relative">
            <svg class="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="search"
              :placeholder="t('guide.searchPlaceholder')"
              :aria-label="t('guide.searchPlaceholder')"
              class="w-full border-b border-slate-200 bg-transparent py-2 pl-6 pr-4 text-base font-light text-slate-700 outline-none placeholder:font-light placeholder:text-slate-400 focus:border-primary dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
          </div>

          <!-- 快速链接 -->
          <div v-if="!searchQuery" class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-medium uppercase tracking-wider text-slate-400">{{ t('guide.quickLinks') }}</span>
            <button
              v-for="ql in quickLinks"
              :key="ql.id"
              type="button"
              class="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300 dark:hover:border-primary dark:hover:text-primary-light"
              @click="handleQuickLink(ql.id)"
            >
              {{ te(ql.nameKey) ? t(ql.nameKey) : ql.id }}
            </button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!hasResults" class="py-16 text-center">
          <p class="text-sm font-light text-slate-400">{{ t('guide.noResults') }}</p>
        </div>

        <!-- 分类区块 -->
        <section
          v-for="(group, gi) in grouped"
          :key="group.category"
          class="mb-12"
        >
          <h2 class="mb-6 flex items-center gap-3 font-serif text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
              {{ gi + 1 }}
            </span>
            {{ t(`guide.categories.${group.category}`) }}
          </h2>

          <article
            v-for="tool in group.tools"
            :id="`tool-${tool.id}`"
            :key="tool.id"
            class="mb-10 scroll-mt-24 border-b border-slate-100 pb-8 last:border-0 dark:border-slate-800"
          >
            <!-- 工具标题 -->
            <div class="mb-3 flex items-center gap-3">
              <span class="flex h-8 w-12 shrink-0 items-center justify-center rounded-md bg-slate-100 font-mono text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {{ tool.icon }}
              </span>
              <h3 class="text-xl font-semibold text-slate-800 dark:text-slate-100">
                {{ toolName(tool) }}
              </h3>
            </div>

            <!-- 描述 -->
            <p class="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {{ toolDesc(tool) }}
            </p>

            <!-- 完整帮助内容 -->
            <ToolHelpContent :tool-id="tool.id" variant="full" />

            <!-- 打开工具 -->
            <div class="mt-5">
              <router-link
                :to="`/${tool.id}`"
                class="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white dark:text-primary-light dark:hover:bg-primary"
              >
                {{ t('guide.openTool') }}
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </router-link>
            </div>
          </article>
        </section>
      </main>

      <!-- 右侧 TOC -->
      <aside class="hidden w-56 shrink-0 lg:block">
        <div class="sticky top-24">
          <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {{ t('guide.onThisPage') }}
          </p>
          <nav class="space-y-4 border-l border-slate-200 dark:border-slate-700">
            <div v-for="group in grouped" :key="group.category">
              <p class="mb-1.5 ml-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                {{ t(`guide.categories.${group.category}`) }}
              </p>
              <ul class="space-y-0.5">
                <li v-for="tool in group.tools" :key="tool.id">
                  <a
                    :href="`#tool-${tool.id}`"
                    class="block border-l-2 py-1 pl-4 -ml-px text-xs leading-relaxed transition-colors"
                    :class="activeId === `tool-${tool.id}`
                      ? 'border-primary font-medium text-primary dark:text-primary-light'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
                    @click="handleTocClick($event, tool.id)"
                  >
                    {{ toolName(tool) }}
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </aside>
    </div>
  </div>
</template>
