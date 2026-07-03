<!--
  HtmlTool
  HTML 实体编解码工具组件，处理 HTML 与实体字符互转。
  - 支持编码、解码、清除标签和完整实体编码
  - 实时统计输入中的实体数量
  - 提供常用 HTML 实体对照表（命名/十进制/十六进制）
-->
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import ActionButtons from '@/components/ActionButtons.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import { useDebounce } from '@/composables/useDebounce'
import {
  encodeHtml,
  decodeHtml,
  stripHtmlTags,
  encodeFullEntities,
  countEntities,
  HTML_ENTITIES,
} from './htmlUtils'

defineOptions({ name: 'HtmlTool' })

const { t } = useI18n()
const { showSuccess, showError } = useNotification()

const input = ref('<div class="hello">Hello & Welcome</div>')
const output = ref('')
const mode = ref<'encode' | 'decode'>('encode')

const { saveHistory } = useHistory('html')

const debouncedInput = useDebounce(input, 300)

const entityCount = computed(() => countEntities(input.value))

watch(debouncedInput, (val) => {
  if (val === undefined) return
  if (!val) {
    output.value = ''
    return
  }
  try {
    output.value = mode.value === 'encode' ? encodeHtml(val) : decodeHtml(val)
  } catch {
    // ignore
  }
})

watch(mode, () => {
  if (input.value) {
    try {
      output.value = mode.value === 'encode' ? encodeHtml(input.value) : decodeHtml(input.value)
    } catch {
      // ignore
    }
  }
})

function handleEncode(): void {
  mode.value = 'encode'
  try {
    output.value = encodeHtml(input.value)
    void saveHistory(input.value, output.value)
    showSuccess(t('tools.html.messages.encoded'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.html.messages.invalid'))
  }
}

function handleDecode(): void {
  mode.value = 'decode'
  try {
    output.value = decodeHtml(input.value)
    void saveHistory(input.value, output.value)
    showSuccess(t('tools.html.messages.decoded'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.html.messages.invalid'))
  }
}

function handleStripTags(): void {
  try {
    output.value = stripHtmlTags(input.value)
    void saveHistory(input.value, output.value)
    showSuccess(t('tools.html.messages.stripped'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.html.messages.invalid'))
  }
}

function handleEncodeFull(): void {
  try {
    output.value = encodeFullEntities(input.value)
    void saveHistory(input.value, output.value)
    showSuccess(t('tools.html.messages.encodedFull'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.html.messages.invalid'))
  }
}

function handleClear(): void {
  input.value = ''
  output.value = ''
}
</script>

<template>
  <ToolCard
    :title="t('tools.html.title')"
    :description="t('tools.html.description')"
    tool-id="html"
    layout="split"
  >
    <template #actions>
      <div class="flex flex-wrap items-center gap-2">
        <button class="mag-btn-primary" @click="handleEncode">{{ t('tools.html.actions.encode') }}</button>
        <button class="mag-btn" @click="handleDecode">{{ t('tools.html.actions.decode') }}</button>
        <button class="mag-btn" @click="handleStripTags">{{ t('tools.html.actions.stripTags') }}</button>
        <button class="mag-btn" @click="handleEncodeFull">{{ t('tools.html.actions.encodeFull') }}</button>
      </div>
    </template>

    <template #input>
      <div class="mb-2 flex items-center justify-between">
        <label class="mag-label-inline">{{ t('tools.html.labels.input') }}</label>
        <span class="text-xs text-slate-400">
          {{ t('tools.html.labels.entityCount') }}: <span class="font-mono text-slate-600 dark:text-slate-300">{{ entityCount }}</span>
        </span>
      </div>
      <textarea
        v-model="input"
        class="mag-textarea mag-input-mono h-40"
        placeholder="Enter HTML or encoded text..."
        aria-label="HTML input"
      />
    </template>

    <template #output>
      <div class="mb-2 flex items-center justify-between">
        <label class="mag-label-inline">{{ t('tools.html.labels.output') }}</label>
        <ActionButtons :text="output" file-prefix="html" extension="html" :available-extensions="['html', 'xml', 'txt']" @clear="handleClear" />
      </div>
      <textarea
        v-model="output"
        readonly
        class="mag-textarea mag-input-mono h-40"
        placeholder="Result..."
        aria-label="HTML output"
      />
    </template>

    <template #history>
      <div class="mb-4">
        <HistoryList tool="html" @select="(item) => { input = item.input; output = item.output }" />
      </div>

      <h3 class="mag-section-title-sm">{{ t('tools.html.labels.entities') }}</h3>
      <div class="overflow-hidden rounded-lg border border-slate-200/60 dark:border-slate-700/60">
        <table class="w-full text-sm">
          <thead class="bg-slate-50/60 dark:bg-slate-800/40">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('tools.html.labels.char') }}</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('tools.html.labels.named') }}</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('tools.html.labels.decimal') }}</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('tools.html.labels.hex') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/40">
            <tr v-for="entity in HTML_ENTITIES" :key="entity.name" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
              <td class="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">{{ entity.char }}</td>
              <td class="px-3 py-2 font-mono text-primary">{{ entity.name }}</td>
              <td class="px-3 py-2 font-mono text-slate-500">{{ entity.decimal }}</td>
              <td class="px-3 py-2 font-mono text-slate-500">{{ entity.hex }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </ToolCard>
</template>

