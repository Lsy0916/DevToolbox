/**
 * Vite 构建配置
 *
 * 关键配置说明：
 * - base: '/devtoolbox/' — GitHub Pages 子路径部署，所有资源 URL 前缀
 * - AutoImport + Components — Element Plus 按需自动导入，无需手动 import
 * - worker.format: 'es' — Monaco worker 使用 ES 模块格式
 * - manualChunks — 将大型依赖拆分为独立 chunk，优化首屏加载：
 *   - monaco-editor（~2MB）单独打包
 *   - element-plus 单独打包
 *   - crypto-js 单独打包
 * - onwarn — 过滤 Element Plus 产生的 `#__PURE__` 无效注解警告（已知上游问题）
 * - chunkSizeWarningLimit: 6KB — 提升 chunk 大小警告阈值，避免 monaco chunk 误报
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/devtoolbox/',
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver({ importStyle: false })],
    }),
    Components({
      resolvers: [ElementPlusResolver({ importStyle: false })],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 6 * 1024,
    rollupOptions: {
      // 过滤 Element Plus 上游库产生的 #__PURE__ 注解警告，避免构建噪音
      onwarn(warning, defaultHandler) {
        if (
          warning.code === 'INVALID_ANNOTATION' &&
          warning.message.includes('#__PURE__')
        ) {
          return
        }
        defaultHandler(warning)
      },
      output: {
        // 大型依赖拆分为独立 chunk，利用浏览器缓存并行加载
        manualChunks: {
          monaco: ['monaco-editor'],
          'element-plus': ['element-plus'],
          'crypto-js': ['crypto-js'],
        },
      },
    },
  },
})
