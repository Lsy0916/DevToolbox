<!--
  UuidTool UUID 生成工具
  用于批量生成唯一标识符（UUID）的工具。
  - 支持 UUID v1、v4、v7 等多个版本
  - 可配置是否带连字符、是否大写及生成数量
  - 支持单条或全部复制，并记录生成历史
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import { useClipboard } from '@/composables/useClipboard'
import { generateUuid } from './uuidUtils'
import type { UuidVersion } from '@/types'

defineOptions({ name: 'UuidTool' })

const { t } = useI18n()
const { showSuccess, showError } = useNotification()
const { copy } = useClipboard()
const { saveHistory } = useHistory('uuid')

// 选项状态
const version = ref<UuidVersion>('v4')
const count = ref(1)
const hyphen = ref(true)
const uppercase = ref(false)
// 生成结果列表
const results = ref<string[]>([])

// 生成 UUID
function handleGenerate(): void {
  const n = Math.max(1, Math.min(1000, count.value))
  try {
    const list = generateUuid({
      version: version.value,
      count: n,
      hyphen: hyphen.value,
      uppercase: uppercase.value,
    })
    results.value = list
    if (list.length) {
      void saveHistory(`${version.value} x${n}`, list.slice(0, 5).join('\n'))
      showSuccess(t('tools.uuid.messages.generated', { n: list.length }))
    } else {
      showError(t('tools.uuid.messages.emptyResult'))
    }
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.uuid.messages.emptyResult'))
  }
}

// 复制单条
async function handleCopyOne(text: string): Promise<void> {
  const ok = await copy(text)
  if (ok) showSuccess(t('common.copySuccess'))
}

// 复制全部（换行拼接）
async function handleCopyAll(): Promise<void> {
  if (!results.value.length) {
    showError(t('common.nothingToCopy'))
    return
  }
  const ok = await copy(results.value.join('\n'))
  if (ok) showSuccess(t('common.copySuccess'))
}

// 清空结果
function handleClear(): void {
  results.value = []
}
</script>

<template>
  <ToolCard
    :title="t('tools.uuid.title')"
    :description="t('tools.uuid.description')"
    tool-id="uuid"
    layout="wide"
  >
    <template #actions>
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <label class="mag-label-inline">
            {{ t('tools.uuid.labels.version') }}
          </label>
          <select
            v-model="version"
            class="mag-input w-auto"
          >
            <option value="v4">{{ t('tools.uuid.labels.v4') }}</option>
            <option value="v1">{{ t('tools.uuid.labels.v1') }}</option>
            <option value="nil">{{ t('tools.uuid.labels.nil') }}</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <label class="mag-label-inline">
            {{ t('tools.uuid.labels.count') }}
          </label>
          <input
            v-model.number="count"
            type="number"
            min="1"
            max="1000"
            class="mag-input w-20"
          />
        </div>

        <label class="mag-label-inline flex items-center gap-1.5">
          <input v-model="hyphen" type="checkbox" class="rounded" />
          {{ t('tools.uuid.labels.hyphen') }}
        </label>

        <label class="mag-label-inline flex items-center gap-1.5">
          <input v-model="uppercase" type="checkbox" class="rounded" />
          {{ t('tools.uuid.labels.uppercase') }}
        </label>

        <button
          class="mag-btn-primary"
          @click="handleGenerate"
        >
          {{ t('tools.uuid.actions.generate') }}
        </button>
        <button
          v-if="results.length"
          class="mag-btn-ghost"
          @click="handleClear"
        >
          {{ t('tools.uuid.actions.clear') }}
        </button>
      </div>
    </template>

    <template #output>
      <div v-if="results.length" class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="mag-label-inline">
            {{ t('tools.uuid.labels.result') }} ({{ results.length }})
          </span>
          <button
            class="mag-btn"
            @click="handleCopyAll"
          >
            {{ t('tools.uuid.actions.copyAll') }}
          </button>
        </div>
        <ul class="mag-card divide-y divide-slate-100 overflow-y-auto p-0 dark:divide-slate-700/40" style="max-height: 360px">
          <li
            v-for="(item, idx) in results"
            :key="idx"
            class="group flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/40"
          >
            <code class="mag-mono flex-1 truncate">{{ item }}</code>
            <button
              class="shrink-0 text-slate-400 opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
              :aria-label="t('common.copy')"
              @click="handleCopyOne(item)"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
          </li>
        </ul>
      </div>
      <div v-else class="py-12 text-center text-sm text-slate-400">
        {{ t('tools.uuid.messages.emptyResult') }}
      </div>
    </template>

    <template #history>
      <HistoryList tool="uuid" @select="() => {}" />
    </template>
  </ToolCard>
</template>

