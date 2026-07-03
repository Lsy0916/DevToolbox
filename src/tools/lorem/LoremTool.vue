<!--
  LoremTool Lorem 文本生成工具
  用于生成占位用的 Lorem ipsum 假文本的工具。
  - 可按段落、句子、单词三种单位批量生成
  - 支持自定义生成数量及是否以经典开头
  - 基于 Monaco 编辑器展示结果，便于复制使用
-->
<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import ActionButtons from '@/components/ActionButtons.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import { generateLorem, type LoremUnit } from './loremUtils'

defineOptions({ name: 'LoremTool' })

const { t } = useI18n()
const { showSuccess } = useNotification()
const { saveHistory } = useHistory('lorem')

const MonacoEditor = defineAsyncComponent(() => import('@/components/MonacoEditor.vue'))

const unit = ref<LoremUnit>('paragraph')
const count = ref(3)
const startWithClassic = ref(true)
const output = ref('')

const units: { value: LoremUnit; labelKey: string }[] = [
  { value: 'paragraph', labelKey: 'tools.lorem.labels.paragraph' },
  { value: 'sentence', labelKey: 'tools.lorem.labels.sentence' },
  { value: 'word', labelKey: 'tools.lorem.labels.word' },
]

function handleGenerate(): void {
  output.value = generateLorem(unit.value, count.value, startWithClassic.value)
  showSuccess(t('tools.lorem.messages.generated', { n: count.value }))
  void saveHistory(`${unit.value} x${count.value}`, output.value.slice(0, 100))
}

function handleClear(): void {
  output.value = ''
}

handleGenerate()
</script>

<template>
  <ToolCard
    :title="t('tools.lorem.title')"
    :description="t('tools.lorem.description')"
    tool-id="lorem"
    layout="wide"
  >
    <template #actions>
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <label class="mag-label-inline">{{ t('tools.lorem.labels.unit') }}</label>
          <select
            v-model="unit"
            class="mag-input w-auto"
          >
            <option v-for="u in units" :key="u.value" :value="u.value">{{ t(u.labelKey) }}</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="mag-label-inline">{{ t('tools.lorem.labels.count') }}</label>
          <input
            v-model.number="count"
            type="number"
            min="1"
            max="100"
            class="mag-input w-20"
          />
        </div>
        <label class="mag-label-inline flex items-center gap-1.5">
          <input v-model="startWithClassic" type="checkbox" class="rounded" />
          {{ t('tools.lorem.labels.startClassic') }}
        </label>
        <button class="mag-btn-primary" @click="handleGenerate">{{ t('tools.lorem.actions.generate') }}</button>
      </div>
    </template>

    <template #output>
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="mag-label-inline">{{ t('tools.lorem.labels.output') }}</label>
          <ActionButtons :text="output" :show-save="false" @clear="handleClear" />
        </div>
        <MonacoEditor
          :model-value="output"
          language="plaintext"
          :read-only="true"
          :height="300"
        />
      </div>
    </template>

    <template #history>
      <HistoryList tool="lorem" @select="() => {}" />
    </template>
  </ToolCard>
</template>

