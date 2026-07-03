<!--
  Base64Tool
  Base64 编解码工具组件，支持文本、图片和文件三种模式。
  - 文本模式支持标准 / URL 安全 / Hex 编码方式
  - 图片模式支持拖拽上传、预览和 Data URL 生成
  - 文件模式可编码任意文件并反向还原为 Blob 下载
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
import { useFileUpload, UploadError } from '@/composables/useFileUpload'
import {
  encodeBase64,
  decodeBase64,
  encodeBase64UrlSafe,
  decodeBase64UrlSafe,
  textToHex,
  hexToText,
  arrayBufferToBase64,
  base64ToBlob,
  getMimeTypeFromDataUrl,
  formatBytes,
} from './base64Utils'

defineOptions({ name: 'Base64Tool' })

const { t } = useI18n()

const activeTab = ref<'text' | 'image' | 'file'>('text')

// 文本模式
const textInput = ref('Hello, DevToolbox!')
const textOutput = ref('')
const textMode = ref<'encode' | 'decode'>('encode')
const encodeMode = ref<'standard' | 'urlSafe' | 'hex'>('standard')

const { saveHistory } = useHistory('base64')
const { showSuccess, showError } = useNotification()

const debouncedTextInput = useDebounce(textInput, 300)

const inputByteSize = computed(() => new Blob([textInput.value]).size)

function encodeByMode(input: string): string {
  if (encodeMode.value === 'urlSafe') return encodeBase64UrlSafe(input)
  if (encodeMode.value === 'hex') return textToHex(input)
  return encodeBase64(input)
}

function decodeByMode(input: string): string {
  if (encodeMode.value === 'urlSafe') return decodeBase64UrlSafe(input)
  if (encodeMode.value === 'hex') return hexToText(input)
  return decodeBase64(input)
}

watch(debouncedTextInput, (val) => {
  if (val === undefined) return
  if (!val) {
    textOutput.value = ''
    return
  }
  try {
    textOutput.value = textMode.value === 'encode' ? encodeByMode(val) : decodeByMode(val)
  } catch {
    textOutput.value = encodeMode.value === 'hex' ? t('tools.base64.messages.invalidHex') : t('tools.base64.messages.invalidBase64')
  }
})

watch(encodeMode, () => {
  if (textInput.value) {
    try {
      textOutput.value = textMode.value === 'encode' ? encodeByMode(textInput.value) : decodeByMode(textInput.value)
    } catch {
      textOutput.value = t('tools.base64.messages.invalidInput')
    }
  }
})

function handleTextEncode(): void {
  textMode.value = 'encode'
  try {
    textOutput.value = encodeByMode(textInput.value)
    void saveHistory(textInput.value, textOutput.value)
    showSuccess(t('tools.base64.messages.encoded'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.base64.messages.invalidInput'))
  }
}

function handleTextDecode(): void {
  textMode.value = 'decode'
  try {
    textOutput.value = decodeByMode(textInput.value)
    void saveHistory(textInput.value, textOutput.value)
    showSuccess(t('tools.base64.messages.decoded'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.base64.messages.invalidBase64'))
  }
}

// 图片模式
const imageDataUrl = ref('')
const imageInfo = ref<{ name: string; size: number; type: string; width: number; height: number } | null>(null)
const imageDragOver = ref(false)
const imageInput = ref<HTMLInputElement | null>(null)

const imageUpload = useFileUpload({
  maxSize: 5 * 1024 * 1024,
  acceptTypes: ['image/*'],
})
const imageProgress = computed(() => imageUpload.progress.value)
const imageLoading = computed(() => imageUpload.loading.value)

function clickImageInput(): void {
  imageInput.value?.click()
}

function handleImageDrop(e: DragEvent): void {
  e.preventDefault()
  imageDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    void loadImageFile(file)
  } else {
    showError(t('tools.base64.messages.dropImageError'))
  }
}

function handleImageSelect(e: Event): void {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) void loadImageFile(file)
  target.value = ''
}

async function loadImageFile(file: File): Promise<void> {
  try {
    const result = await imageUpload.readAsDataURL(file)
    imageDataUrl.value = result
    const img = new Image()
    img.onload = () => {
      imageInfo.value = {
        name: file.name,
        size: file.size,
        type: file.type,
        width: img.width,
        height: img.height,
      }
    }
    img.src = result
    void saveHistory(file.name, result.slice(0, 200))
  } catch (e) {
    if (e instanceof UploadError) {
      if (e.code === 'FILE_TOO_LARGE') showError(t('common.errors.fileTooLarge'))
      else if (e.code === 'UNSUPPORTED_TYPE') showError(t('common.errors.unsupportedType'))
      else showError(t('common.errors.parseError'))
    } else {
      showError(e instanceof Error ? e.message : t('common.errors.unknown'))
    }
  }
}

// 文件模式
const fileBase64 = ref('')
const fileInfo = ref<{ name: string; size: number; type: string } | null>(null)
const fileDragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const fileUpload = useFileUpload({
  maxSize: 10 * 1024 * 1024,
})
const fileProgress = computed(() => fileUpload.progress.value)
const fileLoading = computed(() => fileUpload.loading.value)

function clickFileInput(): void {
  fileInput.value?.click()
}

function handleFileDrop(e: DragEvent): void {
  e.preventDefault()
  fileDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) void loadFile(file)
}

function handleFileSelect(e: Event): void {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) void loadFile(file)
  target.value = ''
}

async function loadFile(file: File): Promise<void> {
  try {
    const buffer = await fileUpload.readAsArrayBuffer(file)
    fileBase64.value = arrayBufferToBase64(buffer)
    fileInfo.value = { name: file.name, size: file.size, type: file.type }
    void saveHistory(file.name, fileBase64.value.slice(0, 200))
    showSuccess(t('tools.base64.messages.fileEncoded'))
  } catch (e) {
    if (e instanceof UploadError) {
      if (e.code === 'FILE_TOO_LARGE') showError(t('common.errors.fileTooLarge'))
      else if (e.code === 'UNSUPPORTED_TYPE') showError(t('common.errors.unsupportedType'))
      else showError(t('common.errors.parseError'))
    } else {
      showError(e instanceof Error ? e.message : t('common.errors.unknown'))
    }
  }
}

function downloadFile(): void {
  if (!fileBase64.value || !fileInfo.value) return
  const blob = new Blob([fileBase64.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileInfo.value.name}.base64.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function restoreFile(): void {
  if (!textOutput.value) return
  try {
    const mime = getMimeTypeFromDataUrl(textOutput.value)
    const raw = textOutput.value.includes(',') ? textOutput.value.split(',')[1] ?? '' : textOutput.value
    const blob = base64ToBlob(raw, mime)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `restored.${mime.split('/')[1] ?? 'bin'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showSuccess(t('tools.base64.messages.restored'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.base64.messages.invalidBase64'))
  }
}

function handleClear(): void {
  if (activeTab.value === 'text') {
    textInput.value = ''
    textOutput.value = ''
  } else if (activeTab.value === 'image') {
    imageDataUrl.value = ''
    imageInfo.value = null
    imageUpload.reset()
  } else {
    fileBase64.value = ''
    fileInfo.value = null
    fileUpload.reset()
  }
}
</script>

<template>
  <ToolCard
    :title="t('tools.base64.title')"
    :description="t('tools.base64.description')"
    tool-id="base64"
    layout="split"
  >
    <template #actions>
      <div class="flex flex-wrap items-center gap-3">
        <div class="mag-tab-group">
          <button
            v-for="tab in (['text', 'image', 'file'] as const)"
            :key="tab"
            class="mag-tab"
            :class="activeTab === tab ? 'mag-tab-active' : ''"
            @click="activeTab = tab"
          >
            {{ t('tools.base64.labels.' + tab) }}
          </button>
        </div>
      </div>
    </template>

    <!-- 输入区（三模式统一 h-40） -->
    <template #input>
      <!-- 文本模式 -->
      <div v-if="activeTab === 'text'" class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="mag-label-inline">{{ t('tools.base64.labels.input') }}</label>
          <div class="flex items-center gap-3 text-xs">
            <span class="text-slate-500 dark:text-slate-400">{{ t('tools.base64.labels.mode') }}:</span>
            <label class="flex items-center gap-1 text-slate-700 dark:text-slate-300">
              <input v-model="encodeMode" type="radio" value="standard" class="rounded" />
              {{ t('tools.base64.labels.standard') }}
            </label>
            <label class="flex items-center gap-1 text-slate-700 dark:text-slate-300">
              <input v-model="encodeMode" type="radio" value="urlSafe" class="rounded" />
              {{ t('tools.base64.labels.urlSafe') }}
            </label>
            <label class="flex items-center gap-1 text-slate-700 dark:text-slate-300">
              <input v-model="encodeMode" type="radio" value="hex" class="rounded" />
              {{ t('tools.base64.labels.hex') }}
            </label>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="mag-btn-primary" @click="handleTextEncode">{{ t('tools.base64.actions.encode') }}</button>
          <button class="mag-btn" @click="handleTextDecode">{{ t('tools.base64.actions.decode') }}</button>
        </div>
        <textarea
          v-model="textInput"
          class="mag-textarea mag-input-mono h-40"
          :placeholder="t('tools.base64.labels.input') + '...'"
          aria-label="Base64 text input"
        />
        <p class="text-xs text-slate-400">{{ textInput.length }} chars, {{ inputByteSize }} bytes</p>
      </div>

      <!-- 图片模式 -->
      <div v-else-if="activeTab === 'image'" class="space-y-2">
        <button
          type="button"
          class="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-slate-600"
          :class="imageDragOver ? 'border-primary bg-primary/5' : ''"
          :aria-label="t('tools.base64.labels.dropImage')"
          @dragover.prevent="imageDragOver = true"
          @dragleave.prevent="imageDragOver = false"
          @drop="handleImageDrop"
          @click="clickImageInput"
        >
          <svg class="mb-2 h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ t('tools.base64.labels.dropImage') }}</p>
          <p class="mt-1 text-xs text-slate-400">≤ 5MB</p>
          <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="handleImageSelect" />
        </button>
        <div v-if="imageLoading || imageProgress > 0" class="h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            class="h-full bg-primary transition-all duration-150"
            :style="{ width: imageProgress + '%' }"
          />
        </div>
      </div>

      <!-- 文件模式 -->
      <div v-else class="space-y-2">
        <button
          type="button"
          class="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-slate-600"
          :class="fileDragOver ? 'border-primary bg-primary/5' : ''"
          :aria-label="t('tools.base64.labels.dropFile')"
          @dragover.prevent="fileDragOver = true"
          @dragleave.prevent="fileDragOver = false"
          @drop="handleFileDrop"
          @click="clickFileInput"
        >
          <svg class="mb-2 h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ t('tools.base64.labels.dropFile') }}</p>
          <p class="mt-1 text-xs text-slate-400">≤ 10MB</p>
          <input ref="fileInput" type="file" class="hidden" @change="handleFileSelect" />
        </button>
        <div v-if="fileLoading || fileProgress > 0" class="h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            class="h-full bg-primary transition-all duration-150"
            :style="{ width: fileProgress + '%' }"
          />
        </div>
      </div>
    </template>

    <!-- 输出区（三模式统一结构：头部 + 主输出 + 元信息） -->
    <template #output>
      <!-- 文本模式输出 -->
      <div v-if="activeTab === 'text'" class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="mag-label-inline">{{ t('tools.base64.labels.output') }}</label>
          <div class="flex gap-2">
            <button
              v-if="textMode === 'encode' && textOutput"
              class="mag-btn"
              @click="restoreFile"
            >
              {{ t('tools.base64.actions.restoreFile') }}
            </button>
            <ActionButtons :text="textOutput" @clear="handleClear" />
          </div>
        </div>
        <textarea
          v-model="textOutput"
          readonly
          class="mag-textarea mag-input-mono h-40 bg-slate-50/60 dark:bg-slate-800/40"
          :placeholder="t('common.result') + '...'"
          aria-label="Base64 text output"
        />
      </div>

      <!-- 图片模式输出（上下堆叠：预览图 + base64 文本） -->
      <div v-else-if="activeTab === 'image' && imageDataUrl" class="space-y-3">
        <div class="flex items-center justify-between">
          <label class="mag-label-inline">{{ t('tools.base64.labels.preview') }}</label>
          <ActionButtons :text="imageDataUrl" :show-save="false" @clear="handleClear" />
        </div>
        <div class="mag-card flex justify-center p-3">
          <img :src="imageDataUrl" alt="Preview" class="max-h-40 w-auto rounded-md object-contain" />
        </div>
        <div v-if="imageInfo" class="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div class="mag-cell">
            <p class="mag-cell-label">{{ t('tools.base64.labels.name') }}</p>
            <p class="mag-cell-value truncate" :title="imageInfo.name">{{ imageInfo.name }}</p>
          </div>
          <div class="mag-cell">
            <p class="mag-cell-label">{{ t('tools.base64.labels.size') }}</p>
            <p class="mag-cell-value">{{ formatBytes(imageInfo.size) }}</p>
          </div>
          <div class="mag-cell">
            <p class="mag-cell-label">{{ t('tools.base64.labels.type') }}</p>
            <p class="mag-cell-value">{{ imageInfo.type }}</p>
          </div>
          <div class="mag-cell">
            <p class="mag-cell-label">{{ t('tools.base64.labels.dimensions') }}</p>
            <p class="mag-cell-value">{{ imageInfo.width }} × {{ imageInfo.height }}</p>
          </div>
        </div>
        <textarea
          :value="imageDataUrl"
          readonly
          class="mag-textarea mag-input-mono mag-textarea-xs h-32 bg-slate-50/60 dark:bg-slate-800/40"
          aria-label="Image data URL"
        />
      </div>

      <!-- 文件模式输出 -->
      <div v-else-if="activeTab === 'file' && fileBase64" class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="mag-label-inline">{{ t('tools.base64.labels.base64Output') }}</label>
          <div class="flex gap-2">
            <ActionButtons :text="fileBase64" :show-save="false" :show-clear="false" />
            <button class="mag-btn" @click="downloadFile">{{ t('tools.base64.actions.downloadTxt') }}</button>
            <button class="mag-btn-ghost" @click="handleClear">{{ t('tools.base64.actions.clear') }}</button>
          </div>
        </div>
        <div v-if="fileInfo" class="grid grid-cols-3 gap-2 text-xs">
          <div class="mag-cell">
            <p class="mag-cell-label">{{ t('tools.base64.labels.name') }}</p>
            <p class="mag-cell-value truncate" :title="fileInfo.name">{{ fileInfo.name }}</p>
          </div>
          <div class="mag-cell">
            <p class="mag-cell-label">{{ t('tools.base64.labels.size') }}</p>
            <p class="mag-cell-value">{{ formatBytes(fileInfo.size) }}</p>
          </div>
          <div class="mag-cell">
            <p class="mag-cell-label">{{ t('tools.base64.labels.type') }}</p>
            <p class="mag-cell-value">{{ fileInfo.type || '—' }}</p>
          </div>
        </div>
        <textarea
          :value="fileBase64"
          readonly
          class="mag-textarea mag-input-mono mag-textarea-xs h-40 bg-slate-50/60 dark:bg-slate-800/40"
          aria-label="File base64 output"
        />
      </div>

      <!-- 空状态 -->
      <div v-else class="py-12 text-center text-sm text-slate-400">
        {{ t('common.result') }}
      </div>
    </template>

    <template #history>
      <HistoryList tool="base64" @select="(item) => { textInput = item.input; textOutput = item.output }" />
    </template>
  </ToolCard>
</template>

