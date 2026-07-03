<!--
  MonacoEditor
  Monaco 代码编辑器封装组件，提供带语法高亮的编辑能力。
  - 支持 v-model 双向绑定、多语言、只读模式及高度自定义
  - 自动跟随应用深浅色主题切换编辑器主题
  - 监听 language 与 modelValue 变化并正确销毁实例
-->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from 'vue'
import { monaco } from '@/utils/monaco'
import { useAppStore } from '@/stores/appStore'
import type { MonacoLanguage } from '@/types'

const props = withDefaults(
  defineProps<{
    modelValue: string
    language?: MonacoLanguage
    readOnly?: boolean
    height?: number
  }>(),
  {
    language: 'plaintext',
    readOnly: false,
    height: 300,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const editor = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)
const appStore = useAppStore()

let ignoreChange = false

onMounted(() => {
  if (!containerRef.value) return
  editor.value = monaco.editor.create(containerRef.value, {
    value: props.modelValue,
    language: props.language,
    readOnly: props.readOnly,
    theme: appStore.theme === 'dark' ? 'vs-dark' : 'vs',
    automaticLayout: true,
    fontSize: 13,
    lineHeight: 20,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    tabSize: 2,
    padding: { top: 12, bottom: 12 },
  })

  editor.value.onDidChangeModelContent(() => {
    if (ignoreChange) return
    const value = editor.value?.getValue() ?? ''
    emit('update:modelValue', value)
  })
})

watch(
  () => props.modelValue,
  (val) => {
    if (editor.value && val !== editor.value.getValue()) {
      ignoreChange = true
      editor.value.setValue(val)
      ignoreChange = false
    }
  },
)

watch(
  () => props.language,
  (val) => {
    if (editor.value) {
      const model = editor.value.getModel()
      if (model) monaco.editor.setModelLanguage(model, val)
    }
  },
)

watch(
  () => appStore.theme,
  (val) => {
    monaco.editor.setTheme(val === 'dark' ? 'vs-dark' : 'vs')
  },
)

onBeforeUnmount(() => {
  editor.value?.dispose()
})
</script>

<template>
  <div
    ref="containerRef"
    class="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
    :style="{ height: `${height}px` }"
  />
</template>
