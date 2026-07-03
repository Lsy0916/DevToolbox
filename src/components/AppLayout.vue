<!--
  AppLayout
  应用主布局外壳组件，承载侧边栏、顶部栏、主内容区和页脚。
  - 响应式设计：移动端通过遮罩 + 抽屉式侧边栏切换
  - 主内容区使用 keep-alive 缓存路由组件
  - 顶部栏集成语言、主题切换及使用指南入口
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolSidebar from './ToolSidebar.vue'
import ThemeToggle from './ThemeToggle.vue'
import LanguageToggle from './LanguageToggle.vue'

const { t } = useI18n()
const mobileSidebarOpen = ref(false)

function closeMobileSidebar(): void {
  mobileSidebarOpen.value = false
}
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- 移动端遮罩 -->
    <transition name="fade">
      <div
        v-if="mobileSidebarOpen"
        class="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
        @click="closeMobileSidebar"
      />
    </transition>

    <!-- 侧边栏 -->
    <aside
      class="fixed inset-y-0 left-0 z-40 w-72 transform border-r border-slate-200/60 bg-white transition-transform duration-300 lg:static lg:translate-x-0 dark:border-slate-700/60 dark:bg-slate-800"
      :class="mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex h-16 items-center gap-2.5 border-b border-slate-100 px-4 dark:border-slate-700/60">
        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-bold text-white shadow-sm">
          DT
        </span>
        <span class="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">
          DevToolbox
        </span>
      </div>
      <div class="h-[calc(100vh-4rem)]">
        <ToolSidebar />
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- 顶部栏 -->
      <header class="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/60 bg-white/80 px-4 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/80">
        <button
          class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-700"
          :aria-label="t('sidebar.toggle')"
          @click="mobileSidebarOpen = !mobileSidebarOpen"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div class="flex-1" />

        <span class="hidden text-xs text-slate-400 hover:text-slate-600 sm:inline dark:hover:text-slate-300">
          {{ t('app.allDataLocal') }}
        </span>

        <router-link
          to="/guide"
          class="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-primary sm:inline-flex dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>{{ t('guide.title') }}</span>
        </router-link>

        <LanguageToggle />
        <ThemeToggle />
      </header>

      <!-- 工具内容区 -->
      <main class="flex-1 overflow-y-auto">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" @click="closeMobileSidebar" />
          </keep-alive>
        </router-view>
      </main>

      <!-- 页脚提醒 -->
      <footer class="shrink-0 border-t border-slate-200/60 bg-white/50 px-4 py-2 text-center text-xs text-slate-400 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-500">
        {{ t('app.footerDisclaimer') }}
        <router-link to="/license" class="ml-1 underline hover:text-primary">{{ t('app.viewLicense') }}</router-link>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
