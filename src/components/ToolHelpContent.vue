<!--
  ToolHelpContent
  工具帮助内容渲染组件，展示工具的使用说明信息。
  - 渲染概述、步骤、提示和注意事项四类内容
  - 支持 tooltip 紧凑模式与 full 完整模式两种变体
  - 注意事项区分 info / warning / tip 三种样式
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useToolHelp } from '@/composables/useToolHelp'

const props = withDefaults(defineProps<{
  toolId: string
  variant?: 'tooltip' | 'full'
}>(), {
  variant: 'full',
})

const { t } = useI18n()
const { hasHelp, overview, steps, tips, notes } = useToolHelp(props.toolId)

const noteIconPath: Record<string, string> = {
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  tip: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
}

const noteClasses: Record<string, string> = {
  info: 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-300',
  warning: 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-300',
  tip: 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',
}
</script>

<template>
  <div v-if="hasHelp" :class="variant === 'tooltip' ? 'space-y-3' : 'space-y-5'">
    <!-- Overview -->
    <p
      :class="variant === 'tooltip'
        ? 'text-xs leading-relaxed text-slate-600 dark:text-slate-300'
        : 'text-base leading-relaxed text-slate-700 dark:text-slate-300'"
    >
      {{ overview }}
    </p>

    <!-- Steps -->
    <div v-if="steps.length">
      <p
        class="mb-2 font-semibold uppercase tracking-wide"
        :class="variant === 'tooltip'
          ? 'text-[10px] text-slate-400'
          : 'text-xs text-slate-500 dark:text-slate-400'"
      >
        {{ t('guide.steps') }}
      </p>
      <ol class="space-y-2">
        <li v-for="(step, i) in steps" :key="i" class="flex gap-3">
          <span
            v-if="variant === 'full'"
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
          >{{ i + 1 }}</span>
          <span
            v-else
            class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-500 dark:bg-slate-600 dark:text-slate-300"
          >{{ i + 1 }}</span>
          <div class="min-w-0 flex-1">
            <p
              :class="variant === 'tooltip'
                ? 'text-xs font-medium text-slate-700 dark:text-slate-200'
                : 'text-sm font-medium text-slate-800 dark:text-slate-100'"
            >
              {{ step.title }}
            </p>
            <p
              :class="variant === 'tooltip'
                ? 'mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400'
                : 'mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400'"
            >
              {{ step.detail }}
            </p>
          </div>
        </li>
      </ol>
    </div>

    <!-- Tips -->
    <div v-if="tips.length">
      <p
        class="mb-2 font-semibold uppercase tracking-wide"
        :class="variant === 'tooltip'
          ? 'text-[10px] text-slate-400'
          : 'text-xs text-slate-500 dark:text-slate-400'"
      >
        {{ t('guide.tips') }}
      </p>
      <ul class="space-y-1.5">
        <li
          v-for="(tip, i) in tips"
          :key="i"
          class="flex gap-2"
          :class="variant === 'tooltip' ? 'text-[11px]' : 'text-sm'"
        >
          <span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary"></span>
          <span class="leading-relaxed text-slate-600 dark:text-slate-400">{{ tip }}</span>
        </li>
      </ul>
    </div>

    <!-- Notes (full mode only) -->
    <div v-if="variant === 'full' && notes.length" class="space-y-2">
      <div
        v-for="(note, i) in notes"
        :key="i"
        class="flex items-start gap-3 rounded-md border-l-4 p-3"
        :class="noteClasses[note.type]"
      >
        <svg class="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" :d="noteIconPath[note.type]" />
        </svg>
        <p class="text-sm leading-relaxed">{{ note.text }}</p>
      </div>
    </div>
  </div>
</template>
