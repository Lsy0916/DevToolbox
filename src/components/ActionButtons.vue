<!--
  ActionButtons
  通用操作按钮组组件，提供复制、保存、导出、清除等操作。
  - 复制基于 useClipboard 组合式函数并反馈通知
  - 内置导出模态框，支持文件名编辑和扩展名选择
  - 通过 save/export/clear 事件与父组件交互
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useClipboard } from '@/composables/useClipboard'
import { useNotification } from '@/composables/useNotification'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    text?: string
    showSave?: boolean
    showExport?: boolean
    showClear?: boolean
    filePrefix?: string
    extension?: string
    availableExtensions?: string[]
  }>(),
  {
    text: '',
    showSave: true,
    showExport: true,
    showClear: true,
    filePrefix: 'devtoolbox',
    extension: 'txt',
    availableExtensions: () => [],
  },
)

const emit = defineEmits<{
  save: []
  export: []
  clear: []
}>()

const { copy, copied } = useClipboard()
const { showSuccess, showError } = useNotification()

async function handleCopy(): Promise<void> {
  if (!props.text) {
    showError(t('common.nothingToCopy'))
    return
  }
  const ok = await copy(props.text)
  if (ok) showSuccess(t('common.copySuccess'))
}

const MIME_TYPES: Record<string, string> = {
  json: 'application/json',
  ts: 'text/typescript',
  sql: 'application/sql',
  html: 'text/html',
  md: 'text/markdown',
  css: 'text/css',
  js: 'text/javascript',
  xml: 'application/xml',
  yaml: 'text/yaml',
  diff: 'text/x-diff',
  txt: 'text/plain',
}

// === 导出模态框 ===
const showExportModal = ref(false)
const exportFilename = ref('')
const exportExt = ref(props.extension)

function getEffectiveExtensions(): string[] {
  if (props.availableExtensions && props.availableExtensions.length > 0) {
    return props.availableExtensions
  }
  return [props.extension]
}

function handleExport(): void {
  if (!props.text) {
    showError(t('common.nothingToExport'))
    return
  }
  const ts = new Date().toISOString().slice(0, 10)
  exportFilename.value = `${props.filePrefix}-${ts}`
  exportExt.value = props.extension
  showExportModal.value = true
}

function confirmExport(): void {
  if (!exportFilename.value.trim()) {
    showError(t('common.exportModal.filenameRequired'))
    return
  }
  const mime = MIME_TYPES[exportExt.value] ?? 'text/plain'
  const blob = new Blob([props.text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  // 移除用户输入中可能误带的扩展名后缀
  const cleanName = exportFilename.value.trim().replace(/\.[a-z0-9]+$/i, '')
  a.download = `${cleanName}.${exportExt.value}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  showExportModal.value = false
  showSuccess(t('common.exportSuccess'))
  emit('export')
}

function cancelExport(): void {
  showExportModal.value = false
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <button
      class="mag-btn"
      :aria-label="t('common.copy')"
      @click="handleCopy"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
      </svg>
      {{ copied ? t('common.copied') : t('common.copy') }}
    </button>

    <button
      v-if="showSave"
      class="mag-btn"
      :aria-label="t('common.save')"
      @click="emit('save')"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M17 21v-8H7v8M7 3v5h8" />
      </svg>
      {{ t('common.save') }}
    </button>

    <button
      v-if="showExport"
      class="mag-btn"
      :aria-label="t('common.export')"
      @click="handleExport"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
      {{ t('common.export') }}
    </button>

    <button
      v-if="showClear"
      class="mag-btn-ghost"
      :aria-label="t('common.clear')"
      @click="emit('clear')"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
      </svg>
      {{ t('common.clear') }}
    </button>

    <!-- 导出模态框 -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div
          v-if="showExportModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          @click.self="cancelExport"
          @keydown.escape="cancelExport"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-modal-title"
            class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-800"
          >
            <h3 id="export-modal-title" class="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
              {{ t('common.exportModal.title') }}
            </h3>

            <!-- 文件名 -->
            <div class="mb-4">
              <label class="mag-label">
                {{ t('common.exportModal.filename') }}
              </label>
              <div class="flex items-center rounded-md border border-slate-200 dark:border-slate-600">
                <input
                  v-model="exportFilename"
                  type="text"
                  class="flex-1 rounded-l-md bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:bg-slate-700 dark:text-slate-200"
                  :placeholder="t('common.exportModal.filename')"
                  @keydown.enter="confirmExport"
                  @keydown.escape="cancelExport"
                />
                <span class="rounded-r-md bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:bg-slate-700/60 dark:text-slate-400">
                  .{{ exportExt }}
                </span>
              </div>
            </div>

            <!-- 文件类型选择 -->
            <div v-if="getEffectiveExtensions().length > 1" class="mb-6">
              <label class="mag-label">
                {{ t('common.exportModal.fileType') }}
              </label>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="ext in getEffectiveExtensions()"
                  :key="ext"
                  :class="exportExt === ext ? 'mag-btn-primary mag-btn-sm' : 'mag-btn mag-btn-sm'"
                  @click="exportExt = ext"
                >
                  .{{ ext }}
                </button>
              </div>
            </div>
            <div v-else class="mb-6">
              <label class="mag-label">
                {{ t('common.exportModal.fileType') }}
              </label>
              <p class="text-sm text-slate-500 dark:text-slate-400">.{{ exportExt }}</p>
            </div>

            <!-- 操作按钮 -->
            <div class="flex justify-end gap-2">
              <button
                class="mag-btn"
                @click="cancelExport"
              >
                {{ t('common.exportModal.cancel') }}
              </button>
              <button
                class="mag-btn-primary"
                @click="confirmExport"
              >
                {{ t('common.exportModal.confirm') }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
