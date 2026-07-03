<!--
  JsonTool
  JSON 处理工具组件，提供常用的 JSON 数据转换能力。
  - 支持格式化、压缩、校验、转义/反转义及 YAML 互转
  - 提供键排序、移除空字段和 JSONPath 查询功能
  - 输入实时校验并显示行号错误信息
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import ActionButtons from '@/components/ActionButtons.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import { useDebounce } from '@/composables/useDebounce'
import {
  formatJson,
  minifyJson,
  validateJson,
  escapeJson,
  unescapeJson,
  jsonToYaml,
  yamlToJson,
  sortKeys,
  removeEmptyFields,
  queryJsonPath,
} from './jsonUtils'
import type { ValidationResult } from '@/types'

defineOptions({ name: 'JsonTool' })

const { t } = useI18n()

const MonacoEditor = defineAsyncComponent(() => import('@/components/MonacoEditor.vue'))

const input = ref('{\n  "name": "DevToolbox",\n  "tools": 10,\n  "local": true\n}')
const output = ref('')
const validation = ref<ValidationResult>({ ok: true })
const queryPath = ref('$.name')

const { saveHistory } = useHistory('json')
const { showSuccess, showError } = useNotification()

const debouncedInput = useDebounce(input, 300)

watch(debouncedInput, (val) => {
  if (val === undefined) return
  if (!val.trim()) {
    validation.value = { ok: true }
    return
  }
  validation.value = validateJson(val)
})

function handleFormat(): void {
  try {
    output.value = formatJson(input.value)
    void saveHistory(input.value, output.value)
    showSuccess(t('tools.json.messages.formatted'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.json.messages.invalid'))
  }
}

function handleMinify(): void {
  try {
    output.value = minifyJson(input.value)
    void saveHistory(input.value, output.value)
    showSuccess(t('tools.json.messages.minified'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.json.messages.invalid'))
  }
}

function handleValidate(): void {
  const result = validateJson(input.value)
  validation.value = result
  if (result.ok) {
    showSuccess(t('tools.json.messages.valid'))
  } else {
    showError(result.error ?? t('tools.json.messages.invalid'))
  }
}

function handleEscape(): void {
  output.value = escapeJson(input.value)
  void saveHistory(input.value, output.value)
  showSuccess(t('tools.json.messages.escaped'))
}

function handleUnescape(): void {
  try {
    output.value = unescapeJson(input.value)
    void saveHistory(input.value, output.value)
    showSuccess(t('tools.json.messages.unescaped'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.json.messages.invalid'))
  }
}

function handleToYaml(): void {
  try {
    output.value = jsonToYaml(input.value)
    void saveHistory(input.value, output.value)
    showSuccess(t('tools.json.messages.yamlConverted'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.json.messages.yamlError'))
  }
}

function handleFromYaml(): void {
  try {
    output.value = yamlToJson(input.value)
    void saveHistory(input.value, output.value)
    showSuccess(t('tools.json.messages.yamlConverted'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.json.messages.yamlError'))
  }
}

function handleSortKeys(): void {
  try {
    output.value = sortKeys(input.value)
    void saveHistory(input.value, output.value)
    showSuccess(t('tools.json.messages.sorted'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.json.messages.invalid'))
  }
}

function handleTrimEmpty(): void {
  try {
    output.value = removeEmptyFields(input.value)
    void saveHistory(input.value, output.value)
    showSuccess(t('tools.json.messages.trimmed'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.json.messages.invalid'))
  }
}

function handleQuery(): void {
  try {
    output.value = queryJsonPath(input.value, queryPath.value)
    void saveHistory(input.value, output.value)
    showSuccess(t('tools.json.messages.queryResult'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.json.messages.queryError'))
  }
}

function handleClear(): void {
  input.value = ''
  output.value = ''
  validation.value = { ok: true }
}
</script>

<template>
  <ToolCard
    :title="t('tools.json.title')"
    :description="t('tools.json.description')"
    tool-id="json"
    layout="split"
  >
    <template #actions>
      <div class="w-full space-y-2">
        <div class="flex flex-wrap items-center justify-end gap-2">
          <button class="mag-btn-primary" @click="handleFormat">{{ t('tools.json.actions.format') }}</button>
          <button class="mag-btn" @click="handleMinify">{{ t('tools.json.actions.minify') }}</button>
          <button class="mag-btn" @click="handleValidate">{{ t('tools.json.actions.validate') }}</button>
          <button class="mag-btn" @click="handleEscape">{{ t('tools.json.actions.escape') }}</button>
          <button class="mag-btn" @click="handleUnescape">{{ t('tools.json.actions.unescape') }}</button>
          <button class="mag-btn" @click="handleToYaml">{{ t('tools.json.actions.toYaml') }}</button>
          <button class="mag-btn" @click="handleFromYaml">{{ t('tools.json.actions.fromYaml') }}</button>
          <button class="mag-btn" @click="handleSortKeys">{{ t('tools.json.actions.sortKeys') }}</button>
          <button class="mag-btn" @click="handleTrimEmpty">{{ t('tools.json.actions.trimEmpty') }}</button>
        </div>
        <!-- JSONPath 查询 -->
        <div class="flex flex-wrap items-center gap-2">
          <input
            v-model="queryPath"
            type="text"
            class="mag-input mag-input-mono flex-1 min-w-[200px]"
            :placeholder="t('tools.json.labels.queryPath')"
            @keydown.enter="handleQuery"
          />
          <button class="mag-btn-primary" @click="handleQuery">{{ t('tools.json.actions.query') }}</button>
        </div>
      </div>
    </template>

    <template #input>
      <div class="mb-2 flex items-center justify-between">
        <label class="mag-label-inline">{{ t('tools.json.labels.input') }}</label>
        <span
          v-if="input.trim()"
          class="text-xs"
          :class="validation.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
        >
          {{ validation.ok ? '✓ ' + t('tools.json.messages.valid') : `✕ ${validation.error}${validation.line ? ` (line ${validation.line}, col ${validation.column})` : ''}` }}
        </span>
      </div>
      <MonacoEditor v-model="input" language="json" :height="280" />
    </template>

    <template #output>
      <div class="mb-2 flex items-center justify-between">
        <label class="mag-label-inline">{{ t('tools.json.labels.output') }}</label>
        <ActionButtons :text="output" file-prefix="json" extension="json" :available-extensions="['json', 'js', 'txt']" @clear="handleClear" />
      </div>
      <MonacoEditor v-model="output" language="json" read-only :height="280" />
    </template>

    <template #history>
      <HistoryList tool="json" @select="(item) => { input = item.input; output = item.output }" />
    </template>
  </ToolCard>
</template>

