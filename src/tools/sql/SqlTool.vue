<!--
  SqlTool SQL 工具
  用于格式化、压缩和校验 SQL 语句的开发者工具。
  - 支持多种 SQL 方言（MySQL、PostgreSQL 等）及关键字大小写设置
  - 基于 Monaco 编辑器提供代码高亮编辑体验
  - 提供历史记录与一键复制功能
-->
<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import ActionButtons from '@/components/ActionButtons.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import { formatSql, minifySql, validateSql, SQL_DIALECTS, type SqlFormatOptions } from './sqlUtils'
import type { KeywordCase } from 'sql-formatter'

defineOptions({ name: 'SqlTool' })

const { t } = useI18n()
const { showSuccess, showError } = useNotification()
const { saveHistory } = useHistory('sql')

const MonacoEditor = defineAsyncComponent(() => import('@/components/MonacoEditor.vue'))

const input = ref('select id,name,email from users where age>18 and status="active" order by id desc limit 10;')
const output = ref('')
const error = ref('')

const language = ref<SqlFormatOptions['language']>('mysql')
const keywordCase = ref<KeywordCase>('upper')
const tabWidth = ref(2)
const useTabs = ref(false)

const options = computed<SqlFormatOptions>(() => ({
  language: language.value,
  keywordCase: keywordCase.value,
  tabWidth: tabWidth.value,
  useTabs: useTabs.value,
}))

function handleFormat(): void {
  if (!input.value.trim()) {
    showError(t('tools.sql.messages.empty'))
    return
  }
  try {
    output.value = formatSql(input.value, options.value)
    error.value = ''
    showSuccess(t('tools.sql.messages.formatted'))
    void saveHistory(input.value, output.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Format failed'
    output.value = ''
    showError(t('tools.sql.messages.invalid'))
  }
}

function handleMinify(): void {
  if (!input.value.trim()) {
    showError(t('tools.sql.messages.empty'))
    return
  }
  output.value = minifySql(input.value)
  error.value = ''
  showSuccess(t('tools.sql.messages.minified'))
  void saveHistory(input.value.slice(0, 100), output.value.slice(0, 100))
}

function handleValidate(): void {
  if (!input.value.trim()) {
    showError(t('tools.sql.messages.empty'))
    return
  }
  const r = validateSql(input.value, options.value)
  if (r.ok) {
    showSuccess(t('tools.sql.messages.valid'))
    error.value = ''
  } else {
    error.value = r.error ?? 'Invalid'
    showError(t('tools.sql.messages.invalid'))
  }
}

function handleClear(): void {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <ToolCard
    :title="t('tools.sql.title')"
    :description="t('tools.sql.description')"
    tool-id="sql"
    layout="split"
  >
    <template #actions>
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <label class="mag-label-inline !mb-0">{{ t('tools.sql.labels.dialect') }}</label>
          <select
            v-model="language"
            class="mag-input w-auto"
          >
            <option v-for="d in SQL_DIALECTS" :key="d.value" :value="d.value">{{ t(d.labelKey) }}</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="mag-label-inline !mb-0">{{ t('tools.sql.labels.keywordCase') }}</label>
          <select
            v-model="keywordCase"
            class="mag-input w-auto"
          >
            <option value="upper">UPPER</option>
            <option value="lower">lower</option>
            <option value="preserve">preserve</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="mag-label-inline !mb-0">{{ t('tools.sql.labels.indent') }}</label>
          <select
            v-model.number="tabWidth"
            class="mag-input w-auto"
          >
            <option :value="2">2</option>
            <option :value="4">4</option>
          </select>
        </div>
        <label class="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
          <input v-model="useTabs" type="checkbox" class="rounded" />
          Tab
        </label>
        <button class="mag-btn-primary" @click="handleFormat">{{ t('tools.sql.actions.format') }}</button>
        <button class="mag-btn" @click="handleMinify">{{ t('tools.sql.actions.minify') }}</button>
        <button class="mag-btn" @click="handleValidate">{{ t('tools.sql.actions.validate') }}</button>
      </div>
    </template>

    <template #input>
      <div>
        <label class="mag-label">{{ t('tools.sql.labels.input') }}</label>
        <MonacoEditor v-model="input" language="plaintext" :height="260" />
      </div>
    </template>

    <template #output>
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="mag-label-inline">{{ t('tools.sql.labels.output') }}</label>
          <ActionButtons :text="output" :show-save="false" file-prefix="sql" extension="sql" :available-extensions="['sql', 'txt']" @clear="handleClear" />
        </div>
        <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-300">
          <p class="font-mono">{{ error }}</p>
        </div>
        <MonacoEditor
          v-else
          :model-value="output"
          language="plaintext"
          :read-only="true"
          :height="280"
        />
      </div>
    </template>

    <template #history>
      <HistoryList tool="sql" @select="(item) => { input = item.input; handleFormat() }" />
    </template>
  </ToolCard>
</template>

