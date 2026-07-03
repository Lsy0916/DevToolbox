<!--
  Json2tsTool JSON 转 TypeScript 工具
  用于将 JSON 数据自动转换为 TypeScript 类型定义的工具。
  - 支持自定义根类型名称、可选字段、联合类型等选项
  - 输入防抖实时生成，错误时给出明确提示
  - 基于 Monaco 编辑器提供输入与输出的双栏编辑体验
-->
<script setup lang="ts">
import { ref, computed, defineAsyncComponent, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import ActionButtons from '@/components/ActionButtons.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import { useDebounce } from '@/composables/useDebounce'
import { json2ts, type Json2tsOptions } from './json2tsUtils'

defineOptions({ name: 'Json2tsTool' })

const { t } = useI18n()
const { showSuccess } = useNotification()
const { saveHistory } = useHistory('json2ts')

const MonacoEditor = defineAsyncComponent(() => import('@/components/MonacoEditor.vue'))

const input = ref(`{
  "name": "John",
  "age": 30,
  "isActive": true,
  "address": {
    "city": "Beijing",
    "zip": "100000"
  },
  "tags": ["dev", "admin"],
  "metadata": null
}`)

const rootName = ref('Root')
const optionalFields = ref(true)
const unionTypes = ref(true)
const exportKeyword = ref(true)

const output = ref('')
const error = ref('')

const debouncedInput = useDebounce(input, 300)

const options = computed<Json2tsOptions>(() => ({
  rootName: rootName.value || 'Root',
  optionalFields: optionalFields.value,
  unionTypes: unionTypes.value,
  singularArrayItems: true,
  exportKeyword: exportKeyword.value,
}))

function generate(): void {
  if (!input.value.trim()) {
    output.value = ''
    error.value = ''
    return
  }
  try {
    output.value = json2ts(input.value, options.value)
    error.value = ''
  } catch (e) {
    output.value = ''
    error.value = e instanceof Error ? e.message : 'Failed to generate'
  }
}

watch(debouncedInput, () => generate())
watch([rootName, optionalFields, unionTypes, exportKeyword], () => generate())

// 初始生成
generate()

function handleSave(): void {
  generate()
  if (!output.value) return
  void saveHistory(input.value, output.value)
  showSuccess(t('tools.json2ts.messages.saved'))
}

function handleClear(): void {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <ToolCard
    :title="t('tools.json2ts.title')"
    :description="t('tools.json2ts.description')"
    tool-id="json2ts"
    layout="split"
  >
    <template #actions>
      <button
        class="mag-btn-primary"
        @click="handleSave"
      >
        {{ t('tools.json2ts.actions.save') }}
      </button>
    </template>

    <template #input>
      <div class="space-y-3">
        <div>
          <label class="mag-label">{{ t('tools.json2ts.labels.input') }}</label>
          <MonacoEditor v-model="input" language="json" :height="260" />
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="mag-label-sm">{{ t('tools.json2ts.labels.rootName') }}</label>
            <input
              v-model="rootName"
              type="text"
              class="mag-input mag-input-mono text-xs px-2 py-1.5"
              placeholder="Root"
            />
          </div>
          <label class="flex items-end gap-1.5 pb-1.5 text-xs text-slate-600 dark:text-slate-300">
            <input v-model="optionalFields" type="checkbox" class="rounded mb-0.5" />
            {{ t('tools.json2ts.labels.optionalFields') }}
          </label>
          <label class="flex items-end gap-1.5 pb-1.5 text-xs text-slate-600 dark:text-slate-300">
            <input v-model="unionTypes" type="checkbox" class="rounded mb-0.5" />
            {{ t('tools.json2ts.labels.unionTypes') }}
          </label>
          <label class="flex items-end gap-1.5 pb-1.5 text-xs text-slate-600 dark:text-slate-300">
            <input v-model="exportKeyword" type="checkbox" class="rounded mb-0.5" />
            {{ t('tools.json2ts.labels.exportKeyword') }}
          </label>
        </div>
      </div>
    </template>

    <template #output>
      <div class="mb-2 flex items-center justify-between">
        <label class="mag-label-inline">{{ t('tools.json2ts.labels.output') }}</label>
        <ActionButtons :text="output" :show-save="false" file-prefix="typescript" extension="ts" :available-extensions="['ts', 'txt']" @clear="handleClear" />
      </div>

      <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-300">
        <p class="font-mono">{{ error }}</p>
      </div>

      <MonacoEditor
        v-else
        :model-value="output"
        language="typescript"
        :read-only="true"
        :height="280"
      />
    </template>

    <template #history>
      <HistoryList tool="json2ts" @select="(item) => { input = item.input; generate() }" />
    </template>
  </ToolCard>
</template>
