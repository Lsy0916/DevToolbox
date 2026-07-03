<!--
  DisclaimerModal
  免责声明弹窗组件，首次进入应用时延迟展示使用须知。
  - 列出免责要点并要求勾选同意后方可进入应用
  - 同意状态持久化到 localStorage（key 含版本号）
  - 支持稍后处理和跳转查看完整许可证页面
-->
<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

defineOptions({ name: 'DisclaimerModal' })

const emit = defineEmits<{
  (e: 'accepted'): void
}>()

const { t } = useI18n()
const router = useRouter()

const STORAGE_KEY = 'devtoolbox:license-accepted-v2'

const agreed = ref(false)
const visible = ref(false)

const canEnter = computed(() => agreed.value)

const points = computed(() => [
  t('disclaimer.point1'),
  t('disclaimer.point2'),
  t('disclaimer.point3'),
  t('disclaimer.point4'),
])

onMounted(() => {
  // 延迟到首屏渲染后显示，避免遮挡应用主界面
  void nextTick(() => {
    window.setTimeout(() => {
      visible.value = true
    }, 600)
  })
})

function handleEnter(): void {
  if (!canEnter.value) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, ts: Date.now() }))
  } catch {
    // 隐私模式或存储失败，仍然允许使用
  }
  visible.value = false
  emit('accepted')
}

function handleDismiss(): void {
  visible.value = false
}

function openLicense(): void {
  const routeData = router.resolve('/license')
  window.open(routeData.href, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <Transition name="disclaimer-slide">
    <div
      v-if="visible"
      class="fixed bottom-4 right-4 z-[100] w-full max-w-sm"
      role="dialog"
      aria-modal="false"
      aria-labelledby="disclaimer-title"
    >
      <div class="mag-card overflow-hidden p-6 shadow-2xl dark:shadow-black/40">
        <div class="mb-3 flex items-start justify-between gap-3">
          <h2 id="disclaimer-title" class="font-serif text-lg font-semibold text-slate-800 dark:text-slate-100">
            {{ t('disclaimer.title') }}
          </h2>
          <button
            type="button"
            class="-mt-1 -mr-1 shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            :aria-label="t('common.close')"
            @click="handleDismiss"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p class="text-xs font-light leading-relaxed text-slate-500 dark:text-slate-400">
          {{ t('disclaimer.summary') }}
        </p>

        <ul class="mt-4 space-y-2">
          <li
            v-for="(point, i) in points"
            :key="i"
            class="flex gap-2 text-xs text-slate-600 dark:text-slate-300"
          >
            <span class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">{{ i + 1 }}</span>
            <span class="font-light leading-relaxed">{{ point }}</span>
          </li>
        </ul>

        <label class="mt-4 flex cursor-pointer items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
          <input
            v-model="agreed"
            type="checkbox"
            class="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary/40 dark:border-slate-600 dark:bg-slate-700"
          />
          <span class="leading-relaxed">
            {{ t('disclaimer.agree') }}
            <button
              type="button"
              class="text-primary underline-offset-2 hover:underline"
              @click="openLicense"
            >
              {{ t('disclaimer.viewFull') }}
            </button>
          </span>
        </label>

        <div class="mt-5 flex justify-end gap-2">
          <button
            class="mag-btn-ghost text-xs"
            @click="handleDismiss"
          >
            {{ t('common.later') }}
          </button>
          <button
            class="mag-btn-primary text-xs"
            :disabled="!canEnter"
            @click="handleEnter"
          >
            {{ t('disclaimer.enter') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.disclaimer-slide-enter-active,
.disclaimer-slide-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.disclaimer-slide-enter-from,
.disclaimer-slide-leave-to {
  opacity: 0;
  transform: translateY(24px);
}
</style>
