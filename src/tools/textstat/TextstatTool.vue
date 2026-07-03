<!--
  TextstatTool 文本统计分析工具
  用于实时统计文本各项指标的开发者工具。
  - 统计字符数、词数、行数、句子数、段落数等核心指标
  - 估算阅读时长，辅助写作与排版评估
  - 输入防抖处理，保证大文本下的流畅体验
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useDebounce } from '@/composables/useDebounce'
import { analyzeText, type TextStats } from './textstatUtils'

defineOptions({ name: 'TextstatTool' })

const { t, locale } = useI18n()

const input = ref(t('tools.textstat.labels.defaultSample'))

watch(locale, () => {
  input.value = t('tools.textstat.labels.defaultSample')
})

const debouncedInput = useDebounce(input, 200)
const stats = computed<TextStats>(() => analyzeText(debouncedInput.value ?? ''))

const cards: { key: keyof TextStats; labelKey: string }[] = [
  { key: 'characters', labelKey: 'tools.textstat.labels.chars' },
  { key: 'charactersNoSpaces', labelKey: 'tools.textstat.labels.charsNoSpaces' },
  { key: 'words', labelKey: 'tools.textstat.labels.words' },
  { key: 'lines', labelKey: 'tools.textstat.labels.lines' },
  { key: 'sentences', labelKey: 'tools.textstat.labels.sentences' },
  { key: 'paragraphs', labelKey: 'tools.textstat.labels.paragraphs' },
  { key: 'readingTimeMin', labelKey: 'tools.textstat.labels.readingTime' },
]
</script>

<template>
  <ToolCard
    :title="t('tools.textstat.title')"
    :description="t('tools.textstat.description')"
    tool-id="textstat"
    layout="split"
  >
    <template #input>
      <div>
        <label class="mag-label">{{ t('tools.textstat.labels.input') }}</label>
        <textarea
          v-model="input"
          class="mag-textarea"
          :placeholder="t('tools.textstat.messages.empty')"
        />
      </div>
    </template>

    <template #output>
      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div
          v-for="card in cards"
          :key="card.key"
          class="mag-cell text-center"
        >
          <div class="mag-mono-lg">{{ stats[card.key] }}</div>
          <div class="mag-cell-label mt-2">{{ t(card.labelKey) }}</div>
        </div>
      </div>
    </template>

    <template #history>
      <HistoryList tool="textstat" @select="(item) => { input = item.input }" />
    </template>
  </ToolCard>
</template>

