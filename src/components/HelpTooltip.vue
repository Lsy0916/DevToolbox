<!--
  HelpTooltip
  帮助提示气泡组件，悬停或聚焦触发器时显示工具说明。
  - 延时显示/隐藏避免误触，并自动定位避免越出视口
  - 滚动或缩放时自动关闭，使用 Teleport 挂载到 body
  - 内嵌 ToolHelpContent 并提供跳转完整指南的链接
-->
<script setup lang="ts">
import { ref, reactive, nextTick, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolHelpContent from './ToolHelpContent.vue'
import { useToolHelp } from '@/composables/useToolHelp'

const props = defineProps<{ toolId: string }>()

const { t } = useI18n()
const { hasHelp } = useToolHelp(props.toolId)

const tooltipId = `help-tooltip-${Math.random().toString(36).slice(2, 9)}`

const triggerRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)
const visible = ref(false)
let showTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null

const pos = reactive({ top: 0, left: 0 })

function clearTimers(): void {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function handleEnter(): void {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  if (visible.value) return
  showTimer = setTimeout(() => {
    visible.value = true
    void nextTick(position)
  }, 200)
}

function handleLeave(): void {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  if (!visible.value) return
  hideTimer = setTimeout(() => {
    visible.value = false
  }, 100)
}

function position(): void {
  const trigger = triggerRef.value
  const tooltip = tooltipRef.value
  if (!trigger || !tooltip) return
  const rect = trigger.getBoundingClientRect()
  const tw = tooltip.offsetWidth
  const th = tooltip.offsetHeight
  const vw = window.innerWidth
  const vh = window.innerHeight

  let top = rect.top - th - 8
  if (top < 8) {
    top = rect.bottom + 8
    if (top + th > vh - 8) top = Math.max(8, vh - th - 8)
  }
  let left = rect.left + rect.width / 2 - tw / 2
  if (left < 8) left = 8
  if (left + tw > vw - 8) left = vw - tw - 8

  pos.top = top
  pos.left = left
}

function handleScroll(): void {
  if (visible.value) {
    visible.value = false
    clearTimers()
  }
}

window.addEventListener('scroll', handleScroll, true)
window.addEventListener('resize', handleScroll)

onBeforeUnmount(() => {
  clearTimers()
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleScroll)
})
</script>

<template>
  <span v-if="hasHelp" class="inline-flex">
    <button
      ref="triggerRef"
      type="button"
      class="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:text-slate-500 dark:hover:text-primary-light"
      :aria-label="t('guide.viewFullGuide')"
      :aria-describedby="visible ? tooltipId : undefined"
      @mouseenter="handleEnter"
      @mouseleave="handleLeave"
      @focus="handleEnter"
      @blur="handleLeave"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.5 9.5a2.5 2.5 0 113 2.5c-.8.3-1.5 1-1.5 2v1" />
        <circle cx="12" cy="17.5" r="0.5" fill="currentColor" />
      </svg>
    </button>

    <Teleport to="body">
      <div
        v-if="visible"
        :id="tooltipId"
        ref="tooltipRef"
        role="tooltip"
        class="fixed z-[100] max-w-[360px] max-h-[60vh] overflow-y-auto rounded-lg bg-white p-4 shadow-xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
        :style="{ top: pos.top + 'px', left: pos.left + 'px' }"
        @mouseenter="handleEnter"
        @mouseleave="handleLeave"
      >
        <ToolHelpContent :tool-id="toolId" variant="tooltip" />
        <div class="mt-3 border-t border-slate-100 pt-2 dark:border-slate-700">
          <router-link
            :to="{ path: '/guide', hash: `#tool-${toolId}` }"
            class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark dark:text-primary-light"
            @click="visible = false"
          >
            {{ t('guide.viewFullGuide') }}
            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </router-link>
        </div>
      </div>
    </Teleport>
  </span>
</template>
