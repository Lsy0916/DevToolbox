<!--
  ColorTool 颜色工具
  用于解析、转换与生成颜色方案的调色工具。
  - 支持 HEX/HSL/RGB 互转，并计算与黑白前景色的对比度
  - 生成互补色、类比色、三色、四色等配色方案
  - 提供调亮调暗色阶与渐变色生成功能
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useClipboard } from '@/composables/useClipboard'
import ToolCard from '@/components/ToolCard.vue'
import ActionButtons from '@/components/ActionButtons.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import {
  getColorInfo,
  hslToRgb,
  rgbToHex,
  contrastRatio,
  generatePalette,
  lightenColor,
  darkenColor,
  gradientBetween,
  cssGradient,
  type ColorScheme,
} from './colorUtils'
import type { RGBColor } from '@/types'

defineOptions({ name: 'ColorTool' })

const { t } = useI18n()
const { copy } = useClipboard()
const { showSuccess, showError } = useNotification()

const BLACK: RGBColor = { r: 0, g: 0, b: 0 }
const WHITE: RGBColor = { r: 255, g: 255, b: 255 }

// 基础输入
const hexInput = ref('#3b82f6')
const hslH = ref(217)
const hslS = ref(91)
const hslL = ref(60)
const activeScheme = ref<ColorScheme>('complementary')

// 调亮/调暗
const lightenAmount = ref(15)
const darkenAmount = ref(15)

// 渐变色阶
const gradientFrom = ref('#3b82f6')
const gradientTo = ref('#ec4899')
const gradientSteps = ref(6)
const gradientAngle = ref(90)

const schemes: { key: ColorScheme; labelKey: string }[] = [
  { key: 'complementary', labelKey: 'tools.color.labels.complementary' },
  { key: 'analogous', labelKey: 'tools.color.labels.analogous' },
  { key: 'triadic', labelKey: 'tools.color.labels.triadic' },
  { key: 'tetradic', labelKey: 'tools.color.labels.tetradic' },
]

const { saveHistory } = useHistory('color')

const currentColor = computed(() => getColorInfo(hexInput.value))

const contrastBlack = computed(() =>
  currentColor.value ? contrastRatio(currentColor.value.rgb, BLACK) : 0,
)
const contrastWhite = computed(() =>
  currentColor.value ? contrastRatio(currentColor.value.rgb, WHITE) : 0,
)

const palette = computed(() => {
  if (!currentColor.value) return []
  return generatePalette(currentColor.value.hex, activeScheme.value)
})

// 调亮/调暗色阶（各生成 5 阶）
const lightenScale = computed(() => {
  if (!currentColor.value) return []
  const result: string[] = []
  for (let i = 0; i < 5; i++) {
    result.push(lightenColor(currentColor.value.hex, lightenAmount.value * (i + 1)))
  }
  return result
})

const darkenScale = computed(() => {
  if (!currentColor.value) return []
  const result: string[] = []
  for (let i = 0; i < 5; i++) {
    result.push(darkenColor(currentColor.value.hex, darkenAmount.value * (i + 1)))
  }
  return result
})

// 渐变色阶
const gradientColors = computed(() =>
  gradientBetween(gradientFrom.value, gradientTo.value, gradientSteps.value),
)

const cssGradientText = computed(() => cssGradient(gradientColors.value, gradientAngle.value))

function syncHslFromHex(): void {
  const info = getColorInfo(hexInput.value)
  if (info) {
    hslH.value = info.hsl.h
    hslS.value = info.hsl.s
    hslL.value = info.hsl.l
  }
}

function syncHexFromHsl(): void {
  const rgb = hslToRgb({ h: hslH.value, s: hslS.value, l: hslL.value })
  hexInput.value = rgbToHex(rgb)
}

function wcagLevelKey(ratio: number): string {
  if (ratio >= 7) return 'tools.color.wcag.aaa'
  if (ratio >= 4.5) return 'tools.color.wcag.aa'
  if (ratio >= 3) return 'tools.color.wcag.aaLarge'
  return 'tools.color.wcag.fail'
}

function formatRgb(rgb: RGBColor): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
}

function formatHsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`
}

function formatHsv(h: number, s: number, v: number): string {
  return `hsv(${h}, ${s}%, ${v}%)`
}

async function copyValue(text: string): Promise<void> {
  try {
    await copy(text)
    showSuccess(t('tools.color.messages.copied', { text }))
  } catch {
    showError(t('tools.color.messages.copyFailed'))
  }
}

async function copyGradient(): Promise<void> {
  if (!cssGradientText.value) return
  await copyValue(cssGradientText.value)
}

function handleClear(): void {
  hexInput.value = '#3b82f6'
  syncHslFromHex()
}

function handleSave(): void {
  if (!currentColor.value) return
  void saveHistory(hexInput.value, currentColor.value.hex)
  showSuccess(t('tools.color.messages.saved'))
}
</script>

<template>
  <ToolCard
    :title="t('tools.color.title')"
    :description="t('tools.color.description')"
    tool-id="color"
    layout="wide"
  >
    <template #input>
      <div class="space-y-4">
        <div class="flex flex-wrap items-end gap-3">
          <div class="flex-1">
            <label class="mag-label">{{ t('tools.color.labels.hex') }}</label>
            <input
              v-model="hexInput"
              type="text"
              class="mag-input mag-input-mono"
              placeholder="#3b82f6"
              aria-label="HEX color input"
              @input="syncHslFromHex"
            />
          </div>
          <el-color-picker v-model="hexInput" @change="syncHslFromHex" />
        </div>

        <div v-if="currentColor" class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label class="mag-label-sm">
              {{ t('tools.color.labels.hue') }}: {{ hslH }}°
            </label>
            <input
              v-model.number="hslH"
              type="range"
              min="0"
              max="360"
              class="w-full"
              @input="syncHexFromHsl"
            />
          </div>
          <div>
            <label class="mag-label-sm">
              {{ t('tools.color.labels.saturation') }}: {{ hslS }}%
            </label>
            <input
              v-model.number="hslS"
              type="range"
              min="0"
              max="100"
              class="w-full"
              @input="syncHexFromHsl"
            />
          </div>
          <div>
            <label class="mag-label-sm">
              {{ t('tools.color.labels.lightness') }}: {{ hslL }}%
            </label>
            <input
              v-model.number="hslL"
              type="range"
              min="0"
              max="100"
              class="w-full"
              @input="syncHexFromHsl"
            />
          </div>
        </div>
      </div>
    </template>

    <template #output>
      <div v-if="currentColor" class="space-y-4">
        <div
          class="flex h-32 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600"
          :style="{ backgroundColor: currentColor.hex }"
        >
          <div class="flex gap-6">
            <span class="text-lg font-semibold" :style="{ color: '#000' }">Aa</span>
            <span class="text-lg font-semibold" :style="{ color: '#fff' }">Aa</span>
          </div>
        </div>

        <div>
          <div class="mb-2 flex items-center justify-between">
            <label class="mag-label-inline">{{ t('tools.color.labels.formats') }}</label>
            <ActionButtons :text="currentColor.hex" :show-save="false" file-prefix="color" extension="css" @clear="handleClear" />
          </div>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button type="button" class="mag-cell text-left cursor-pointer transition-colors hover:border-primary" :aria-label="`Copy HEX ${currentColor.hex}`" @click="copyValue(currentColor.hex)">
              <p class="mag-cell-label">HEX</p>
              <p class="mag-cell-value font-mono">{{ currentColor.hex }}</p>
            </button>
            <button type="button" class="mag-cell text-left cursor-pointer transition-colors hover:border-primary" :aria-label="`Copy RGB ${formatRgb(currentColor.rgb)}`" @click="copyValue(formatRgb(currentColor.rgb))">
              <p class="mag-cell-label">RGB</p>
              <p class="mag-cell-value font-mono">{{ formatRgb(currentColor.rgb) }}</p>
            </button>
            <button type="button" class="mag-cell text-left cursor-pointer transition-colors hover:border-primary" :aria-label="`Copy HSL`" @click="copyValue(formatHsl(currentColor.hsl.h, currentColor.hsl.s, currentColor.hsl.l))">
              <p class="mag-cell-label">HSL</p>
              <p class="mag-cell-value font-mono">{{ formatHsl(currentColor.hsl.h, currentColor.hsl.s, currentColor.hsl.l) }}</p>
            </button>
            <button type="button" class="mag-cell text-left cursor-pointer transition-colors hover:border-primary" :aria-label="`Copy HSV`" @click="copyValue(formatHsv(currentColor.hsv.h, currentColor.hsv.s, currentColor.hsv.v))">
              <p class="mag-cell-label">HSV</p>
              <p class="mag-cell-value font-mono">{{ formatHsv(currentColor.hsv.h, currentColor.hsv.s, currentColor.hsv.v) }}</p>
            </button>
          </div>
        </div>

        <div>
          <label class="mag-label">{{ t('tools.color.labels.contrast') }}</label>
          <div class="grid grid-cols-2 gap-3">
            <div class="mag-cell">
              <div class="flex items-center gap-3">
                <span class="flex h-8 w-8 items-center justify-center rounded bg-black text-sm font-bold text-white">A</span>
                <div>
                  <p class="mag-cell-label">{{ t('tools.color.labels.onBlack') }}</p>
                  <p class="mag-cell-value">
                    {{ contrastBlack.toFixed(2) }}
                    <span
                      class="ml-1 rounded px-1.5 py-0.5 text-xs font-medium"
                      :class="contrastBlack >= 4.5
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'"
                    >{{ t(wcagLevelKey(contrastBlack)) }}</span>
                  </p>
                </div>
              </div>
            </div>
            <div class="mag-cell">
              <div class="flex items-center gap-3">
                <span class="flex h-8 w-8 items-center justify-center rounded bg-white text-sm font-bold text-black">A</span>
                <div>
                  <p class="mag-cell-label">{{ t('tools.color.labels.onWhite') }}</p>
                  <p class="mag-cell-value">
                    {{ contrastWhite.toFixed(2) }}
                    <span
                      class="ml-1 rounded px-1.5 py-0.5 text-xs font-medium"
                      :class="contrastWhite >= 4.5
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'"
                    >{{ t(wcagLevelKey(contrastWhite)) }}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label class="mag-label">{{ t('tools.color.labels.schemes') }}</label>
          <div class="mag-tab-group mb-3">
            <button
              v-for="scheme in schemes"
              :key="scheme.key"
              class="mag-tab"
              :class="activeScheme === scheme.key ? 'mag-tab-active' : ''"
              @click="activeScheme = scheme.key"
            >
              {{ t(scheme.labelKey) }}
            </button>
          </div>
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            <button
              v-for="(color, i) in palette"
              :key="i"
              class="group relative h-20 overflow-hidden rounded-lg border border-slate-200 transition-transform hover:scale-105 dark:border-slate-600"
              :style="{ backgroundColor: color }"
              :aria-label="`Color ${i + 1}: ${color}`"
              @click="copyValue(color)"
            >
              <span
                class="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1 text-center font-mono text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
              >{{ color }}</span>
            </button>
          </div>
        </div>

        <!-- 调亮 / 调暗 -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div class="mb-2 flex items-center justify-between">
              <label class="mag-label-inline">{{ t('tools.color.labels.lighten') }}</label>
              <span class="text-xs text-slate-400">+{{ lightenAmount }}%</span>
            </div>
            <input
              v-model.number="lightenAmount"
              type="range"
              min="5"
              max="40"
              class="w-full"
            />
            <div class="mt-2 flex flex-wrap gap-1.5">
              <button
                v-for="(color, i) in lightenScale"
                :key="`l${i}`"
                class="group relative h-12 flex-1 min-w-[50px] overflow-hidden rounded border border-slate-200 transition-transform hover:scale-105 dark:border-slate-600"
                :style="{ backgroundColor: color }"
                @click="copyValue(color)"
              >
                <span class="absolute inset-x-0 bottom-0 bg-black/50 px-1 text-center font-mono text-[10px] text-white opacity-0 group-hover:opacity-100">{{ color }}</span>
              </button>
            </div>
          </div>
          <div>
            <div class="mb-2 flex items-center justify-between">
              <label class="mag-label-inline">{{ t('tools.color.labels.darken') }}</label>
              <span class="text-xs text-slate-400">-{{ darkenAmount }}%</span>
            </div>
            <input
              v-model.number="darkenAmount"
              type="range"
              min="5"
              max="40"
              class="w-full"
            />
            <div class="mt-2 flex flex-wrap gap-1.5">
              <button
                v-for="(color, i) in darkenScale"
                :key="`d${i}`"
                class="group relative h-12 flex-1 min-w-[50px] overflow-hidden rounded border border-slate-200 transition-transform hover:scale-105 dark:border-slate-600"
                :style="{ backgroundColor: color }"
                @click="copyValue(color)"
              >
                <span class="absolute inset-x-0 bottom-0 bg-black/50 px-1 text-center font-mono text-[10px] text-white opacity-0 group-hover:opacity-100">{{ color }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 渐变色阶 -->
        <div>
          <label class="mag-label">{{ t('tools.color.labels.gradient') }}</label>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label class="mag-label-sm">From</label>
              <input
                v-model="gradientFrom"
                type="text"
                class="mag-input mag-input-mono"
              />
            </div>
            <div>
              <label class="mag-label-sm">To</label>
              <input
                v-model="gradientTo"
                type="text"
                class="mag-input mag-input-mono"
              />
            </div>
            <div>
              <label class="mag-label-sm">{{ t('tools.color.labels.steps') }}: {{ gradientSteps }}</label>
              <input v-model.number="gradientSteps" type="range" min="2" max="12" class="w-full" />
            </div>
            <div>
              <label class="mag-label-sm">Angle: {{ gradientAngle }}°</label>
              <input v-model.number="gradientAngle" type="range" min="0" max="360" class="w-full" />
            </div>
          </div>

          <div
            v-if="gradientColors.length"
            class="mt-3 flex h-16 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600"
          >
            <button
              v-for="(color, i) in gradientColors"
              :key="`g${i}`"
              class="flex-1 transition-transform hover:scale-y-110"
              :style="{ backgroundColor: color }"
              :aria-label="`Gradient color ${i + 1}: ${color}`"
              @click="copyValue(color)"
            />
          </div>

          <div class="mag-card mt-3">
            <div class="mb-2 flex items-center justify-between">
              <label class="mag-label-inline">{{ t('tools.color.labels.cssGradient') }}</label>
              <button
                class="mag-btn-primary mag-btn-sm"
                @click="copyGradient"
              >
                {{ t('tools.color.actions.copyGradient') }}
              </button>
            </div>
            <div
              v-if="cssGradientText"
              class="h-12 w-full rounded border border-slate-200 dark:border-slate-600"
              :style="{ background: cssGradientText }"
            />
            <p class="mag-mono mt-2 break-all text-xs">{{ cssGradientText }}</p>
          </div>
        </div>

        <div class="flex justify-end">
          <button
            class="mag-btn-primary"
            @click="handleSave"
          >
            {{ t('tools.color.actions.save') }}
          </button>
        </div>
      </div>

      <div v-else class="py-8 text-center text-sm text-red-600 dark:text-red-400">
        {{ t('tools.color.messages.invalid') }}
      </div>
    </template>

    <template #history>
      <HistoryList tool="color" @select="(item) => { hexInput = item.input; syncHslFromHex() }" />
    </template>
  </ToolCard>
</template>

