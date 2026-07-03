<!--
  LanguageToggle
  语言切换按钮组件，在中文（zh-CN）和英文（en-US）之间切换。
  - 通过 useLocale 组合式函数管理语言状态
  - 按钮文案显示当前可切换的目标语言
-->
<script setup lang="ts">
import { useLocale } from '@/composables/useLocale'
import { useI18n } from 'vue-i18n'

const { toggleLocale, locale } = useLocale()
const { t } = useI18n()
</script>

<template>
  <button
    class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
    :aria-label="t('language.toggle')"
    :title="t('language.toggle')"
    @click="toggleLocale"
  >
    <span class="text-xs font-semibold">
      {{ locale === 'zh-CN' ? t('language.en') : t('language.zh') }}
    </span>
  </button>
</template>
