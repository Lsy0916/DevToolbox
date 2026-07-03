<!--
  PasswordTool 密码生成工具
  用于批量生成随机密码并评估强度的工具。
  - 可配置长度、字符集（大小写字母、数字、符号）及排除易混淆字符
  - 实时评估每条密码强度并以颜色条直观展示
  - 支持单条或全部复制，记录生成历史
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import { useClipboard } from '@/composables/useClipboard'
import { generatePassword, estimateStrength } from './passwordUtils'
import type { PasswordStrength } from '@/types'

defineOptions({ name: 'PasswordTool' })

const { t } = useI18n()
const { showSuccess, showError } = useNotification()
const { copy } = useClipboard()
const { saveHistory } = useHistory('password')

// 选项状态
const length = ref(16)
const upper = ref(true)
const lower = ref(true)
const digits = ref(true)
const symbols = ref(false)
const excludeAmbiguous = ref(true)
const count = ref(5)

// 生成结果 + 对应强度评估
const results = ref<string[]>([])
const strengths = ref<PasswordStrength[]>([])

// 强度条颜色映射（5 段）
const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500']

function strengthLabel(score: number): string {
  const labels = [
    'tools.password.strength.veryWeak',
    'tools.password.strength.weak',
    'tools.password.strength.fair',
    'tools.password.strength.strong',
    'tools.password.strength.veryStrong',
  ]
  return t(labels[score] ?? labels[0] ?? '')
}

// 生成密码
function handleGenerate(): void {
  if (!upper.value && !lower.value && !digits.value && !symbols.value) {
    showError(t('tools.password.messages.noCharsetSelected'))
    return
  }
  const list = generatePassword({
    length: length.value,
    upper: upper.value,
    lower: lower.value,
    digits: digits.value,
    symbols: symbols.value,
    excludeAmbiguous: excludeAmbiguous.value,
    count: count.value,
  })
  results.value = list
  strengths.value = list.map(estimateStrength)
  if (list.length) {
    void saveHistory(`len=${length.value} x${count.value}`, list[0] ?? '')
    showSuccess(t('tools.password.messages.generated', { n: list.length }))
  }
}

// 复制单条
async function handleCopyOne(text: string): Promise<void> {
  const ok = await copy(text)
  if (ok) showSuccess(t('common.copySuccess'))
}

// 复制全部
async function handleCopyAll(): Promise<void> {
  if (!results.value.length) {
    showError(t('common.nothingToCopy'))
    return
  }
  const ok = await copy(results.value.join('\n'))
  if (ok) showSuccess(t('common.copySuccess'))
}

function handleClear(): void {
  results.value = []
  strengths.value = []
}
</script>

<template>
  <ToolCard
    :title="t('tools.password.title')"
    :description="t('tools.password.description')"
    tool-id="password"
    layout="wide"
  >
    <template #actions>
      <div class="space-y-4">
        <!-- 长度滑块 -->
        <div class="flex items-center gap-3">
          <label class="mag-label-inline w-24">
            {{ t('tools.password.labels.length') }}
          </label>
          <input
            v-model.number="length"
            type="range"
            min="4"
            max="64"
            class="flex-1"
          />
          <span class="mag-mono w-10">{{ length }}</span>
        </div>

        <!-- 字符集勾选 -->
        <div class="mag-card flex flex-wrap items-center gap-4">
          <label class="mag-label-inline flex items-center gap-1.5">
            <input v-model="upper" type="checkbox" class="rounded" />
            {{ t('tools.password.labels.upper') }}
          </label>
          <label class="mag-label-inline flex items-center gap-1.5">
            <input v-model="lower" type="checkbox" class="rounded" />
            {{ t('tools.password.labels.lower') }}
          </label>
          <label class="mag-label-inline flex items-center gap-1.5">
            <input v-model="digits" type="checkbox" class="rounded" />
            {{ t('tools.password.labels.digits') }}
          </label>
          <label class="mag-label-inline flex items-center gap-1.5">
            <input v-model="symbols" type="checkbox" class="rounded" />
            {{ t('tools.password.labels.symbols') }}
          </label>
          <label class="mag-label-inline flex items-center gap-1.5">
            <input v-model="excludeAmbiguous" type="checkbox" class="rounded" />
            {{ t('tools.password.labels.excludeAmbiguous') }}
          </label>
        </div>

        <!-- 数量 + 操作按钮 -->
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <label class="mag-label-inline">
              {{ t('tools.password.labels.count') }}
            </label>
            <input
              v-model.number="count"
              type="number"
              min="1"
              max="50"
              class="mag-input w-20"
            />
          </div>
          <button class="mag-btn-primary" @click="handleGenerate">
            {{ t('tools.password.actions.generate') }}
          </button>
          <button v-if="results.length" class="mag-btn-ghost" @click="handleClear">
            {{ t('common.clear') }}
          </button>
        </div>
      </div>
    </template>

    <template #output>
      <div v-if="results.length" class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="mag-label-inline">
            {{ t('tools.password.labels.result') }} ({{ results.length }})
          </span>
          <button
            class="mag-btn"
            @click="handleCopyAll"
          >
            {{ t('tools.password.actions.copyAll') }}
          </button>
        </div>
        <ul class="space-y-2">
          <li
            v-for="(pwd, idx) in results"
            :key="idx"
            class="mag-cell group"
          >
            <div class="flex items-center gap-3">
              <code class="mag-mono flex-1 break-all">{{ pwd }}</code>
              <button
                class="shrink-0 text-slate-400 opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                :aria-label="t('common.copy')"
                @click="handleCopyOne(pwd)"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </button>
            </div>
            <!-- 强度条 -->
            <div class="mt-2 flex items-center gap-2">
              <div class="flex flex-1 gap-1">
                <div
                  v-for="i in 5"
                  :key="i"
                  class="h-1.5 flex-1 rounded-full"
                  :class="(i - 1) <= (strengths[idx]?.score ?? 0) ? strengthColors[strengths[idx]?.score ?? 0] : 'bg-slate-200 dark:bg-slate-700'"
                />
              </div>
              <span class="text-xs text-slate-500 dark:text-slate-400">
                {{ strengthLabel(strengths[idx]?.score ?? 0) }} · {{ strengths[idx]?.entropy ?? 0 }} {{ t('tools.password.labels.entropy') }}
              </span>
            </div>
          </li>
        </ul>
      </div>
      <div v-else class="py-12 text-center text-sm text-slate-400">
        {{ t('tools.password.messages.emptyResult') }}
      </div>
    </template>

    <template #history>
      <HistoryList tool="password" @select="() => {}" />
    </template>
  </ToolCard>
</template>

