<!--
  ToolCard
  工具卡片布局组件，统一渲染各工具页的标题、描述与内容结构。
  - 集成 HelpTooltip 帮助提示，展示工具概述与说明
  - 支持 stacked / split / wide 三种布局及 actions/input/output/history 插槽
  - split 布局在 xl 断点下左右分栏展示输入输出
-->
<script setup lang="ts">
import HelpTooltip from './HelpTooltip.vue'

defineProps<{
  title: string
  description: string
  toolId: string
  layout?: 'stacked' | 'split' | 'wide'
}>()
</script>

<template>
  <div
    class="tool-card mx-auto px-6 py-10 md:px-12 md:py-14 lg:px-16"
    :class="{
      'max-w-5xl': !layout || layout === 'stacked',
      'max-w-7xl': layout === 'split' || layout === 'wide',
    }"
  >
    <header class="mb-8 border-b border-slate-200 pb-6 dark:border-slate-700">
      <h1 class="flex items-center gap-3 font-serif text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl dark:text-slate-50">
        <span>{{ title }}</span>
        <HelpTooltip v-if="toolId" :tool-id="toolId" />
      </h1>
      <p class="mt-3 max-w-2xl text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400">
        {{ description }}
      </p>
    </header>

    <div v-if="$slots.actions" class="mb-6 flex justify-end border-b border-slate-100 pb-4 dark:border-slate-800">
      <slot name="actions" />
    </div>

    <div v-if="layout === 'split'" class="grid grid-cols-1 xl:grid-cols-2 xl:divide-x xl:divide-slate-100 dark:xl:divide-slate-700/40">
      <section v-if="$slots.input" class="xl:pr-8">
        <slot name="input" />
      </section>
      <section v-if="$slots.output" class="xl:pl-8">
        <slot name="output" />
      </section>
    </div>

    <template v-else>
      <section v-if="$slots.input" class="mb-8">
        <slot name="input" />
      </section>
      <section v-if="$slots.output" class="mb-8">
        <slot name="output" />
      </section>
    </template>

    <section v-if="$slots.history">
      <slot name="history" />
    </section>
  </div>
</template>
