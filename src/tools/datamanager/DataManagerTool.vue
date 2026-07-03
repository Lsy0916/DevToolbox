<!--
  DataManagerTool 数据管理工具
  用于导入、导出和清理应用本地数据的工具。
  - 支持按设置、数据等分类勾选并导出为 JSON 文件
  - 支持拖拽或选择文件导入，可选择性应用导入内容
  - 提供按分类清理本地数据的功能，便于备份与迁移
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import { useNotification } from '@/composables/useNotification'
import { useAppStore } from '@/stores/appStore'
import type { ExportCategory, ExportBundle } from './dataManagerUtils'
import {
  EXPORT_CATEGORIES,
  gatherExportData,
  generateExportJson,
  downloadJson,
  parseImportJson,
  applyImportData,
  getDefaultSelected,
  clearSelectedData,
} from './dataManagerUtils'

defineOptions({ name: 'DataManagerTool' })

const { t } = useI18n()
const { showSuccess, showError } = useNotification()
const appStore = useAppStore()

const activeTab = ref<'export' | 'import' | 'clear'>('export')
const exporting = ref(false)
const importing = ref(false)
const clearing = ref(false)

// === 导出 ===
const exportSelected = ref<Set<ExportCategory>>(getDefaultSelected())

const settingsCategories = computed(() => EXPORT_CATEGORIES.filter((c) => c.group === 'settings'))
const dataCategories = computed(() => EXPORT_CATEGORIES.filter((c) => c.group === 'data'))

function toggleExportCategory(key: ExportCategory): void {
  const next = new Set(exportSelected.value)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  exportSelected.value = next
}

function toggleAllExport(value: boolean): void {
  exportSelected.value = value ? new Set(EXPORT_CATEGORIES.map((c) => c.key)) : new Set()
}

async function handleExport(): Promise<void> {
  if (exportSelected.value.size === 0) {
    showError(t('tools.datamanager.messages.selectAtLeastOne'))
    return
  }
  exporting.value = true
  try {
    const data = await gatherExportData(exportSelected.value)
    const json = generateExportJson(data)
    downloadJson(json)
    showSuccess(t('tools.datamanager.messages.exportSuccess'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.datamanager.messages.exportFailed'))
  } finally {
    exporting.value = false
  }
}

// === 导入 ===
const fileInputEl = ref<HTMLInputElement | null>(null)
const parsedBundle = ref<ExportBundle | null>(null)
const importAvailable = ref<ExportCategory[]>([])
const importSelected = ref<Set<ExportCategory>>(new Set())
const importError = ref<string | null>(null)
const fileName = ref('')

function triggerFileInput(): void {
  fileInputEl.value?.click()
}

function handleFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  readFile(file)
  input.value = ''
}

function handleDrop(event: DragEvent): void {
  event.preventDefault()
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  if (!file.name.endsWith('.json')) {
    importError.value = 'OnlyJsonSupported'
    return
  }
  readFile(file)
}

function handleDragOver(event: DragEvent): void {
  event.preventDefault()
}

function readFile(file: File): void {
  fileName.value = file.name
  importError.value = null
  parsedBundle.value = null
  const reader = new FileReader()
  reader.onload = () => {
    const text = reader.result as string
    const result = parseImportJson(text)
    if (result.error) {
      importError.value = result.error
      return
    }
    if (result.bundle) {
      parsedBundle.value = result.bundle
      importAvailable.value = result.availableCategories
      importSelected.value = new Set(result.availableCategories)
    }
  }
  reader.onerror = () => {
    importError.value = 'ReadError'
  }
  reader.readAsText(file)
}

function toggleImportCategory(key: ExportCategory): void {
  const next = new Set(importSelected.value)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  importSelected.value = next
}

function toggleAllImport(value: boolean): void {
  importSelected.value = value ? new Set(importAvailable.value) : new Set()
}

async function handleImport(): Promise<void> {
  if (!parsedBundle.value) return
  if (importSelected.value.size === 0) {
    showError(t('tools.datamanager.messages.selectAtLeastOne'))
    return
  }
  importing.value = true
  try {
    await applyImportData(parsedBundle.value, importSelected.value)
    appStore.initApp()
    showSuccess(t('tools.datamanager.messages.importSuccess'))
    parsedBundle.value = null
    importAvailable.value = []
    importSelected.value = new Set()
    fileName.value = ''
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.datamanager.messages.importFailed'))
  } finally {
    importing.value = false
  }
}

function resetImport(): void {
  parsedBundle.value = null
  importAvailable.value = []
  importSelected.value = new Set()
  importError.value = null
  fileName.value = ''
}

// === 清空 ===
const clearSelected = ref<Set<ExportCategory>>(new Set())

function toggleClearCategory(key: ExportCategory): void {
  const next = new Set(clearSelected.value)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  clearSelected.value = next
}

function toggleAllClear(value: boolean): void {
  clearSelected.value = value ? new Set(EXPORT_CATEGORIES.map((c) => c.key)) : new Set()
}

async function handleClear(): Promise<void> {
  if (clearSelected.value.size === 0) {
    showError(t('tools.datamanager.messages.selectAtLeastOneClear'))
    return
  }
  if (!window.confirm(t('tools.datamanager.messages.clearConfirm'))) {
    return
  }
  clearing.value = true
  try {
    await clearSelectedData(clearSelected.value)
    appStore.initApp()
    showSuccess(t('tools.datamanager.messages.clearSuccess'))
    clearSelected.value = new Set()
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.datamanager.messages.clearFailed'))
  } finally {
    clearing.value = false
  }
}
</script>

<template>
  <ToolCard
    :title="t('tools.datamanager.title')"
    :description="t('tools.datamanager.description')"
    tool-id="data-manager"
    layout="wide"
  >
    <template #actions>
      <div class="mag-tab-group">
        <button
          :class="['mag-tab', activeTab === 'export' && 'mag-tab-active']"
          @click="activeTab = 'export'"
        >
          {{ t('tools.datamanager.tabs.export') }}
        </button>
        <button
          :class="['mag-tab', activeTab === 'import' && 'mag-tab-active']"
          @click="activeTab = 'import'"
        >
          {{ t('tools.datamanager.tabs.import') }}
        </button>
        <button
          :class="['mag-tab', activeTab === 'clear' ? 'mag-tab-danger-active' : '']"
          @click="activeTab = 'clear'"
        >
          {{ t('tools.datamanager.tabs.clear') }}
        </button>
      </div>
    </template>

    <template #input>
      <!-- 导出 -->
      <div v-if="activeTab === 'export'" class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="mag-section-title mb-0">
            {{ t('tools.datamanager.labels.selectExport') }}
          </h3>
          <div class="flex gap-2">
            <button class="mag-btn-ghost" @click="toggleAllExport(true)">
              {{ t('tools.datamanager.actions.selectAll') }}
            </button>
            <button class="mag-btn-ghost" @click="toggleAllExport(false)">
              {{ t('tools.datamanager.actions.deselectAll') }}
            </button>
          </div>
        </div>

        <!-- 设置类 -->
        <div>
          <h4 class="mag-section-title">{{ t('tools.datamanager.labels.groupSettings') }}</h4>
          <div>
            <label
              v-for="cat in settingsCategories"
              :key="cat.key"
              class="flex cursor-pointer items-center justify-between gap-4 border-b border-slate-100 py-4 dark:border-slate-800"
            >
              <div class="flex min-w-0 flex-1 items-center gap-3">
                <input
                  type="checkbox"
                  class="rounded"
                  :checked="exportSelected.has(cat.key)"
                  @change="toggleExportCategory(cat.key)"
                />
                <div class="min-w-0">
                  <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ t(cat.labelKey) }}</p>
                  <p class="text-xs text-slate-400">{{ t(cat.descKey) }}</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- 数据类 -->
        <div>
          <h4 class="mag-section-title">{{ t('tools.datamanager.labels.groupData') }}</h4>
          <div>
            <label
              v-for="cat in dataCategories"
              :key="cat.key"
              class="flex cursor-pointer items-center justify-between gap-4 border-b border-slate-100 py-4 dark:border-slate-800"
            >
              <div class="flex min-w-0 flex-1 items-center gap-3">
                <input
                  type="checkbox"
                  class="rounded"
                  :checked="exportSelected.has(cat.key)"
                  @change="toggleExportCategory(cat.key)"
                />
                <div class="min-w-0">
                  <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ t(cat.labelKey) }}</p>
                  <p class="text-xs text-slate-400">{{ t(cat.descKey) }}</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <button
          class="mag-btn-primary"
          :disabled="exporting || exportSelected.size === 0"
          @click="handleExport"
        >
          {{ exporting ? t('tools.datamanager.messages.exporting') : t('tools.datamanager.actions.export') }}
        </button>
      </div>

      <!-- 导入 -->
      <div v-else-if="activeTab === 'import'" class="space-y-6">
        <!-- 文件上传区 -->
        <div
          v-if="!parsedBundle && !importError"
          class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 py-12 transition-colors hover:border-primary hover:bg-primary/5 dark:border-slate-600"
          @click="triggerFileInput"
          @drop="handleDrop"
          @dragover="handleDragOver"
        >
          <svg class="mb-3 h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="text-sm font-light text-slate-500 dark:text-slate-400">{{ t('tools.datamanager.labels.dropHere') }}</p>
          <p class="mt-1 text-xs text-slate-400">{{ t('tools.datamanager.labels.orClick') }}</p>
          <input
            ref="fileInputEl"
            type="file"
            accept=".json,application/json"
            class="hidden"
            @change="handleFileChange"
          />
        </div>

        <!-- 错误提示 -->
        <div v-if="importError" class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-700/40 dark:bg-red-900/20">
          <p class="text-sm text-red-700 dark:text-red-300">
            {{ t(`tools.datamanager.messages.${importError}`) }}
          </p>
          <button class="mag-btn-ghost mt-2" @click="resetImport">
            {{ t('tools.datamanager.actions.tryAgain') }}
          </button>
        </div>

        <!-- 解析结果 -->
        <div v-if="parsedBundle" class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ fileName }}</p>
              <p class="text-xs text-slate-400">
                {{ t('tools.datamanager.labels.exportedAt') }}: {{ new Date(parsedBundle.exportedAt).toLocaleString() }}
              </p>
            </div>
            <button class="mag-btn-ghost" @click="resetImport">
              {{ t('tools.datamanager.actions.changeFile') }}
            </button>
          </div>

          <!-- 选择导入内容 -->
          <div>
            <div class="mb-2 flex items-center justify-between">
              <h3 class="mag-section-title mb-0">
                {{ t('tools.datamanager.labels.selectImport') }}
              </h3>
              <div class="flex gap-2">
                <button class="mag-btn-ghost" @click="toggleAllImport(true)">
                  {{ t('tools.datamanager.actions.selectAll') }}
                </button>
                <button class="mag-btn-ghost" @click="toggleAllImport(false)">
                  {{ t('tools.datamanager.actions.deselectAll') }}
                </button>
              </div>
            </div>
            <div>
              <label
                v-for="key in importAvailable"
                :key="key"
                class="flex cursor-pointer items-center justify-between gap-4 border-b border-slate-100 py-4 dark:border-slate-800"
              >
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  <input
                    type="checkbox"
                    class="rounded"
                    :checked="importSelected.has(key)"
                    @change="toggleImportCategory(key)"
                  />
                  <span class="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {{ t(EXPORT_CATEGORIES.find((c) => c.key === key)?.labelKey ?? '') }}
                  </span>
                </div>
              </label>
            </div>
          </div>

          <!-- 警告 -->
          <div class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
            {{ t('tools.datamanager.messages.importWarning') }}
          </div>

          <button
            class="mag-btn-primary"
            :disabled="importing || importSelected.size === 0"
            @click="handleImport"
          >
            {{ importing ? t('tools.datamanager.messages.importing') : t('tools.datamanager.actions.import') }}
          </button>
        </div>
      </div>

      <!-- 清空 -->
      <div v-else-if="activeTab === 'clear'" class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="mag-section-title mb-0">
            {{ t('tools.datamanager.labels.selectClear') }}
          </h3>
          <div class="flex gap-2">
            <button class="mag-btn-ghost" @click="toggleAllClear(true)">
              {{ t('tools.datamanager.actions.selectAll') }}
            </button>
            <button class="mag-btn-ghost" @click="toggleAllClear(false)">
              {{ t('tools.datamanager.actions.deselectAll') }}
            </button>
          </div>
        </div>

        <!-- 警告条 -->
        <div class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-300">
          <p class="flex items-center gap-2 font-medium">
            <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {{ t('tools.datamanager.messages.clearWarning') }}
          </p>
        </div>

        <!-- 设置类 -->
        <div>
          <h4 class="mag-section-title">{{ t('tools.datamanager.labels.groupSettings') }}</h4>
          <div>
            <label
              v-for="cat in settingsCategories"
              :key="cat.key"
              class="flex cursor-pointer items-center justify-between gap-4 border-b border-slate-100 py-4 dark:border-slate-800"
            >
              <div class="flex min-w-0 flex-1 items-center gap-3">
                <input
                  type="checkbox"
                  class="rounded"
                  :checked="clearSelected.has(cat.key)"
                  @change="toggleClearCategory(cat.key)"
                />
                <div class="min-w-0">
                  <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ t(cat.labelKey) }}</p>
                  <p class="text-xs text-slate-400">{{ t(cat.descKey) }}</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- 数据类 -->
        <div>
          <h4 class="mag-section-title">{{ t('tools.datamanager.labels.groupData') }}</h4>
          <div>
            <label
              v-for="cat in dataCategories"
              :key="cat.key"
              class="flex cursor-pointer items-center justify-between gap-4 border-b border-slate-100 py-4 dark:border-slate-800"
            >
              <div class="flex min-w-0 flex-1 items-center gap-3">
                <input
                  type="checkbox"
                  class="rounded"
                  :checked="clearSelected.has(cat.key)"
                  @change="toggleClearCategory(cat.key)"
                />
                <div class="min-w-0">
                  <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ t(cat.labelKey) }}</p>
                  <p class="text-xs text-slate-400">{{ t(cat.descKey) }}</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <button
          class="mag-btn-danger"
          :disabled="clearing || clearSelected.size === 0"
          @click="handleClear"
        >
          {{ clearing ? t('tools.datamanager.messages.clearing') : t('tools.datamanager.actions.clear') }}
        </button>
      </div>
    </template>
  </ToolCard>
</template>

