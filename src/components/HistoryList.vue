<!--
  HistoryList
  历史记录列表组件，展示指定工具的历史输入输出记录。
  - 支持点击条目恢复输入输出、删除单条和清空全部
  - 显示相对时间戳并提供空状态及数据库不可用提示
  - 基于 useHistory 组合式函数按工具维度隔离数据
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useHistory } from '@/composables/useHistory'
import { formatRelativeTime } from '@/utils/formatTime'
import { isDbAvailable } from '@/utils/db'
import type { HistoryItem } from '@/types'

const { t } = useI18n()

const props = defineProps<{
  tool: string
}>()

const emit = defineEmits<{
  select: [item: { input: string; output: string }]
}>()

const { history, deleteHistory, clearHistory } = useHistory(props.tool)

function handleSelect(item: HistoryItem): void {
  emit('select', { input: item.input, output: item.output })
}

function truncate(text: string, max: number): string {
  if (!text) return ''
  const single = text.replace(/\n/g, ' ').trim()
  return single.length > max ? single.slice(0, max) + '…' : single
}

function formatTooltip(date: Date): string {
  try {
    return date instanceof Date ? date.toLocaleString() : String(date)
  } catch {
    return String(date)
  }
}
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-700/60">
    <div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 dark:border-slate-700/60 dark:bg-slate-800/40">
      <h3 class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ t('history.title') }}
        <span v-if="history.length" class="rounded-full bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">{{ history.length }}</span>
      </h3>
      <button
        v-if="history.length"
        class="text-xs text-slate-400 transition-colors hover:text-red-500"
        :aria-label="t('history.clearAll')"
        @click="clearHistory"
      >
        {{ t('history.clear') }}
      </button>
    </div>

    <div v-if="!isDbAvailable()" class="px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
      {{ t('history.unavailable') }}
    </div>

    <div v-else-if="!history.length" class="flex flex-col items-center justify-center px-4 py-8 text-center">
      <svg class="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-xs text-slate-400">{{ t('history.empty') }}</p>
    </div>

    <ul v-else class="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-700/40">
      <li
        v-for="(item, idx) in history"
        :key="item.id"
        tabindex="0"
        role="button"
        class="group relative cursor-pointer px-4 py-2.5 transition-colors hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none dark:hover:bg-primary/10"
        :title="t('history.clickToRestore')"
        @click="handleSelect(item)"
        @keydown.enter="handleSelect(item)"
        @keydown.space.prevent="handleSelect(item)"
      >
        <div class="flex items-start gap-2.5">
          <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-semibold text-slate-400 dark:bg-slate-700 dark:text-slate-500">
            {{ history.length - idx }}
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex items-start gap-1.5">
              <span class="mt-0.5 shrink-0 rounded bg-slate-100 px-1 text-[9px] font-bold uppercase text-slate-400 dark:bg-slate-700 dark:text-slate-500">IN</span>
              <p class="min-w-0 flex-1 truncate font-mono text-xs text-slate-600 dark:text-slate-300">
                {{ truncate(item.input, 50) || '—' }}
              </p>
            </div>
            <div v-if="item.output" class="mt-1 flex items-start gap-1.5">
              <span class="mt-0.5 shrink-0 rounded bg-primary/10 px-1 text-[9px] font-bold uppercase text-primary">OUT</span>
              <p class="min-w-0 flex-1 truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                {{ truncate(item.output, 50) }}
              </p>
            </div>
            <p class="mt-1 text-[10px] text-slate-400" :title="formatTooltip(item.createdAt)">
              {{ formatRelativeTime(item.createdAt, t) }}
            </p>
          </div>
          <button
            class="shrink-0 rounded p-1 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
            :aria-label="t('history.deleteEntry')"
            @click.stop="deleteHistory(item.id!)"
          >
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
