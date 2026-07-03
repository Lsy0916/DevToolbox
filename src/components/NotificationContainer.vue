<!--
  NotificationContainer
  Toast 通知容器组件，固定于右上角展示通知消息。
  - 支持 success / error / info / warning 四种类型样式与图标
  - 基于 transition-group 提供滑入滑出动画
  - 消息来源于全局 notificationStore，支持手动关闭
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notificationStore'

const { t } = useI18n()
const store = useNotificationStore()

const styles: Record<string, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/30 dark:text-emerald-300',
  error: 'border-red-200 bg-red-50 text-red-700 dark:border-red-700/50 dark:bg-red-900/30 dark:text-red-300',
  info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700/50 dark:bg-blue-900/30 dark:text-blue-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-300',
}

const icons: Record<string, string> = {
  success: '✓',
  error: '✕',
  info: 'i',
  warning: '!',
}
</script>

<template>
  <div class="fixed right-4 top-4 z-50 flex flex-col gap-2">
    <transition-group name="notification">
      <div
        v-for="item in store.items"
        :key="item.id"
        class="flex items-center gap-3 rounded-lg border px-4 py-3 shadow-card-hover backdrop-blur"
        :class="styles[item.type]"
      >
        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-current/10 text-xs font-bold">
          {{ icons[item.type] }}
        </span>
        <span class="text-sm">{{ item.message }}</span>
        <button
          class="ml-2 text-current/60 hover:text-current"
          :aria-label="t('common.dismiss')"
          @click="store.remove(item.id)"
        >
          ✕
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
