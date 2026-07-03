<!--
  RadixTool 进制转换工具
  用于在二进制、八进制、十进制、十六进制之间相互转换的工具。
  - 输入指定进制数值后实时输出其余三种进制结果
  - 支持对二进制和十六进制结果按位分组显示
  - 提供一键复制与历史记录保存功能
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import { useClipboard } from '@/composables/useClipboard'
import { convertRadix, RADIX_PRESETS } from './radixUtils'

defineOptions({ name: 'RadixTool' })

const { t } = useI18n()
const { showSuccess } = useNotification()
const { copy } = useClipboard()
const { saveHistory } = useHistory('radix')

const input = ref('255')
const fromBase = ref(10)
const groupDigits = ref(false)

const parseResult = computed(() => convertRadix(input.value, fromBase.value, 10))

const allBases = computed(() => {
  if (parseResult.value.error || !parseResult.value.decimal) return null
  const dec = parseResult.value.decimal
  const bases = [
    { label: 'BIN', base: 2, labelKey: 'tools.radix.presets.bin' },
    { label: 'OCT', base: 8, labelKey: 'tools.radix.presets.oct' },
    { label: 'DEC', base: 10, labelKey: 'tools.radix.presets.dec' },
    { label: 'HEX', base: 16, labelKey: 'tools.radix.presets.hex' },
  ]
  return bases.map((b) => {
    const r = convertRadix(dec, 10, b.base)
    let val = r.output || ''
    if (groupDigits.value && (b.base === 2 || b.base === 16)) {
      val = val.match(/.{1,4}/g)?.join(' ') ?? val
    }
    return { ...b, value: val }
  })
})

function applyPreset(base: number): void {
  fromBase.value = base
}

function handleClear(): void {
  input.value = ''
}

async function handleCopy(text: string): Promise<void> {
  if (!text) return
  const ok = await copy(text)
  if (ok) showSuccess(t('common.copySuccess'))
}

function handleSave(): void {
  if (!allBases.value) return
  const summary = allBases.value.map((b) => `${b.label}: ${b.value}`).join('\n')
  void saveHistory(`${input.value} (base${fromBase.value})`, summary)
  showSuccess(t('tools.radix.messages.converted'))
}
</script>

<template>
  <ToolCard
    :title="t('tools.radix.title')"
    :description="t('tools.radix.description')"
    tool-id="radix"
    layout="wide"
  >
    <template #actions>
      <div class="flex flex-wrap items-center gap-3">
        <div class="mag-tab-group">
          <button
            v-for="p in RADIX_PRESETS"
            :key="`f-${p.value}`"
            :class="['mag-tab', fromBase === p.value && 'mag-tab-active']"
            @click="applyPreset(p.value)"
          >
            {{ t(p.labelKey) }}
          </button>
        </div>
        <label class="mag-label-inline flex items-center gap-1.5">
          <input v-model="groupDigits" type="checkbox" class="rounded" />
          {{ t('tools.radix.labels.groupDigits') }}
        </label>
        <button class="mag-btn-primary" @click="handleSave">{{ t('common.save') }}</button>
      </div>
    </template>

    <template #input>
      <div class="space-y-3">
        <div>
          <label class="mag-label">{{ t('tools.radix.labels.input') }} ({{ t('tools.radix.labels.fromBase') }}: {{ fromBase }})</label>
          <input
            v-model="input"
            type="text"
            class="mag-input mag-input-mono text-lg"
            :placeholder="t('tools.radix.labels.input') + '...'"
          />
        </div>
        <div v-if="parseResult.error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-300">
          {{ t('tools.radix.messages.invalid') }}
        </div>
      </div>
    </template>

    <template #output>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <label class="mag-label-inline">{{ t('tools.radix.labels.output') }}</label>
          <button class="mag-btn-ghost" @click="handleClear">{{ t('common.clear') }}</button>
        </div>
        <div v-if="allBases" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            v-for="b in allBases"
            :key="b.label"
            type="button"
            class="mag-card text-left transition-colors hover:border-primary"
            :aria-label="`Copy ${b.label}: ${b.value}`"
            @click="handleCopy(b.value)"
          >
            <p class="mag-cell-label">{{ t(b.labelKey) }}</p>
            <p class="mag-cell-value break-all font-mono text-sm">{{ b.value || '—' }}</p>
          </button>
        </div>
        <div v-else class="py-8 text-center text-sm text-slate-400">
          {{ t('tools.radix.messages.empty') }}
        </div>
        <div v-if="parseResult.decimal && !parseResult.error" class="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>{{ t('tools.radix.labels.decimal') }}: <span class="mag-mono">{{ parseResult.decimal }}</span></span>
          <span v-if="parseResult.isBigInt" class="text-amber-600 dark:text-amber-400">BigInt</span>
        </div>
      </div>
    </template>

    <template #history>
      <HistoryList tool="radix" @select="(item) => { input = item.input }" />
    </template>
  </ToolCard>
</template>

