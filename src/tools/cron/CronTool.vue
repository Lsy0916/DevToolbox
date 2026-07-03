<!--
  CronTool Cron 表达式工具
  用于解析、校验和可视化 Cron 表达式的工具。
  - 实时校验表达式合法性并生成自然语言描述
  - 计算并展示未来与历史执行时间及各字段含义
  - 内置常用表达式预设，支持字段级可视化编辑
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import { useClipboard } from '@/composables/useClipboard'
import {
  validateCron,
  describeCron,
  getNextRuns,
  getPreviousRuns,
  describeFields,
  CRON_PRESETS,
  CRON_DESCRIBE_FAILED,
  type FieldName,
} from './cronUtils'
import CronFieldSelector from './components/CronFieldSelector.vue'

defineOptions({ name: 'CronTool' })

const { t, locale } = useI18n()
const { showSuccess } = useNotification()
const { saveHistory } = useHistory('cron')
const { copy } = useClipboard()

const expr = ref('*/5 * * * *')
const validation = computed(() => validateCron(expr.value))

const description = computed(() => {
  if (!validation.value.valid) return ''
  return describeCron(expr.value, locale.value)
})

const nextRuns = computed(() => {
  if (!validation.value.valid) return []
  return getNextRuns(expr.value, 5)
})

const prevRuns = computed(() => {
  if (!validation.value.valid) return []
  return getPreviousRuns(expr.value, 5)
})

const fieldDescs = computed(() => {
  if (!validation.value.valid) return []
  return describeFields(expr.value)
})

function formatMeaning(fd: { meaningKey: string; meaningParams?: Record<string, string> }): string {
  const params = { ...(fd.meaningParams ?? {}) }
  if (params.field) {
    params.field = t(params.field)
  }
  return t(fd.meaningKey, params)
}

const fieldNames: FieldName[] = ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek']

const fieldValues = computed(() => expr.value.trim().split(/\s+/))

function updateField(index: number, value: string): void {
  const parts = expr.value.trim().split(/\s+/)
  parts[index] = value
  expr.value = parts.join(' ')
}

function applyPreset(presetExpr: string): void {
  expr.value = presetExpr
}

function handleSave(): void {
  if (!validation.value.valid) return
  void saveHistory(expr.value, description.value)
  showSuccess(t('tools.cron.messages.saved'))
}

async function handleCopy(): Promise<void> {
  const ok = await copy(expr.value)
  if (ok) showSuccess(t('common.copied'))
}

const syntaxRef: { syntax: string; descKey: string }[] = [
  { syntax: '*', descKey: 'tools.cron.syntax.star' },
  { syntax: '*/n', descKey: 'tools.cron.syntax.step' },
  { syntax: 'a-b', descKey: 'tools.cron.syntax.range' },
  { syntax: 'a,b,c', descKey: 'tools.cron.syntax.list' },
  { syntax: 'L', descKey: 'tools.cron.syntax.last' },
  { syntax: '#', descKey: 'tools.cron.syntax.nth' },
]
</script>

<template>
  <ToolCard
    :title="t('tools.cron.title')"
    :description="t('tools.cron.description')"
    tool-id="cron"
    layout="wide"
  >
    <template #actions>
      <button
        class="mag-btn-primary"
        @click="handleSave"
      >
        {{ t('tools.cron.actions.save') }}
      </button>
    </template>

    <template #input>
      <div class="space-y-4">
        <!-- 表达式输入 + 复制 -->
        <div>
          <label class="mag-label">{{ t('tools.cron.labels.expression') }}</label>
          <div class="flex gap-2">
            <input
              v-model="expr"
              type="text"
              class="mag-input mag-input-mono flex-1"
              placeholder="*/5 * * * *"
              spellcheck="false"
            />
            <button
              class="mag-btn shrink-0"
              :title="t('tools.cron.labels.copy')"
              @click="handleCopy"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="!validation.valid" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-300">
          <p class="font-medium">{{ t('tools.cron.messages.invalid') }}</p>
          <p v-if="validation.error" class="mt-1 font-mono opacity-80">{{ validation.error }}</p>
        </div>

        <!-- 字段级选择器 -->
        <div>
          <label class="mag-label-sm">{{ t('tools.cron.labels.fieldSelector') }}</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <CronFieldSelector
              v-for="(fn, i) in fieldNames"
              :key="fn"
              :field="fn"
              :model-value="fieldValues[i] ?? '*'"
              @update:model-value="(v) => updateField(i, v)"
            />
          </div>
        </div>

        <!-- 预设 -->
        <div>
          <label class="mag-label-sm">{{ t('tools.cron.labels.presets') }}</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="preset in CRON_PRESETS"
              :key="preset.expr"
              class="mag-btn mag-btn-sm"
              @click="applyPreset(preset.expr)"
            >
              {{ t(preset.nameKey) }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <template #output>
      <div v-if="validation.valid" class="space-y-4">
        <!-- 人类可读描述 -->
        <div class="mag-card-accent">
          <p class="mag-cell-label">{{ t('tools.cron.labels.description') }}</p>
          <p v-if="description !== CRON_DESCRIBE_FAILED" class="mag-cell-value mt-1 font-medium">{{ description }}</p>
          <p v-else class="mag-cell-value mt-1 font-medium text-amber-600 dark:text-amber-400">{{ t('tools.cron.messages.describeFailed') }}</p>
        </div>

        <!-- 字段说明表（含含义列） -->
        <div>
          <label class="mag-label">{{ t('tools.cron.labels.fields') }}</label>
          <div class="space-y-2">
            <div v-for="(fd, i) in fieldDescs" :key="i" class="mag-cell">
              <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ t(`tools.cron.fields.${fd.name}`) }}</span>
                <span class="mag-mono text-primary">{{ fd.value }}</span>
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ formatMeaning(fd) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 下次 / 上次执行时间（2 列） -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="mag-label">{{ t('tools.cron.labels.nextRuns') }}</label>
            <div class="space-y-1.5">
              <div
                v-for="(run, i) in nextRuns"
                :key="'n' + i"
                class="mag-cell flex items-center gap-3"
              >
                <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">{{ i + 1 }}</span>
                <span class="mag-mono">{{ run.formatted }}</span>
              </div>
            </div>
          </div>

          <div>
            <label class="mag-label">{{ t('tools.cron.labels.prevRuns') }}</label>
            <div class="space-y-1.5">
              <div
                v-for="(run, i) in prevRuns"
                :key="'p' + i"
                class="mag-cell flex items-center gap-3"
              >
                <span class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-500 dark:bg-slate-600 dark:text-slate-300">{{ i + 1 }}</span>
                <span class="mag-mono">{{ run.formatted }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 语法参考表 -->
        <div>
          <label class="mag-label">{{ t('tools.cron.labels.syntaxRef') }}</label>
          <div class="mag-card overflow-hidden p-0">
            <table class="w-full text-sm">
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700/40">
                <tr v-for="sr in syntaxRef" :key="sr.syntax">
                  <td class="w-20 px-3 py-2 font-mono text-xs font-medium text-primary">{{ sr.syntax }}</td>
                  <td class="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">{{ t(sr.descKey) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-else class="py-8 text-center text-sm text-slate-400">
        {{ t('tools.cron.messages.fixExpression') }}
      </div>
    </template>

    <template #history>
      <HistoryList tool="cron" @select="(item) => { expr = item.input }" />
    </template>
  </ToolCard>
</template>
