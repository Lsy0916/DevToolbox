<!--
  ApiTool API 请求工具
  用于发送和调试 HTTP/REST 接口请求的工具。
  - 支持 GET/POST/PUT/DELETE 等多种方法及参数、请求头、请求体配置
  - 提供 JSON 自动格式化、响应耗时与大小统计，并可生成 cURL 命令
  - 基于 Monaco 编辑器编辑请求体与查看响应内容
-->
<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import { useClipboard } from '@/composables/useClipboard'
import {
  executeRequest,
  generateCurl,
  formatDuration,
  formatSize,
  statusCategory,
  tryFormatJson,
  detectBodyLanguage,
  buildUrl,
} from './apiUtils'
import type { HttpMethod, BodyType, KeyValue, ApiResponse } from '@/types'

defineOptions({ name: 'ApiTool' })

const { t } = useI18n()
const { showSuccess, showError } = useNotification()
const { copy } = useClipboard()
const { saveHistory } = useHistory('api')

const MonacoEditor = defineAsyncComponent(() => import('@/components/MonacoEditor.vue'))

const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
const method = ref<HttpMethod>('GET')
const url = ref('https://httpbin.org/get')
const activeTab = ref<'params' | 'headers' | 'body'>('params')
const bodyType = ref<BodyType>('none')
const bodyText = ref('{\n  "key": "value"\n}')
const timeout = ref(30)

const paramRows = ref<KeyValue[]>([
  { key: '', value: '', enabled: true },
])
const headerRows = ref<KeyValue[]>([
  { key: 'Accept', value: 'application/json', enabled: true },
])
const formRows = ref<KeyValue[]>([
  { key: '', value: '', enabled: true },
])

const response = ref<ApiResponse | null>(null)
const loading = ref(false)
const showCurl = ref(false)
const autoFormatJson = ref(true)

const bodyTypes: { key: BodyType; labelKey: string }[] = [
  { key: 'none', labelKey: 'tools.api.labels.bodyNone' },
  { key: 'json', labelKey: 'tools.api.labels.bodyJson' },
  { key: 'form', labelKey: 'tools.api.labels.bodyForm' },
  { key: 'urlencoded', labelKey: 'tools.api.labels.bodyUrlencoded' },
  { key: 'text', labelKey: 'tools.api.labels.bodyText' },
]

const tabs: { key: typeof activeTab.value; labelKey: string }[] = [
  { key: 'params', labelKey: 'tools.api.labels.tabParams' },
  { key: 'headers', labelKey: 'tools.api.labels.tabHeaders' },
  { key: 'body', labelKey: 'tools.api.labels.tabBody' },
]

const finalUrl = computed(() => buildUrl(url.value, paramRows.value))

const curlCommand = computed(() =>
  generateCurl(method.value, finalUrl.value, headerRows.value, bodyType.value, bodyText.value, formRows.value),
)

const displayBody = computed(() => {
  if (!response.value || !response.value.body) return ''
  if (autoFormatJson.value) return tryFormatJson(response.value.body)
  return response.value.body
})

const bodyLanguage = computed(() => {
  if (!response.value) return 'plaintext' as const
  const ct = response.value.headers['content-type'] ?? ''
  return detectBodyLanguage(response.value.body, ct)
})

const statusClass = computed(() => {
  if (!response.value) return ''
  const cat = statusCategory(response.value.status)
  return {
    info: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    redirect: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    client: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    server: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  }[cat]
})

function addRow(target: 'params' | 'headers' | 'form'): void {
  const row: KeyValue = { key: '', value: '', enabled: true }
  if (target === 'params') paramRows.value.push(row)
  else if (target === 'headers') headerRows.value.push(row)
  else formRows.value.push(row)
}

function removeRow(target: 'params' | 'headers' | 'form', index: number): void {
  if (target === 'params') paramRows.value.splice(index, 1)
  else if (target === 'headers') headerRows.value.splice(index, 1)
  else formRows.value.splice(index, 1)
}

async function handleSend(): Promise<void> {
  if (!url.value) {
    showError(t('tools.api.messages.urlRequired'))
    return
  }
  loading.value = true
  response.value = null
  try {
    const res = await executeRequest(
      method.value,
      finalUrl.value,
      headerRows.value,
      bodyType.value,
      bodyText.value,
      formRows.value,
      timeout.value * 1000,
    )
    response.value = res
    if (res.error) {
      const errorType = res.errorType ?? 'unknown'
      const messageKey: Record<string, string> = {
        timeout: 'tools.api.messages.timeoutError',
        network: 'tools.api.messages.networkError',
        cors: 'tools.api.messages.corsError',
        unknown: 'tools.api.messages.unknownError',
      }
      showError(t(messageKey[errorType] ?? 'tools.api.messages.unknownError'))
    } else {
      showSuccess(t('tools.api.messages.success', { status: res.status }))
      void saveHistory(`${method.value} ${finalUrl.value}`, `Status: ${res.status}, Duration: ${formatDuration(res.duration)}`)
    }
  } finally {
    loading.value = false
  }
}

async function copyCurl(): Promise<void> {
  await copy(curlCommand.value)
}

function handleClear(): void {
  response.value = null
}

function applyPreset(preset: 'get' | 'post' | 'jsonPlaceholder'): void {
  if (preset === 'get') {
    method.value = 'GET'
    url.value = 'https://httpbin.org/get'
    bodyType.value = 'none'
  } else if (preset === 'post') {
    method.value = 'POST'
    url.value = 'https://httpbin.org/post'
    bodyType.value = 'json'
    bodyText.value = '{\n  "name": "test",\n  "value": 123\n}'
  } else if (preset === 'jsonPlaceholder') {
    method.value = 'GET'
    url.value = 'https://jsonplaceholder.typicode.com/users/1'
    bodyType.value = 'none'
  }
}
</script>

<template>
  <ToolCard
    :title="t('tools.api.title')"
    :description="t('tools.api.description')"
    tool-id="api"
    layout="wide"
  >
    <template #actions>
      <div class="flex flex-wrap items-center gap-2">
        <button class="mag-btn" @click="applyPreset('get')">GET Demo</button>
        <button class="mag-btn" @click="applyPreset('post')">POST Demo</button>
        <button class="mag-btn" @click="applyPreset('jsonPlaceholder')">JSONPlaceholder</button>
        <button
          class="mag-btn"
          :class="showCurl ? 'bg-primary text-white' : ''"
          @click="showCurl = !showCurl"
        >
          {{ t('tools.api.actions.curl') }}
        </button>
      </div>
    </template>

    <template #input>
      <div class="space-y-3">
        <!-- 请求行 -->
        <div class="flex flex-wrap items-center gap-2">
          <select
            v-model="method"
            class="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          >
            <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
          </select>
          <input
            v-model="url"
            type="text"
            class="mag-input mag-input-mono flex-1 min-w-[260px]"
            :placeholder="t('tools.api.labels.urlPlaceholder')"
            @keydown.enter="handleSend"
          />
          <button
            class="mag-btn-primary"
            :disabled="loading"
            @click="handleSend"
          >
            <span v-if="loading">...</span>
            <span v-else>{{ t('tools.api.actions.send') }}</span>
          </button>
        </div>

        <!-- 超时设置 -->
        <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <label>{{ t('tools.api.labels.timeout') }}: {{ timeout }}s</label>
          <input v-model.number="timeout" type="range" min="5" max="120" class="flex-1 max-w-[200px]" />
        </div>

        <!-- Tabs -->
        <div class="mag-tab-group">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="mag-tab"
            :class="activeTab === tab.key ? 'mag-tab-active' : ''"
            @click="activeTab = tab.key"
          >
            {{ t(tab.labelKey) }}
            <span v-if="tab.key === 'params' && paramRows.filter(r => r.enabled && r.key).length" class="ml-1 rounded-full bg-primary/10 px-1.5 text-xs text-primary">
              {{ paramRows.filter(r => r.enabled && r.key).length }}
            </span>
            <span v-if="tab.key === 'headers' && headerRows.filter(r => r.enabled && r.key).length" class="ml-1 rounded-full bg-primary/10 px-1.5 text-xs text-primary">
              {{ headerRows.filter(r => r.enabled && r.key).length }}
            </span>
          </button>
        </div>

        <!-- Params Tab -->
        <div v-if="activeTab === 'params'" class="space-y-2">
          <div v-for="(row, i) in paramRows" :key="i" class="flex items-center gap-2">
            <input v-model="row.enabled" type="checkbox" class="rounded" />
            <input
              v-model="row.key"
              type="text"
              class="mag-input mag-input-mono mag-input-xs flex-1"
              :placeholder="t('tools.api.labels.keyPlaceholder')"
            />
            <input
              v-model="row.value"
              type="text"
              class="mag-input mag-input-mono mag-input-xs flex-1"
              :placeholder="t('tools.api.labels.valuePlaceholder')"
            />
            <button class="text-slate-400 hover:text-red-500" @click="removeRow('params', i)">✕</button>
          </div>
          <button class="text-xs text-primary hover:underline" @click="addRow('params')">
            + {{ t('tools.api.actions.addRow') }}
          </button>
        </div>

        <!-- Headers Tab -->
        <div v-if="activeTab === 'headers'" class="space-y-2">
          <div v-for="(row, i) in headerRows" :key="i" class="flex items-center gap-2">
            <input v-model="row.enabled" type="checkbox" class="rounded" />
            <input
              v-model="row.key"
              type="text"
              class="mag-input mag-input-mono mag-input-xs flex-1"
              :placeholder="t('tools.api.labels.keyPlaceholder')"
            />
            <input
              v-model="row.value"
              type="text"
              class="mag-input mag-input-mono mag-input-xs flex-1"
              :placeholder="t('tools.api.labels.valuePlaceholder')"
            />
            <button class="text-slate-400 hover:text-red-500" @click="removeRow('headers', i)">✕</button>
          </div>
          <button class="text-xs text-primary hover:underline" @click="addRow('headers')">
            + {{ t('tools.api.actions.addRow') }}
          </button>
        </div>

        <!-- Body Tab -->
        <div v-if="activeTab === 'body'" class="space-y-2">
          <div class="mag-tab-group">
            <button
              v-for="bt in bodyTypes"
              :key="bt.key"
              class="mag-tab mag-btn-sm"
              :class="bodyType === bt.key ? 'mag-tab-active' : ''"
              @click="bodyType = bt.key"
            >
              {{ t(bt.labelKey) }}
            </button>
          </div>

          <div v-if="bodyType === 'json' || bodyType === 'text'">
            <MonacoEditor v-model="bodyText" :language="bodyType === 'json' ? 'json' : 'plaintext'" :height="180" />
          </div>

          <div v-else-if="bodyType === 'form' || bodyType === 'urlencoded'" class="space-y-2">
            <div v-for="(row, i) in formRows" :key="i" class="flex items-center gap-2">
              <input v-model="row.enabled" type="checkbox" class="rounded" />
              <input
                v-model="row.key"
                type="text"
                class="mag-input mag-input-mono mag-input-xs flex-1"
                :placeholder="t('tools.api.labels.keyPlaceholder')"
              />
              <input
                v-model="row.value"
                type="text"
                class="mag-input mag-input-mono mag-input-xs flex-1"
                :placeholder="t('tools.api.labels.valuePlaceholder')"
              />
              <button class="text-slate-400 hover:text-red-500" @click="removeRow('form', i)">✕</button>
            </div>
            <button class="text-xs text-primary hover:underline" @click="addRow('form')">
              + {{ t('tools.api.actions.addRow') }}
            </button>
          </div>

          <div v-else class="py-8 text-center text-sm text-slate-400">
            {{ t('tools.api.messages.noBody') }}
          </div>
        </div>

        <!-- cURL 预览 -->
        <div v-if="showCurl" class="mag-card sticky bottom-4 z-10">
          <div class="mb-2 flex items-center justify-between">
            <label class="mag-label-inline">cURL</label>
            <button
              class="mag-btn-primary mag-btn-sm"
              @click="copyCurl"
            >
              {{ t('tools.api.actions.copyCurl') }}
            </button>
          </div>
          <pre class="mag-mono overflow-auto rounded bg-slate-50 p-2 text-xs dark:bg-slate-800/60">{{ curlCommand }}</pre>
        </div>
      </div>
    </template>

    <template #output>
      <div class="space-y-3">
        <div v-if="!response && !loading" class="py-12 text-center text-sm text-slate-400">
          {{ t('tools.api.messages.noResponse') }}
        </div>

        <div v-if="loading" class="py-12 text-center text-sm text-slate-400">
          {{ t('tools.api.messages.loading') }}
        </div>

        <div v-if="response" class="space-y-3">
          <!-- 状态行 -->
          <div class="flex flex-wrap items-center gap-3">
            <span
              class="rounded-md px-2.5 py-1 text-sm font-bold"
              :class="statusClass"
            >
              {{ response.status || 'ERR' }}
              <span v-if="response.statusText" class="ml-1 text-xs font-normal opacity-70">{{ response.statusText }}</span>
            </span>
            <span class="text-xs text-slate-500 dark:text-slate-400">
              {{ t('tools.api.labels.duration') }}: <span class="mag-mono">{{ formatDuration(response.duration) }}</span>
            </span>
            <span class="text-xs text-slate-500 dark:text-slate-400">
              {{ t('tools.api.labels.size') }}: <span class="mag-mono">{{ formatSize(response.size) }}</span>
            </span>
            <label class="ml-auto flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <input v-model="autoFormatJson" type="checkbox" class="rounded" />
              {{ t('tools.api.labels.autoFormat') }}
            </label>
            <button class="text-xs text-slate-400 hover:text-red-500" @click="handleClear">✕</button>
          </div>

          <!-- CORS / 错误提示 -->
          <div v-if="response.errorType === 'cors'" class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
            <p class="font-medium">{{ t('tools.api.messages.corsTitle') }}</p>
            <p class="mt-1 opacity-90">{{ t('tools.api.messages.corsHint') }}</p>
            <p v-if="response.error" class="mt-1 font-mono opacity-80">{{ response.error }}</p>
          </div>

          <div v-else-if="response.errorType" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-300">
            <p class="font-mono">{{ response.error }}</p>
          </div>

          <!-- 响应头 -->
          <details class="rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <summary class="cursor-pointer px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              {{ t('tools.api.labels.responseHeaders') }} ({{ Object.keys(response.headers).length }})
            </summary>
            <div class="border-t border-slate-100 p-2 dark:border-slate-700/40">
              <div
                v-for="(value, key) in response.headers"
                :key="key"
                class="flex gap-2 px-2 py-1 font-mono text-xs"
              >
                <span class="text-primary">{{ key }}:</span>
                <span class="text-slate-600 dark:text-slate-300 break-all">{{ value }}</span>
              </div>
            </div>
          </details>

          <!-- 响应体 -->
          <div>
            <label class="mag-label">{{ t('tools.api.labels.responseBody') }}</label>
            <MonacoEditor
              :model-value="displayBody"
              :language="bodyLanguage"
              :read-only="true"
              :height="320"
            />
          </div>
        </div>
      </div>
    </template>

    <template #history>
      <HistoryList
        tool="api"
        @select="(item) => { url = item.input.split(' ').slice(1).join(' '); method = item.input.split(' ')[0] as HttpMethod }"
      />
    </template>
  </ToolCard>
</template>

