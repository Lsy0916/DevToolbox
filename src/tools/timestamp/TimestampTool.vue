<!--
  TimestampTool 时间戳转换工具
  用于在 Unix 时间戳与日期字符串之间相互转换的工具。
  - 支持秒/毫秒单位自动识别与手动切换，输出本地、UTC、ISO 等多种格式
  - 内置实时时钟与相对时间显示，便于快速核对当前时间
  - 提供两个时间戳的差值计算功能
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import ActionButtons from '@/components/ActionButtons.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import {
  detectUnit,
  timestampToDate,
  dateToTimestamp,
  formatLocal,
  formatUtc,
  formatIso,
  formatCustom,
  parseDate,
  getTimezone,
  getTimezoneOffset,
  formatRelative,
  diffTimestamps,
  getCurrentTimestamp,
  type TimestampUnit,
  type TimestampDiff,
  type RelativeTimeInfo,
} from './timestampUtils'

defineOptions({ name: 'TimestampTool' })

const { t } = useI18n()

const input = ref(String(Math.floor(Date.now() / 1000)))
const unitMode = ref<'auto' | 's' | 'ms'>('auto')
const clockEnabled = ref(true)
const now = ref(Date.now())

// 时间差计算
const diffInput1 = ref(String(Math.floor(Date.now() / 1000)))
const diffInput2 = ref(String(Math.floor(Date.now() / 1000) + 86400))
const diffResult = ref<TimestampDiff | null>(null)

const { saveHistory } = useHistory('timestamp')
const { showSuccess } = useNotification()

let clockInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  clockInterval = setInterval(() => {
    if (clockEnabled.value) now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval)
})

const clockSeconds = computed(() => Math.floor(now.value / 1000))
const clockDate = computed(() => new Date(now.value))

const parsedDate = computed<Date | null>(() => {
  const trimmed = input.value.trim()
  if (!trimmed) return null

  const num = Number(trimmed)
  if (!Number.isNaN(num) && trimmed !== '') {
    const mode = unitMode.value
    const unit: TimestampUnit = mode === 'auto' ? detectUnit(num) : mode
    return timestampToDate(num, unit)
  }

  return parseDate(trimmed)
})

const detectedUnit = computed<string>(() => {
  const trimmed = input.value.trim()
  const num = Number(trimmed)
  if (Number.isNaN(num) || trimmed === '') return '—'
  if (unitMode.value !== 'auto') return unitMode.value
  return detectUnit(num)
})

const relativeInfo = computed<RelativeTimeInfo | null>(() => {
  const trimmed = input.value.trim()
  const num = Number(trimmed)
  if (Number.isNaN(num) || trimmed === '') return null
  const unit: TimestampUnit = unitMode.value === 'auto' ? detectUnit(num) : (unitMode.value as TimestampUnit)
  return formatRelative(num, unit, now.value)
})

const relativeText = computed(() => {
  if (!relativeInfo.value) return ''
  const { value, unit, isPast } = relativeInfo.value
  return `${value} ${t('tools.timestamp.units.' + unit)}${t(isPast ? 'tools.timestamp.messages.ago' : 'tools.timestamp.messages.later')}`
})

const outputs = computed(() => {
  if (!parsedDate.value) return null
  const date = parsedDate.value
  return {
    local: formatLocal(date),
    utc: formatUtc(date),
    iso: formatIso(date),
    custom: formatCustom(date, 'YYYY-MM-DD HH:mm:ss'),
    seconds: dateToTimestamp(date, 's'),
    milliseconds: dateToTimestamp(date, 'ms'),
  }
})

function setNow(): void {
  input.value = String(getCurrentTimestamp('s'))
}

function setTodayStart(): void {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  input.value = String(Math.floor(date.getTime() / 1000))
}

function setTodayEnd(): void {
  const date = new Date()
  date.setHours(23, 59, 59, 0)
  input.value = String(Math.floor(date.getTime() / 1000))
}

function addDay(): void {
  const current = parsedDate.value ?? new Date()
  const next = new Date(current)
  next.setDate(next.getDate() + 1)
  input.value = String(Math.floor(next.getTime() / 1000))
}

function subDay(): void {
  const current = parsedDate.value ?? new Date()
  const prev = new Date(current)
  prev.setDate(prev.getDate() - 1)
  input.value = String(Math.floor(prev.getTime() / 1000))
}

function handleDiff(): void {
  const n1 = Number(diffInput1.value)
  const n2 = Number(diffInput2.value)
  if (Number.isNaN(n1) || Number.isNaN(n2)) return
  const unit: TimestampUnit = unitMode.value === 'auto' ? detectUnit(Math.max(n1, n2)) : (unitMode.value as TimestampUnit)
  diffResult.value = diffTimestamps(n1, n2, unit)
}

function handleClear(): void {
  input.value = ''
}

function handleSave(): void {
  if (!outputs.value) return
  void saveHistory(input.value, outputs.value.custom)
  showSuccess(t('tools.timestamp.messages.saved'))
}
</script>

<template>
  <ToolCard
    :title="t('tools.timestamp.title')"
    :description="t('tools.timestamp.description')"
    tool-id="timestamp"
    layout="wide"
  >
    <template #actions>
      <label class="mag-label-inline flex items-center gap-1.5">
        <input v-model="clockEnabled" type="checkbox" class="rounded" />
        {{ t('tools.timestamp.labels.liveClock') }}
      </label>
    </template>

    <template #input>
      <div class="space-y-3">
        <div>
          <label class="mag-label">
            {{ t('tools.timestamp.labels.input') }}
          </label>
          <input
            v-model="input"
            type="text"
            class="mag-input mag-input-mono"
            placeholder="1735689600 or 2025-01-01T00:00:00Z"
            aria-label="Timestamp or date input"
          />
        </div>

        <div>
          <label class="mag-label-sm">{{ t('tools.timestamp.labels.unit') }}</label>
          <div class="mag-tab-group">
            <button
              v-for="mode in (['auto', 's', 'ms'] as const)"
              :key="mode"
              class="mag-tab"
              :class="unitMode === mode ? 'mag-tab-active' : ''"
              @click="unitMode = mode"
            >
              {{ mode === 'auto' ? t('tools.timestamp.labels.auto') : mode === 's' ? t('tools.timestamp.labels.seconds') : t('tools.timestamp.labels.milliseconds') }}
            </button>
          </div>
          <p class="mt-1 text-xs text-slate-400">
            {{ t('tools.timestamp.labels.detected') }}: <span class="font-mono">{{ detectedUnit }}</span>
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button class="mag-btn" @click="setNow">{{ t('tools.timestamp.actions.now') }}</button>
          <button class="mag-btn" @click="setTodayStart">{{ t('tools.timestamp.actions.todayStart') }}</button>
          <button class="mag-btn" @click="setTodayEnd">{{ t('tools.timestamp.actions.todayEnd') }}</button>
          <button class="mag-btn" @click="addDay">{{ t('tools.timestamp.actions.addDay') }}</button>
          <button class="mag-btn" @click="subDay">{{ t('tools.timestamp.actions.subDay') }}</button>
        </div>
      </div>
    </template>

    <template #output>
      <div class="space-y-4">
        <div v-if="clockEnabled" class="mag-card-accent">
          <p class="mag-cell-label">{{ t('tools.timestamp.labels.currentTs') }}</p>
          <p class="mag-mono-lg mt-1">{{ clockSeconds }}</p>
          <p class="mt-1 font-mono text-xs text-slate-400">ms: {{ now }}</p>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">{{ formatLocal(clockDate) }}</p>
        </div>

        <div v-if="outputs">
          <div class="mb-2 flex items-center justify-between">
            <label class="mag-label-inline">{{ t('tools.timestamp.labels.results') }}</label>
            <ActionButtons :text="outputs.custom" :show-save="false" @clear="handleClear" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div class="mag-cell">
              <p class="mag-cell-label">{{ t('tools.timestamp.labels.local') }}</p>
              <p class="mag-cell-value">{{ outputs.local }}</p>
            </div>
            <div class="mag-cell">
              <p class="mag-cell-label">{{ t('tools.timestamp.labels.utc') }}</p>
              <p class="mag-cell-value">{{ outputs.utc }}</p>
            </div>
            <div class="mag-cell">
              <p class="mag-cell-label">{{ t('tools.timestamp.labels.iso') }}</p>
              <p class="mag-cell-value break-all">{{ outputs.iso }}</p>
            </div>
            <div class="mag-cell">
              <p class="mag-cell-label">{{ t('tools.timestamp.labels.formatted') }}</p>
              <p class="mag-cell-value">{{ outputs.custom }}</p>
            </div>
            <div class="mag-cell">
              <p class="mag-cell-label">{{ t('tools.timestamp.labels.unixS') }}</p>
              <p class="mag-cell-value font-mono">{{ outputs.seconds }}</p>
            </div>
            <div class="mag-cell">
              <p class="mag-cell-label">{{ t('tools.timestamp.labels.unixMs') }}</p>
              <p class="mag-cell-value font-mono">{{ outputs.milliseconds }}</p>
            </div>
          </div>

          <!-- 相对时间 -->
          <div v-if="relativeText" class="mag-cell mt-3">
            <p class="mag-cell-label">{{ t('tools.timestamp.labels.relative') }}</p>
            <p class="mag-cell-value">{{ relativeText }}</p>
          </div>
        </div>

        <p v-else-if="input.trim()" class="text-sm text-red-600 dark:text-red-400">
          {{ t('tools.timestamp.messages.invalid') }}
        </p>

        <p class="text-xs text-slate-400">
          {{ t('tools.timestamp.labels.timezone') }}: <span class="font-mono">{{ getTimezone() }}</span> ({{ getTimezoneOffset() }})
        </p>

        <!-- 时间差计算 -->
        <div class="mag-card">
          <label class="mag-label">{{ t('tools.timestamp.labels.diffCalc') }}</label>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label class="mag-label-sm">{{ t('tools.timestamp.labels.ts1') }}</label>
              <input
                v-model="diffInput1"
                type="text"
                class="mag-input mag-input-mono"
              />
            </div>
            <div>
              <label class="mag-label-sm">{{ t('tools.timestamp.labels.ts2') }}</label>
              <input
                v-model="diffInput2"
                type="text"
                class="mag-input mag-input-mono"
              />
            </div>
          </div>
          <button class="mag-btn mt-3" @click="handleDiff">{{ t('tools.timestamp.actions.diff') }}</button>
          <div v-if="diffResult" class="mag-cell mt-3">
            <p class="text-sm text-slate-700 dark:text-slate-300">
              {{ diffResult.days }} {{ t('tools.timestamp.labels.days') }} ·
              {{ diffResult.hours }} {{ t('tools.timestamp.labels.hours') }} ·
              {{ diffResult.minutes }} {{ t('tools.timestamp.labels.minutes') }} ·
              {{ diffResult.seconds }} {{ t('tools.timestamp.labels.secondsUnit') }}
            </p>
            <p class="mt-1 text-xs text-slate-400">
              {{ t('tools.timestamp.labels.totalSeconds') }}: {{ diffResult.totalSeconds }}
            </p>
          </div>
        </div>

        <div class="flex justify-end">
          <button
            class="mag-btn"
            @click="handleSave"
          >
            {{ t('tools.timestamp.actions.save') }}
          </button>
        </div>
      </div>
    </template>

    <template #history>
      <HistoryList tool="timestamp" @select="(item) => { input = item.input }" />
    </template>
  </ToolCard>
</template>

