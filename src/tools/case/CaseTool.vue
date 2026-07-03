<!--
  CaseTool 命名大小写转换工具
  用于在多种命名风格之间转换文本的工具。
  - 支持 camel、snake、kebab、pascal 等多种命名模式
  - 实时输出转换结果，可一键复制或保存到历史
  - 适配中英文界面，操作简单直观
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import ActionButtons from '@/components/ActionButtons.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import { convertCase, CASE_MODES, type CaseMode } from './caseUtils'

defineOptions({ name: 'CaseTool' })

const { t } = useI18n()
const { showSuccess } = useNotification()
const { saveHistory } = useHistory('case')

const input = ref('Hello World - fooBar baz')
const mode = ref<CaseMode>('camel')

const output = computed(() => convertCase(input.value, mode.value))

function selectMode(m: CaseMode): void {
  mode.value = m
}

function handleSave(): void {
  if (!output.value) return
  void saveHistory(input.value, output.value)
  showSuccess(t('tools.case.messages.converted'))
}

function handleClear(): void {
  input.value = ''
}
</script>

<template>
  <ToolCard
    :title="t('tools.case.title')"
    :description="t('tools.case.description')"
    tool-id="case"
    layout="split"
  >
    <template #actions>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="m in CASE_MODES"
          :key="m.value"
          :class="mode === m.value ? 'mag-btn-primary' : 'mag-btn'"
          @click="selectMode(m.value)"
        >
          {{ t(m.labelKey) }}
        </button>
      </div>
    </template>

    <template #input>
      <div>
        <label class="mag-label">{{ t('tools.case.labels.input') }}</label>
        <textarea
          v-model="input"
          class="mag-textarea"
          :placeholder="t('tools.case.messages.empty')"
        />
      </div>
    </template>

    <template #output>
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="mag-label-inline">{{ t('tools.case.labels.output') }}</label>
          <ActionButtons :text="output" :show-save="true" @save="handleSave" @clear="handleClear" />
        </div>
        <pre class="mag-cell mag-mono min-h-[80px] overflow-auto whitespace-pre-wrap">{{ output || t('tools.case.messages.empty') }}</pre>
      </div>
    </template>

    <template #history>
      <HistoryList tool="case" @select="(item) => { input = item.input }" />
    </template>
  </ToolCard>
</template>

