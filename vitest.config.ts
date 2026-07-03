/**
 * Vitest 测试框架配置
 *
 * - 环境: jsdom（模拟浏览器 DOM，支持 FileReader、crypto.subtle 等 API）
 * - globals: true — describe/it/expect 全局可用，无需 import
 * - 测试文件匹配: src 下所有 .test.ts / .spec.ts
 * - 覆盖率: v8 provider，仅统计工具纯函数（*Utils.ts）与核心 utils
 *
 * 运行命令：
 * - npm test          — 单次运行
 * - npm run test:watch — 监听模式
 * - npm run test:coverage — 生成覆盖率报告
 */
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: ['src/tools/**/*Utils.ts', 'src/utils/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/types/**'],
    },
  },
})
