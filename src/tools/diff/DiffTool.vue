<!--
  DiffTool 文本对比工具
  用于逐行、逐词或逐字符对比两段文本差异的工具。
  - 支持行、字符、单词三种对比模式并可忽略空白
  - 实时统计新增、删除行数，支持生成统一差异格式
  - 基于 Monaco 编辑器提供左右双栏编辑体验
-->
<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import ActionButtons from '@/components/ActionButtons.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import { useClipboard } from '@/composables/useClipboard'
import {
  diffLines,
  diffChars,
  diffWords,
  getDiffStats,
  formatUnifiedDiff,
  areTextsEqual,
} from './diffUtils'
import type { DiffMode, DiffSegment } from '@/types'

defineOptions({ name: 'DiffTool' })

const { t } = useI18n()
const { copy } = useClipboard()
const { showSuccess } = useNotification()

const MonacoEditor = defineAsyncComponent(() => import('@/components/MonacoEditor.vue'))

const leftText = ref('Line 1\nLine 2\nLine 3\nLine 4')
const rightText = ref('Line 1\nLine 2 modified\nLine 3\nLine 5')
const mode = ref<DiffMode>('line')
const ignoreWhitespace = ref(false)
const showUnified = ref(false)

const segments = ref<DiffSegment[]>([])

const { saveHistory } = useHistory('diff')

const stats = computed(() => getDiffStats(segments.value))

const equalCheck = computed(() => areTextsEqual(leftText.value, rightText.value, ignoreWhitespace.value))

const unifiedText = computed(() => formatUnifiedDiff(segments.value))

const modeButtons: { key: DiffMode; labelKey: string }[] = [
  { key: 'line', labelKey: 'tools.diff.labels.line' },
  { key: 'char', labelKey: 'tools.diff.labels.char' },
  { key: 'word', labelKey: 'tools.diff.labels.word' },
]

function computeDiff(): void {
  const l = ignoreWhitespace.value ? leftText.value.replace(/\s+/g, ' ').trim() : leftText.value
  const r = ignoreWhitespace.value ? rightText.value.replace(/\s+/g, ' ').trim() : rightText.value
  if (mode.value === 'line') {
    segments.value = diffLines(l, r)
  } else if (mode.value === 'char') {
    segments.value = diffChars(l, r)
  } else {
    segments.value = diffWords(l, r)
  }
}

function handleCompare(): void {
  computeDiff()
  void saveHistory(
    `${leftText.value.slice(0, 50)}|${rightText.value.slice(0, 50)}`,
    JSON.stringify(segments.value.slice(0, 10)),
  )
  showSuccess(t('tools.diff.messages.compared', { add: stats.value.additions, del: stats.value.deletions }))
}

function handleSwap(): void {
  const temp = leftText.value
  leftText.value = rightText.value
  rightText.value = temp
  computeDiff()
}

async function copyUnified(): Promise<void> {
  if (!unifiedText.value) return
  await copy(unifiedText.value)
  showSuccess(t('tools.diff.actions.unified'))
}

function handleClear(): void {
  leftText.value = ''
  rightText.value = ''
  segments.value = []
  showUnified.value = false
}
</script>

<template>
  <ToolCard
    :title="t('tools.diff.title')"
    :description="t('tools.diff.description')"
    tool-id="diff"
    layout="wide"
  >
    <template #actions>
      <div class="flex flex-wrap items-center gap-2">
        <div class="mag-tab-group">
          <button
            v-for="m in modeButtons"
            :key="m.key"
            class="mag-tab"
            :class="mode === m.key ? 'mag-tab-active' : ''"
            @click="mode = m.key"
          >
            {{ t(m.labelKey) }}
          </button>
        </div>
        <button class="mag-btn-primary" @click="handleCompare">{{ t('tools.diff.actions.compare') }}</button>
        <button class="mag-btn" @click="handleSwap">{{ t('tools.diff.actions.swap') }}</button>
        <button
          :class="showUnified ? 'mag-btn-primary' : 'mag-btn'"
          @click="showUnified = !showUnified"
        >
          {{ t('tools.diff.actions.unified') }}
        </button>
        <label class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <input v-model="ignoreWhitespace" type="checkbox" class="rounded" @change="computeDiff" />
          {{ t('tools.diff.labels.ignoreWhitespace') }}
        </label>
      </div>
    </template>

    <template #input>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mag-label">{{ t('tools.diff.labels.left') }}</label>
          <MonacoEditor v-model="leftText" language="plaintext" :height="200" />
        </div>
        <div>
          <label class="mag-label">{{ t('tools.diff.labels.right') }}</label>
          <MonacoEditor v-model="rightText" language="plaintext" :height="200" />
        </div>
      </div>
    </template>

    <template #output>
      <div class="space-y-3">
        <!-- 相等性检查 -->
        <div
          class="rounded-lg border p-3 text-sm"
          :class="equalCheck
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300'
            : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300'"
        >
          <span class="font-medium">{{ t('tools.diff.labels.equalCheck') }}:</span>
          {{ equalCheck ? t('tools.diff.messages.equal') : t('tools.diff.messages.different') }}
        </div>

        <div class="mb-2 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <label class="mag-label-inline">{{ t('tools.diff.labels.result') }}</label>
            <div v-if="segments.length" class="flex items-center gap-3 text-xs">
              <span class="text-emerald-600 dark:text-emerald-400">+{{ stats.additions }}</span>
              <span class="text-red-600 dark:text-red-400">-{{ stats.deletions }}</span>
              <span class="text-slate-400">{{ stats.unchanged }} {{ t('tools.diff.labels.unchanged') }}</span>
            </div>
          </div>
          <ActionButtons
            :text="showUnified ? unifiedText : segments.map((s) => s.text).join('')"
            :show-save="false"
            file-prefix="diff"
            extension="diff"
            @clear="handleClear"
          />
        </div>

        <!-- Unified 格式输出 -->
        <div v-if="showUnified && segments.length">
          <div class="mb-2 flex items-center justify-between">
            <label class="mag-label-sm">{{ t('tools.diff.actions.unified') }}</label>
            <button
              class="mag-btn-primary mag-btn-sm"
              @click="copyUnified"
            >
              {{ t('tools.diff.actions.unified') }}
            </button>
          </div>
          <pre class="mag-cell max-h-80 overflow-auto font-mono !text-xs">{{ unifiedText }}</pre>
        </div>

        <!-- 可视化差异 -->
        <div v-else class="overflow-hidden rounded-lg border border-slate-200/60 dark:border-slate-700/60">
          <div class="max-h-80 overflow-y-auto bg-slate-50/60 font-mono text-sm dark:bg-slate-800/40">
            <div
              v-for="(seg, i) in segments"
              :key="i"
              class="whitespace-pre-wrap break-words px-3 py-0.5"
              :class="{
                'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300': seg.type === 'insert',
                'bg-red-50 text-red-800 line-through dark:bg-red-900/20 dark:text-red-300': seg.type === 'delete',
                'text-slate-600 dark:text-slate-400': seg.type === 'equal',
              }"
            >
              <span class="mr-2 select-none opacity-50">
                {{ seg.type === 'insert' ? '+' : seg.type === 'delete' ? '-' : ' ' }}
              </span>
              {{ seg.text }}
            </div>
            <div v-if="!segments.length" class="px-3 py-6 text-center text-slate-400">
              {{ t('tools.diff.messages.clickCompare') }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #history>
      <HistoryList tool="diff" @select="(item) => { leftText = item.input.split('|')[0] ?? ''; rightText = item.input.split('|')[1] ?? '' }" />
    </template>
  </ToolCard>
</template>

