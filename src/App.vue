<!--
  App 根组件
  首次访问时展示免责协议弹窗（DisclaimerModal），用户接受后持久化到 localStorage。
  通过版本化 key（license-accepted-v2）强制在协议更新后重新接受。
  布局由 AppLayout 承载，通知由 NotificationContainer 全局渲染。
-->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import NotificationContainer from '@/components/NotificationContainer.vue'
import DisclaimerModal from '@/components/DisclaimerModal.vue'
import { useAppStore } from '@/stores/appStore'

const appStore = useAppStore()

const LICENSE_STORAGE_KEY = 'devtoolbox:license-accepted-v2'
const licenseAccepted = ref<boolean>(false)

function handleLicenseAccepted(): void {
  licenseAccepted.value = true
}

onMounted(() => {
  try {
    const raw = localStorage.getItem(LICENSE_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { accepted?: boolean }
      licenseAccepted.value = Boolean(parsed.accepted)
    }
  } catch {
    licenseAccepted.value = false
  }
  appStore.initApp()
})
</script>

<template>
  <DisclaimerModal v-if="!licenseAccepted" @accepted="handleLicenseAccepted" />
  <AppLayout />
  <NotificationContainer />
</template>
