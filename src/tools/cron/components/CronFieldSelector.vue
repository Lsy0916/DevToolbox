<!--
  CronFieldSelector Cron 字段选择器
  用于可视化编辑 Cron 表达式单个字段的子组件。
  - 支持通配、步长、区间、列表、指定值五种模式切换
  - 通过 v-model 双向绑定字段值，并同步外部修改
  - 自动校验输入合法性并反馈无效状态
-->
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { parseField, buildField, getFieldRange, type FieldName, type FieldMode } from '../cronUtils'

const props = defineProps<{
  field: FieldName
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()

const range = computed(() => getFieldRange(props.field))

const fieldLabelKey = computed(() => `tools.cron.fields.${props.field}`)

const modes: { value: FieldMode; labelKey: string }[] = [
  { value: 'every', labelKey: 'tools.cron.fieldModes.every' },
  { value: 'step', labelKey: 'tools.cron.fieldModes.step' },
  { value: 'range', labelKey: 'tools.cron.fieldModes.range' },
  { value: 'list', labelKey: 'tools.cron.fieldModes.list' },
  { value: 'specific', labelKey: 'tools.cron.fieldModes.specific' },
]

const currentMode = ref<FieldMode>('every')
const stepValue = ref(1)
const rangeStart = ref(range.value.min)
const rangeEnd = ref(range.value.min + 1)
const specificValue = ref(range.value.min)
const listValues = ref<number[]>([])

const invalid = ref(false)
let lastEmitted = ''

function syncFromExternal(): void {
  if (props.modelValue === lastEmitted) return
  const parsed = parseField(props.modelValue)
  currentMode.value = parsed.mode
  invalid.value = parsed.invalid ?? false
  stepValue.value = parsed.step && parsed.step > 0 ? parsed.step : 1
  if (parsed.mode === 'range' && parsed.values.length >= 2) {
    rangeStart.value = parsed.values[0] ?? range.value.min
    rangeEnd.value = parsed.values[1] ?? range.value.min + 1
  }
  if (parsed.mode === 'specific' && parsed.values.length > 0) {
    specificValue.value = parsed.values[0] ?? range.value.min
  }
  if (parsed.mode === 'list') {
    listValues.value = parsed.values
  }
}

watch(() => props.modelValue, syncFromExternal, { immediate: true })

function emitValue(): void {
  let val: string
  switch (currentMode.value) {
    case 'every':
      val = '*'
      break
    case 'step':
      val = buildField('step', [], stepValue.value)
      break
    case 'range':
      val = buildField('range', [rangeStart.value, rangeEnd.value])
      break
    case 'list':
      val = buildField('list', listValues.value)
      break
    case 'specific':
      val = buildField('specific', [specificValue.value])
      break
    default:
      val = '*'
  }
  lastEmitted = val
  emit('update:modelValue', val)
}

function selectMode(mode: FieldMode): void {
  currentMode.value = mode
  invalid.value = false
  if (mode === 'list' && listValues.value.length === 0) {
    listValues.value = [range.value.min]
  }
  emitValue()
}

function toggleListValue(n: number): void {
  const idx = listValues.value.indexOf(n)
  if (idx >= 0) {
    listValues.value.splice(idx, 1)
  } else {
    listValues.value.push(n)
    listValues.value.sort((a, b) => a - b)
  }
  emitValue()
}

function updateStep(): void {
  if (stepValue.value < 1) stepValue.value = 1
  if (stepValue.value > range.value.max) stepValue.value = range.value.max
  emitValue()
}

function updateRangeStart(): void {
  if (rangeStart.value < range.value.min) rangeStart.value = range.value.min
  if (rangeStart.value > range.value.max) rangeStart.value = range.value.max
  if (rangeEnd.value < rangeStart.value) rangeEnd.value = rangeStart.value
  emitValue()
}

function updateRangeEnd(): void {
  if (rangeEnd.value < range.value.min) rangeEnd.value = range.value.min
  if (rangeEnd.value > range.value.max) rangeEnd.value = range.value.max
  if (rangeStart.value > rangeEnd.value) rangeStart.value = rangeEnd.value
  emitValue()
}

function updateSpecific(): void {
  if (specificValue.value < range.value.min) specificValue.value = range.value.min
  if (specificValue.value > range.value.max) specificValue.value = range.value.max
  emitValue()
}

const allNumbers = computed(() => {
  const arr: number[] = []
  for (let i = range.value.min; i <= range.value.max; i++) arr.push(i)
  return arr
})
</script>

<template>
  <div class="no-soften rounded-lg border border-slate-200/60 p-3 dark:border-slate-700/60">
    <div class="mb-2 flex items-center justify-between">
      <span class="text-xs font-medium text-slate-600 dark:text-slate-300">
        {{ t(fieldLabelKey) }}
        <span class="ml-1 font-mono text-[10px] text-slate-400">({{ range.min }}-{{ range.max }})</span>
      </span>
      <span v-if="invalid" class="text-[10px] font-medium text-amber-500">!</span>
    </div>

    <div class="mb-2 flex flex-wrap gap-1">
      <button
        v-for="m in modes"
        :key="m.value"
        class="rounded px-2 py-0.5 text-[10px] font-medium transition-colors"
        :class="currentMode === m.value
          ? 'bg-primary text-white'
          : 'border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'"
        @click="selectMode(m.value)"
      >
        {{ t(m.labelKey) }}
      </button>
    </div>

    <div class="min-h-[28px]">
      <span v-if="currentMode === 'every'" class="font-mono text-sm text-slate-400">*</span>

      <div v-else-if="currentMode === 'step'" class="flex items-center gap-1.5">
        <span class="text-xs text-slate-500">*/</span>
        <input
          v-model.number="stepValue"
          type="number"
          :min="1"
          :max="range.max"
          class="w-16 rounded border border-slate-200 px-2 py-0.5 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          @change="updateStep"
        />
      </div>

      <div v-else-if="currentMode === 'range'" class="flex items-center gap-1.5">
        <input
          v-model.number="rangeStart"
          type="number"
          :min="range.min"
          :max="range.max"
          class="w-16 rounded border border-slate-200 px-2 py-0.5 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          @change="updateRangeStart"
        />
        <span class="text-xs text-slate-400">-</span>
        <input
          v-model.number="rangeEnd"
          type="number"
          :min="range.min"
          :max="range.max"
          class="w-16 rounded border border-slate-200 px-2 py-0.5 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          @change="updateRangeEnd"
        />
      </div>

      <div v-else-if="currentMode === 'specific'">
        <input
          v-model.number="specificValue"
          type="number"
          :min="range.min"
          :max="range.max"
          class="w-20 rounded border border-slate-200 px-2 py-0.5 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          @change="updateSpecific"
        />
      </div>

      <div v-else-if="currentMode === 'list'" class="flex max-h-24 flex-wrap gap-0.5 overflow-y-auto">
        <button
          v-for="n in allNumbers"
          :key="n"
          class="h-6 w-7 rounded text-[10px] font-medium transition-colors"
          :class="listValues.includes(n)
            ? 'bg-primary text-white'
            : 'border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'"
          @click="toggleListValue(n)"
        >
          {{ n }}
        </button>
      </div>
    </div>
  </div>
</template>
