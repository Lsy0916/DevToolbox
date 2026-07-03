<!--
  UrlTool
  URL 编解码与解析工具组件，提供 URL 相关的处理能力。
  - 支持编码、解码（component / uri 两种模式）
  - 支持解析 URL 结构并提供查询参数可视化编辑器与重建预览
  - 内置 URL 安全性检查，提示潜在风险原因
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import ActionButtons from '@/components/ActionButtons.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import {
  encodeUrlByMode,
  decodeUrlByMode,
  parseUrl,
  parseQuery,
  rebuildUrlWithQuery,
  checkUrlSafety,
  type ParsedUrl,
  type EncodeMode,
} from './urlUtils'

defineOptions({ name: 'UrlTool' })

const { t } = useI18n()

const input = ref('https://example.com/path?key=value&name=test#section')
const output = ref('')
const parsed = ref<ParsedUrl | null>(null)
const queryParams = ref<Array<{ key: string; value: string }>>([])
const encodeMode = ref<EncodeMode>('component')
const safetyResult = ref<{ safe: boolean; reasons: string[] } | null>(null)

// 查询参数编辑器：可增删改的参数行
const paramRows = ref<Array<{ key: string; value: string }>>([])

const { saveHistory } = useHistory('url')
const { showSuccess, showError } = useNotification()

// 重建 URL 预览（基于参数行）
const rebuiltPreview = computed(() => rebuildUrlWithQuery(input.value, paramRows.value))

function handleEncode(): void {
  output.value = encodeUrlByMode(input.value, encodeMode.value)
  parsed.value = null
  queryParams.value = []
  void saveHistory(input.value, output.value)
  showSuccess(t('tools.url.messages.encoded'))
}

function handleDecode(): void {
  try {
    output.value = decodeUrlByMode(input.value, encodeMode.value)
    parsed.value = null
    queryParams.value = []
    void saveHistory(input.value, output.value)
    showSuccess(t('tools.url.messages.decoded'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('common.invalid'))
  }
}

function handleParse(): void {
  try {
    parsed.value = parseUrl(input.value)
    output.value = JSON.stringify(parsed.value, null, 2)
    queryParams.value = parseQuery(input.value)
    // 同步到参数编辑器
    paramRows.value = queryParams.value.map((p) => ({ key: p.key, value: p.value }))
    void saveHistory(input.value, output.value)
    showSuccess(t('tools.url.messages.parsed'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('common.invalid'))
  }
}

function handleCheckSafety(): void {
  safetyResult.value = checkUrlSafety(input.value)
  if (safetyResult.value.safe) {
    showSuccess(t('tools.url.messages.safe'))
  } else {
    showError(t('tools.url.messages.unsafe'))
  }
}

function addParam(): void {
  paramRows.value.push({ key: '', value: '' })
  showSuccess(t('tools.url.messages.paramAdded'))
}

function removeParam(index: number): void {
  paramRows.value.splice(index, 1)
  showSuccess(t('tools.url.messages.paramRemoved'))
}

// 安全原因映射到 i18n
function safetyReasonText(reason: string): string {
  const key = `tools.url.safety.${reason}`
  return t(key)
}

function handleClear(): void {
  input.value = ''
  output.value = ''
  parsed.value = null
  queryParams.value = []
  paramRows.value = []
  safetyResult.value = null
}
</script>

<template>
  <ToolCard
    :title="t('tools.url.title')"
    :description="t('tools.url.description')"
    tool-id="url"
    layout="split"
  >
    <template #actions>
      <div class="w-full space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <button class="mag-btn-primary" @click="handleEncode">{{ t('tools.url.actions.encode') }}</button>
          <button class="mag-btn" @click="handleDecode">{{ t('tools.url.actions.decode') }}</button>
          <button class="mag-btn" @click="handleParse">{{ t('tools.url.actions.parse') }}</button>
          <button class="mag-btn" @click="handleCheckSafety">{{ t('tools.url.actions.checkSafety') }}</button>
        </div>
        <!-- 编码模式单选 -->
        <div class="flex items-center gap-3 text-xs">
          <span class="text-slate-500 dark:text-slate-400">{{ t('tools.url.labels.mode') }}:</span>
          <label class="flex items-center gap-1 text-slate-700 dark:text-slate-300">
            <input v-model="encodeMode" type="radio" value="component" class="rounded" />
            {{ t('tools.url.labels.component') }}
          </label>
          <label class="flex items-center gap-1 text-slate-700 dark:text-slate-300">
            <input v-model="encodeMode" type="radio" value="uri" class="rounded" />
            {{ t('tools.url.labels.uri') }}
          </label>
        </div>
      </div>
    </template>

    <template #input>
      <label class="mag-label">{{ t('tools.url.labels.input') }}</label>
      <textarea
        v-model="input"
        class="mag-textarea mag-input-mono h-28"
        :placeholder="t('tools.url.labels.input') + '...'"
        aria-label="URL input"
      />
    </template>

    <template #output>
      <div class="mb-2 flex items-center justify-between">
        <label class="mag-label-inline">{{ t('tools.url.labels.output') }}</label>
        <ActionButtons :text="output" @clear="handleClear" />
      </div>
      <textarea
        v-model="output"
        readonly
        class="mag-textarea mag-input-mono h-28 bg-slate-50/60 dark:bg-slate-800/40"
        :placeholder="t('common.result') + '...'"
        aria-label="URL output"
      />

      <!-- 解析结果网格 -->
      <div v-if="parsed" class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div v-for="(value, key) in parsed" :key="key" class="mag-cell">
          <dt class="mag-cell-label">{{ key }}</dt>
          <dd class="mag-cell-value break-all font-mono">{{ value }}</dd>
        </div>
      </div>

      <!-- 查询参数编辑器 -->
      <div v-if="parsed" class="mt-4">
        <div class="mb-2 flex items-center justify-between">
          <h4 class="mag-section-title-sm">{{ t('tools.url.labels.params') }}</h4>
          <button class="mag-btn" @click="addParam">+ {{ t('tools.url.actions.addParam') }}</button>
        </div>
        <div v-if="paramRows.length" class="space-y-2">
          <div
            v-for="(row, i) in paramRows"
            :key="i"
            class="flex items-center gap-2"
          >
            <input
              v-model="row.key"
              type="text"
              class="mag-input mag-input-mono flex-1 mag-input-xs"
              :placeholder="t('tools.url.labels.key')"
            />
            <span class="text-slate-400">=</span>
            <input
              v-model="row.value"
              type="text"
              class="mag-input mag-input-mono flex-1 mag-input-xs"
              :placeholder="t('tools.url.labels.value')"
            />
            <button
              class="mag-btn-ghost shrink-0 !text-red-500"
              :aria-label="t('tools.url.actions.removeParam')"
              @click="removeParam(i)"
            >
              ✕
            </button>
          </div>
        </div>
        <p v-else class="text-xs text-slate-400">{{ t('common.empty') }}</p>

        <!-- 重建 URL 预览 -->
        <div v-if="paramRows.length" class="mt-3">
          <label class="mag-label-sm">{{ t('tools.url.labels.preview') }}</label>
          <p class="mag-cell break-all font-mono !text-xs !text-primary">{{ rebuiltPreview }}</p>
        </div>
      </div>

      <!-- 安全检查结果 -->
      <div v-if="safetyResult" class="mt-4">
        <h4 class="mag-section-title-sm">{{ t('tools.url.labels.safety') }}</h4>
        <div
          class="rounded-lg p-3"
          :class="safetyResult.safe ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'"
        >
          <p class="text-sm font-medium" :class="safetyResult.safe ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'">
            {{ safetyResult.safe ? '✓ ' + t('tools.url.messages.safe') : '✕ ' + t('tools.url.messages.unsafe') }}
          </p>
          <ul v-if="!safetyResult.safe && safetyResult.reasons.length" class="mt-2 space-y-1">
            <li v-for="(reason, i) in safetyResult.reasons" :key="i" class="text-xs text-red-600 dark:text-red-400">
              · {{ safetyReasonText(reason) }}
            </li>
          </ul>
        </div>
      </div>
    </template>

    <template #history>
      <HistoryList tool="url" @select="(item) => { input = item.input; output = item.output }" />
    </template>
  </ToolCard>
</template>

