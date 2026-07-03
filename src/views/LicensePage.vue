<!--
  许可证/用户协议页
  展示完整的用户协议文本（通过 i18n 渲染），提供返回按钮。
  由免责声明弹窗和页脚链接跳转进入。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'LicensePage' })

const router = useRouter()
const { t } = useI18n()

function goBack(): void {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/json')
  }
}

const sections = computed(() => [
  {
    title: t('license.section1Title'),
    paragraphs: [t('license.section1P1'), t('license.section1P2')],
  },
  {
    title: t('license.section2Title'),
    paragraphs: [t('license.section2P1'), t('license.section2P2')],
  },
  {
    title: t('license.section3Title'),
    paragraphs: [t('license.section3P1'), t('license.section3P2'), t('license.section3P3')],
  },
  {
    title: t('license.section4Title'),
    paragraphs: [t('license.section4P1'), t('license.section4P2')],
  },
  {
    title: t('license.section5Title'),
    paragraphs: [t('license.section5P1'), t('license.section5P2')],
  },
  {
    title: t('license.section6Title'),
    paragraphs: [t('license.section6P1'), t('license.section6P2')],
  },
])
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-slate-900">
    <header class="sticky top-0 z-10 border-b border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/80">
      <div class="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <button
          class="mag-btn-ghost"
          @click="goBack"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {{ t('license.back') }}
        </button>
        <span class="text-xs text-slate-400">DevToolbox</span>
      </div>
    </header>

    <main class="mx-auto max-w-3xl px-6 py-12">
      <h1 class="font-serif text-4xl font-semibold text-slate-800 dark:text-slate-100">
        {{ t('license.title') }}
      </h1>
      <p class="mt-3 font-light text-slate-500 dark:text-slate-400">
        {{ t('license.effectiveDate') }}
      </p>

      <div class="mt-10 space-y-10">
        <section v-for="(sec, i) in sections" :key="i">
          <h2 class="font-serif text-xl font-semibold text-slate-800 dark:text-slate-100">
            {{ sec.title }}
          </h2>
          <div class="mt-3 space-y-3">
            <p
              v-for="(p, j) in sec.paragraphs"
              :key="j"
              class="text-sm leading-relaxed text-slate-600 dark:text-slate-300"
            >
              {{ p }}
            </p>
          </div>
        </section>
      </div>

      <footer class="mt-16 border-t border-slate-100 pt-6 text-xs text-slate-400 dark:border-slate-800">
        <p>© 2026 DevToolbox Contributors</p>
      </footer>
    </main>
  </div>
</template>

