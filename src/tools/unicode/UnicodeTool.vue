<!--
  UnicodeTool Unicode 字符分析工具
  用于逐字符分析输入文本的 Unicode 编码信息。
  - 展示每个字符的码点、UTF-8、UTF-16 编码及字符类别
  - 输入防抖处理，支持大段文本实时分析
  - 以表格形式直观呈现，可一键复制全部结果
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import ActionButtons from '@/components/ActionButtons.vue'
import { useDebounce } from '@/composables/useDebounce'
import { analyzeChars, formatCodePoint, formatBytes } from './unicodeUtils'

defineOptions({ name: 'UnicodeTool' })

const { t } = useI18n()

const input = ref('A中🎉')
const debouncedInput = useDebounce(input, 150)
const chars = computed(() => analyzeChars(debouncedInput.value ?? ''))

const tableText = computed(() => {
  return chars.value
    .map((c) => `${c.char}\t${formatCodePoint(c.codePoint)}\t${formatBytes(c.utf8)}\t${c.utf16.map((u) => u.toString(16).toUpperCase()).join(' ')}\t${c.category}`)
    .join('\n')
})
</script>

<template>
  <ToolCard
    :title="t('tools.unicode.title')"
    :description="t('tools.unicode.description')"
    tool-id="unicode"
    layout="wide"
  >
    <template #actions>
      <ActionButtons :text="tableText" :show-save="false" :show-export="false" @clear="() => { input = '' }" />
    </template>

    <template #input>
      <div class="space-y-2">
        <label class="mag-label">{{ t('tools.unicode.labels.input') }}</label>
        <textarea
          v-model="input"
          class="mag-textarea mag-input-mono h-32"
          :placeholder="t('tools.unicode.messages.empty')"
        />
      </div>
    </template>

    <template #output>
      <div class="space-y-2">
        <div class="mb-2 flex items-center justify-between">
          <label class="mag-label-inline">
            {{ t('tools.unicode.labels.analysis') }}
            <span v-if="chars.length" class="ml-1 text-slate-400">({{ chars.length }})</span>
          </label>
        </div>
        <div v-if="chars.length" class="mag-card overflow-auto p-0" style="max-height: 384px">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-slate-50/80 backdrop-blur text-xs uppercase text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
              <tr>
                <th class="px-3 py-2 text-left">{{ t('tools.unicode.labels.char') }}</th>
                <th class="px-3 py-2 text-left">{{ t('tools.unicode.labels.codePoint') }}</th>
                <th class="px-3 py-2 text-left">{{ t('tools.unicode.labels.utf8') }}</th>
                <th class="px-3 py-2 text-left">{{ t('tools.unicode.labels.utf16') }}</th>
                <th class="px-3 py-2 text-left">{{ t('tools.unicode.labels.category') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700/40">
              <tr v-for="(c, i) in chars" :key="i" class="text-slate-600 dark:text-slate-300">
                <td class="px-3 py-2 text-base font-medium text-slate-800 dark:text-slate-100">{{ c.char === ' ' ? '␣' : c.char }}</td>
                <td class="px-3 py-2 font-mono text-primary">{{ formatCodePoint(c.codePoint) }}</td>
                <td class="px-3 py-2 font-mono text-xs">{{ formatBytes(c.utf8) }}</td>
                <td class="px-3 py-2 font-mono text-xs">{{ c.utf16.map((u) => u.toString(16).toUpperCase().padStart(4, '0')).join(' ') }}</td>
                <td class="px-3 py-2 text-xs">{{ t(`tools.unicode.categories.${c.category}`) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="py-8 text-center text-sm font-light text-slate-400">
          {{ t('tools.unicode.messages.empty') }}
        </div>
      </div>
    </template>
  </ToolCard>
</template>

