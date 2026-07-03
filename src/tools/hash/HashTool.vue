<!--
  HashTool
  哈希计算工具组件，支持多种算法的文本与文件摘要计算。
  - 支持 MD5 / SHA-1 / SHA-256 / SHA-384 / SHA-512 算法
  - 提供 HMAC 模式（仅 SHA-256/512）和文件拖拽哈希
  - 内置哈希值比对功能，便于校验数据完整性
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
import { hashText, hashFile, hmacSha256, hmacSha512, compareHash } from './hashUtils'
import type { HashAlgorithm } from '@/types'

defineOptions({ name: 'HashTool' })

const { t } = useI18n()

const input = ref('Hello, DevToolbox!')
const output = ref('')
const algorithm = ref<HashAlgorithm>('SHA-256')
const uppercase = ref(false)
const fileMode = ref(false)
const fileProgress = ref(0)
const fileName = ref('')

// 模式：普通 / HMAC
const hashMode = ref<'plain' | 'hmac'>('plain')
const secret = ref('')

// 比对面板
const expectedHash = ref('')
const compareResult = ref<boolean | null>(null)

const algorithms: HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

// HMAC 仅支持 SHA-256 / SHA-512
const hmacSupported = computed(() => algorithm.value === 'SHA-256' || algorithm.value === 'SHA-512')

const { saveHistory } = useHistory('hash')
const { showSuccess, showError } = useNotification()

const debouncedInput = useDebounce(input, 300)

async function computeHash(): Promise<void> {
  if (!input.value) {
    output.value = ''
    return
  }
  try {
    let result: string
    if (hashMode.value === 'hmac') {
      if (!hmacSupported.value) {
        showError(t('tools.hash.messages.hashFailed'))
        return
      }
      if (!secret.value) {
        showError(t('tools.jwt.messages.noSecret'))
        return
      }
      result = algorithm.value === 'SHA-256'
        ? hmacSha256(input.value, secret.value)
        : hmacSha512(input.value, secret.value)
    } else {
      result = await hashText(input.value, algorithm.value)
    }
    if (uppercase.value) result = result.toUpperCase()
    output.value = result
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.hash.messages.hashFailed'))
  }
}

watch(debouncedInput, () => {
  if (!fileMode.value) void computeHash()
})

watch(algorithm, () => {
  if (!fileMode.value) void computeHash()
})

watch(hashMode, () => {
  if (!fileMode.value) void computeHash()
})

watch(uppercase, () => {
  if (output.value) {
    output.value = uppercase.value
      ? output.value.toUpperCase()
      : output.value.toLowerCase()
  }
})

function handleCompare(): void {
  if (!output.value || !expectedHash.value) return
  compareResult.value = compareHash(output.value, expectedHash.value)
  if (compareResult.value) {
    showSuccess(t('tools.hash.messages.match'))
  } else {
    showError(t('tools.hash.messages.mismatch'))
  }
}

function handleClear(): void {
  input.value = ''
  output.value = ''
  fileProgress.value = 0
  fileName.value = ''
  expectedHash.value = ''
  compareResult.value = null
}

function handleFileDrop(e: DragEvent): void {
  e.preventDefault()
  const file = e.dataTransfer?.files?.[0]
  if (file) loadFile(file)
}

function handleFileSelect(e: Event): void {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) loadFile(file)
}

async function loadFile(file: File): Promise<void> {
  if (hashMode.value === 'hmac') return
  fileMode.value = true
  fileName.value = file.name
  fileProgress.value = 0
  try {
    let result = await hashFile(file, algorithm.value, (percent) => {
      fileProgress.value = percent
    })
    if (uppercase.value) result = result.toUpperCase()
    output.value = result
    void saveHistory(file.name, result)
    showSuccess(t('tools.hash.messages.hashed', { name: file.name }))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.hash.messages.fileHashFailed'))
  }
}

function switchToTextMode(): void {
  fileMode.value = false
  fileProgress.value = 0
  fileName.value = ''
  void computeHash()
}

async function handleCompute(): Promise<void> {
  await computeHash()
  if (output.value && !fileMode.value) {
    void saveHistory(input.value, output.value)
  }
}
</script>

<template>
  <ToolCard
    :title="t('tools.hash.title')"
    :description="t('tools.hash.description')"
    tool-id="hash"
    layout="split"
  >
    <template #actions>
      <div class="w-full space-y-2">
        <div class="flex flex-wrap items-center gap-3">
          <!-- 模式切换 Plain / HMAC -->
          <div class="mag-tab-group">
            <button
              class="mag-tab"
              :class="hashMode === 'plain' ? 'mag-tab-active' : ''"
              @click="hashMode = 'plain'"
            >
              {{ t('tools.hash.labels.plain') }}
            </button>
            <button
              class="mag-tab"
              :class="hashMode === 'hmac' ? 'mag-tab-active' : ''"
              @click="hashMode = 'hmac'"
            >
              {{ t('tools.hash.labels.hmac') }}
            </button>
          </div>

          <select
            v-model="algorithm"
            class="mag-input w-auto"
            :aria-label="t('tools.hash.labels.algorithm')"
          >
            <option v-for="algo in algorithms" :key="algo" :value="algo">{{ algo }}</option>
          </select>

          <label class="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
            <input v-model="uppercase" type="checkbox" class="rounded" />
            {{ t('tools.hash.labels.uppercase') }}
          </label>
        </div>

        <!-- HMAC 模式：密钥输入 -->
        <div v-if="hashMode === 'hmac'" class="flex flex-wrap items-center gap-2">
          <label class="mag-label-inline !mb-0">{{ t('tools.hash.labels.secret') }}:</label>
          <input
            v-model="secret"
            type="text"
            class="mag-input mag-input-mono flex-1 min-w-[200px]"
            placeholder="your-secret-key"
          />
          <span v-if="!hmacSupported" class="text-xs text-amber-600 dark:text-amber-400">
            HMAC {{ t('tools.hash.labels.algorithm') }}: SHA-256 / SHA-512
          </span>
        </div>
      </div>
    </template>

    <template #input>
      <div class="mb-2 flex items-center justify-between">
        <label class="mag-label-inline">{{ t('tools.hash.labels.input') }}</label>
        <button
          v-if="fileMode"
          class="text-xs text-primary hover:underline"
          @click="switchToTextMode"
        >
          {{ t('tools.hash.actions.swap') }}
        </button>
      </div>

      <div v-if="!fileMode">
        <textarea
          v-model="input"
          class="mag-textarea mag-input-mono h-32"
          :placeholder="t('tools.hash.labels.input') + '...'"
          :aria-label="t('tools.hash.labels.input')"
        />
        <div class="mt-2 flex justify-end">
          <button class="mag-btn-primary" @click="handleCompute">{{ t('tools.hash.actions.compute') }}</button>
        </div>
      </div>

      <div
        v-else
        class="flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600"
        @dragover.prevent
        @drop="handleFileDrop"
      >
        <p class="text-sm text-slate-600 dark:text-slate-300">{{ fileName || t('tools.hash.labels.dropFile') }}</p>
        <div v-if="fileProgress > 0 && fileProgress < 100" class="mt-2 w-48">
          <div class="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
            <div class="h-full bg-primary transition-all" :style="{ width: `${fileProgress}%` }" />
          </div>
          <p class="mt-1 text-center text-xs text-slate-400">{{ fileProgress }}%</p>
        </div>
        <input type="file" class="mt-2 text-xs" @change="handleFileSelect" />
      </div>
    </template>

    <template #output>
      <div class="mb-2 flex items-center justify-between">
        <label class="mag-label-inline">{{ t('tools.hash.labels.output') }}</label>
        <ActionButtons :text="output" @clear="handleClear" />
      </div>
      <div class="mag-cell">
        <p class="break-all font-mono text-sm text-primary">{{ output || '—' }}</p>
      </div>
      <p v-if="output" class="mt-1 text-xs text-slate-400">{{ output.length }} chars ({{ output.length * 4 }} bits)</p>

      <!-- 比对期望值面板 -->
      <div v-if="output" class="mt-4">
        <label class="mag-label">{{ t('tools.hash.labels.expected') }}</label>
        <div class="flex gap-2">
          <input
            v-model="expectedHash"
            type="text"
            class="mag-input mag-input-mono flex-1"
            :placeholder="t('tools.hash.labels.expected') + '...'"
          />
          <button class="mag-btn" @click="handleCompare">{{ t('tools.hash.actions.compare') }}</button>
        </div>
        <div v-if="compareResult !== null" class="mt-2">
          <p
            class="text-sm font-medium"
            :class="compareResult ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
          >
            {{ compareResult ? '✓ ' + t('tools.hash.messages.match') : '✕ ' + t('tools.hash.messages.mismatch') }}
          </p>
        </div>
      </div>
    </template>

    <template #history>
      <HistoryList tool="hash" @select="(item) => { input = item.input; output = item.output }" />
    </template>
  </ToolCard>
</template>

