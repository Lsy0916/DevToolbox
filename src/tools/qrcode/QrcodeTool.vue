<!--
  QrcodeTool 二维码生成工具
  用于将文本生成二维码图片并下载的工具。
  - 可配置纠错等级、尺寸、边距及前景背景颜色
  - 支持导出 PNG 图片或复制 Data URL
  - 实时预览生成结果，并记录历史
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import { useClipboard } from '@/composables/useClipboard'
import { generateQrDataUrl, downloadQr } from './qrcodeUtils'
import type { QrErrorLevel } from '@/types'

defineOptions({ name: 'QrcodeTool' })

const { t } = useI18n()
const { showSuccess, showError } = useNotification()
const { copy } = useClipboard()
const { saveHistory } = useHistory('qrcode')

// 输入文本
const text = ref('')
// 二维码选项
const level = ref<QrErrorLevel>('M')
const size = ref(256)
const margin = ref(4)
const dark = ref('#000000')
const light = ref('#FFFFFF')
// 生成结果
const dataUrl = ref('')
const generating = ref(false)

// 生成二维码
async function handleGenerate(): Promise<void> {
  if (!text.value.trim()) {
    showError(t('tools.qrcode.messages.emptyText'))
    return
  }
  generating.value = true
  try {
    const url = await generateQrDataUrl(text.value, {
      size: size.value,
      margin: margin.value,
      level: level.value,
      dark: dark.value,
      light: light.value,
    })
    dataUrl.value = url
    void saveHistory(text.value.slice(0, 60), url.slice(0, 100))
    showSuccess(t('tools.qrcode.messages.generated'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.qrcode.messages.emptyText'))
  } finally {
    generating.value = false
  }
}

// 下载 PNG
function handleDownload(): void {
  if (!dataUrl.value) {
    showError(t('common.nothingToExport'))
    return
  }
  downloadQr(dataUrl.value, `qrcode-${Date.now()}.png`)
  showSuccess(t('tools.qrcode.messages.downloaded'))
}

// 复制 Data URL
async function handleCopyDataUrl(): Promise<void> {
  if (!dataUrl.value) {
    showError(t('common.nothingToCopy'))
    return
  }
  const ok = await copy(dataUrl.value)
  if (ok) showSuccess(t('common.copySuccess'))
}
</script>

<template>
  <ToolCard
    :title="t('tools.qrcode.title')"
    :description="t('tools.qrcode.description')"
    tool-id="qrcode"
    layout="wide"
  >
    <template #actions>
      <div class="space-y-3">
        <!-- 文本输入 -->
        <div>
          <label class="mag-label">
            {{ t('tools.qrcode.labels.text') }}
          </label>
          <textarea
            v-model="text"
            rows="3"
            class="mag-textarea"
            :placeholder="t('tools.qrcode.labels.text')"
          />
        </div>

        <!-- 选项网格 -->
        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <label class="mag-label-sm">
              {{ t('tools.qrcode.labels.level') }}
            </label>
            <select
              v-model="level"
              class="mag-input"
            >
              <option value="L">{{ t('tools.qrcode.labels.levelL') }}</option>
              <option value="M">{{ t('tools.qrcode.labels.levelM') }}</option>
              <option value="Q">{{ t('tools.qrcode.labels.levelQ') }}</option>
              <option value="H">{{ t('tools.qrcode.labels.levelH') }}</option>
            </select>
          </div>

          <div>
            <label class="mag-label-sm">
              {{ t('tools.qrcode.labels.size') }}
            </label>
            <input
              v-model.number="size"
              type="number"
              min="128"
              max="1024"
              step="32"
              class="mag-input"
            />
          </div>

          <div>
            <label class="mag-label-sm">
              {{ t('tools.qrcode.labels.margin') }}
            </label>
            <input
              v-model.number="margin"
              type="number"
              min="0"
              max="10"
              class="mag-input"
            />
          </div>

          <div class="flex gap-2">
            <div class="flex-1">
              <label class="mag-label-sm">
                {{ t('tools.qrcode.labels.dark') }}
              </label>
              <input
                v-model="dark"
                type="color"
                class="h-9 w-full rounded-md border border-slate-200 dark:border-slate-600"
              />
            </div>
            <div class="flex-1">
              <label class="mag-label-sm">
                {{ t('tools.qrcode.labels.light') }}
              </label>
              <input
                v-model="light"
                type="color"
                class="h-9 w-full rounded-md border border-slate-200 dark:border-slate-600"
              />
            </div>
          </div>
        </div>

        <!-- 生成按钮 -->
        <button
          class="mag-btn-primary"
          :disabled="generating"
          @click="handleGenerate"
        >
          {{ generating ? t('common.loading') : t('tools.qrcode.actions.generate') }}
        </button>
      </div>
    </template>

    <template #output>
      <div v-if="dataUrl" class="space-y-4">
        <!-- 预览图 -->
        <div class="mag-cell flex justify-center p-6">
          <img
            :src="dataUrl"
            :alt="t('tools.qrcode.title')"
            class="max-w-full rounded"
            style="max-width: 320px"
          />
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-wrap justify-center gap-2">
          <button
            class="mag-btn"
            @click="handleDownload"
          >
            {{ t('tools.qrcode.actions.download') }}
          </button>
          <button
            class="mag-btn"
            @click="handleCopyDataUrl"
          >
            {{ t('tools.qrcode.actions.copyDataUrl') }}
          </button>
        </div>
      </div>
      <div v-else class="py-12 text-center text-sm text-slate-400">
        {{ t('tools.qrcode.messages.emptyText') }}
      </div>
    </template>

    <template #history>
      <HistoryList tool="qrcode" @select="() => {}" />
    </template>
  </ToolCard>
</template>

