<!--
  MarkdownTool Markdown 工具
  用于将 Markdown 文本渲染为 HTML 并实时预览的工具。
  - 支持预览与 HTML 源码两种视图模式切换
  - 实时统计字数，可一键复制渲染后的 HTML
  - 基于 Monaco 编辑器进行 Markdown 输入编辑
-->
<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import ActionButtons from '@/components/ActionButtons.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import { useClipboard } from '@/composables/useClipboard'
import { renderMarkdown, countWords } from './markdownUtils'

defineOptions({ name: 'MarkdownTool' })

const { t, locale } = useI18n()
const { showSuccess } = useNotification()
const { copy } = useClipboard()
const { saveHistory } = useHistory('markdown')

const MonacoEditor = defineAsyncComponent(() => import('@/components/MonacoEditor.vue'))

const input = ref(t('tools.markdown.labels.defaultSample'))

watch(locale, () => {
  input.value = t('tools.markdown.labels.defaultSample')
})
const viewMode = ref<'preview' | 'source'>('preview')

const html = computed(() => renderMarkdown(input.value))
const wordCount = computed(() => countWords(input.value))

async function copyHtml(): Promise<void> {
  if (!html.value) return
  const ok = await copy(html.value)
  if (ok) showSuccess(t('tools.markdown.messages.copied'))
}

function handleSave(): void {
  if (!input.value) return
  void saveHistory(input.value.slice(0, 100), html.value.slice(0, 100))
  showSuccess(t('tools.markdown.messages.rendered'))
}

function handleClear(): void {
  input.value = ''
}
</script>

<template>
  <ToolCard
    :title="t('tools.markdown.title')"
    :description="t('tools.markdown.description')"
    tool-id="markdown"
    layout="split"
  >
    <template #actions>
      <div class="flex flex-wrap items-center gap-3">
        <div class="mag-tab-group">
          <button
            class="mag-tab"
            :class="viewMode === 'preview' ? 'mag-tab-active' : ''"
            @click="viewMode = 'preview'"
          >
            {{ t('tools.markdown.labels.preview') }}
          </button>
          <button
            class="mag-tab"
            :class="viewMode === 'source' ? 'mag-tab-active' : ''"
            @click="viewMode = 'source'"
          >
            {{ t('tools.markdown.labels.htmlSource') }}
          </button>
        </div>
        <button class="mag-btn" @click="copyHtml">{{ t('tools.markdown.actions.copyHtml') }}</button>
        <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('tools.markdown.labels.wordCount') }}: {{ wordCount }}</span>
      </div>
    </template>

    <template #input>
      <div>
        <label class="mag-label">{{ t('tools.markdown.labels.input') }}</label>
        <MonacoEditor v-model="input" language="plaintext" :height="240" />
      </div>
    </template>

    <template #output>
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="mag-label-inline">
            {{ viewMode === 'preview' ? t('tools.markdown.labels.preview') : t('tools.markdown.labels.htmlSource') }}
          </label>
          <ActionButtons :text="html" :show-save="true" file-prefix="markdown" extension="html" :available-extensions="['md', 'html', 'txt']" @save="handleSave" @clear="handleClear" />
        </div>
        <div class="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
          ⚠ {{ t('tools.markdown.messages.trustedOnly') }}
        </div>
        <div v-if="viewMode === 'preview'" class="md-preview mag-card min-h-[240px] overflow-auto" v-html="html || `<p class='text-slate-400 text-sm'>${t('tools.markdown.messages.empty')}</p>`" />
        <pre v-else class="mag-cell overflow-auto font-mono !text-xs">{{ html }}</pre>
      </div>
    </template>

    <template #history>
      <HistoryList tool="markdown" @select="(item) => { input = item.input }" />
    </template>
  </ToolCard>
</template>

<style scoped>
/* 杂志风格工具类已全局定义于 src/styles/index.css */
.md-preview :deep(h1) { @apply text-2xl font-bold mt-4 mb-2; }
.md-preview :deep(h2) { @apply text-xl font-bold mt-4 mb-2; }
.md-preview :deep(h3) { @apply text-lg font-semibold mt-3 mb-2; }
.md-preview :deep(p) { @apply my-2 leading-relaxed; }
.md-preview :deep(ul) { @apply list-disc pl-6 my-2; }
.md-preview :deep(ol) { @apply list-decimal pl-6 my-2; }
.md-preview :deep(li) { @apply my-1; }
.md-preview :deep(blockquote) { @apply border-l-4 border-slate-300 pl-4 italic text-slate-600 my-2 dark:border-slate-600 dark:text-slate-400; }
.md-preview :deep(code) { @apply bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-primary dark:bg-slate-800; }
.md-preview :deep(pre) { @apply bg-slate-100 p-3 rounded-lg overflow-auto my-2 dark:bg-slate-800; }
.md-preview :deep(pre code) { @apply bg-transparent p-0; }
.md-preview :deep(a) { @apply text-primary underline; }
.md-preview :deep(table) { @apply border-collapse my-2; }
.md-preview :deep(th), .md-preview :deep(td) { @apply border border-slate-300 px-3 py-1.5 dark:border-slate-600; }
.md-preview :deep(hr) { @apply my-4 border-slate-300 dark:border-slate-600; }
</style>
