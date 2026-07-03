/**
 * Vue Router 路由配置
 *
 * 使用 hash 模式（createWebHashHistory），适配 GitHub Pages 静态部署，
 * 无需服务端配置 fallback 路由。
 *
 * 路由结构：
 * - / → 重定向到默认工具 /json
 * - /{toolId} → 26 个工具页，懒加载，meta.keepAlive 启用 keep-alive 缓存
 * - /guide → 使用指南页
 * - /license → 用户协议页（meta.public，无需接受免责声明即可访问）
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/json' },
  {
    path: '/json',
    name: 'json',
    component: () => import('@/tools/json/JsonTool.vue'),
    meta: { toolId: 'json', keepAlive: true },
  },
  {
    path: '/base64',
    name: 'base64',
    component: () => import('@/tools/base64/Base64Tool.vue'),
    meta: { toolId: 'base64', keepAlive: true },
  },
  {
    path: '/jwt',
    name: 'jwt',
    component: () => import('@/tools/jwt/JwtTool.vue'),
    meta: { toolId: 'jwt', keepAlive: true },
  },
  {
    path: '/url',
    name: 'url',
    component: () => import('@/tools/url/UrlTool.vue'),
    meta: { toolId: 'url', keepAlive: true },
  },
  {
    path: '/hash',
    name: 'hash',
    component: () => import('@/tools/hash/HashTool.vue'),
    meta: { toolId: 'hash', keepAlive: true },
  },
  {
    path: '/regex',
    name: 'regex',
    component: () => import('@/tools/regex/RegexTool.vue'),
    meta: { toolId: 'regex', keepAlive: true },
  },
  {
    path: '/timestamp',
    name: 'timestamp',
    component: () => import('@/tools/timestamp/TimestampTool.vue'),
    meta: { toolId: 'timestamp', keepAlive: true },
  },
  {
    path: '/color',
    name: 'color',
    component: () => import('@/tools/color/ColorTool.vue'),
    meta: { toolId: 'color', keepAlive: true },
  },
  {
    path: '/diff',
    name: 'diff',
    component: () => import('@/tools/diff/DiffTool.vue'),
    meta: { toolId: 'diff', keepAlive: true },
  },
  {
    path: '/html',
    name: 'html',
    component: () => import('@/tools/html/HtmlTool.vue'),
    meta: { toolId: 'html', keepAlive: true },
  },
  {
    path: '/uuid',
    name: 'uuid',
    component: () => import('@/tools/uuid/UuidTool.vue'),
    meta: { toolId: 'uuid', keepAlive: true },
  },
  {
    path: '/password',
    name: 'password',
    component: () => import('@/tools/password/PasswordTool.vue'),
    meta: { toolId: 'password', keepAlive: true },
  },
  {
    path: '/qrcode',
    name: 'qrcode',
    component: () => import('@/tools/qrcode/QrcodeTool.vue'),
    meta: { toolId: 'qrcode', keepAlive: true },
  },
  {
    path: '/api',
    name: 'api',
    component: () => import('@/tools/api/ApiTool.vue'),
    meta: { toolId: 'api', keepAlive: true },
  },
  {
    path: '/crypto',
    name: 'crypto',
    component: () => import('@/tools/crypto/CryptoTool.vue'),
    meta: { toolId: 'crypto', keepAlive: true },
  },
  {
    path: '/cron',
    name: 'cron',
    component: () => import('@/tools/cron/CronTool.vue'),
    meta: { toolId: 'cron', keepAlive: true },
  },
  {
    path: '/json2ts',
    name: 'json2ts',
    component: () => import('@/tools/json2ts/Json2tsTool.vue'),
    meta: { toolId: 'json2ts', keepAlive: true },
  },
  {
    path: '/sql',
    name: 'sql',
    component: () => import('@/tools/sql/SqlTool.vue'),
    meta: { toolId: 'sql', keepAlive: true },
  },
  {
    path: '/markdown',
    name: 'markdown',
    component: () => import('@/tools/markdown/MarkdownTool.vue'),
    meta: { toolId: 'markdown', keepAlive: true },
  },
  {
    path: '/case',
    name: 'case',
    component: () => import('@/tools/case/CaseTool.vue'),
    meta: { toolId: 'case', keepAlive: true },
  },
  {
    path: '/radix',
    name: 'radix',
    component: () => import('@/tools/radix/RadixTool.vue'),
    meta: { toolId: 'radix', keepAlive: true },
  },
  {
    path: '/textstat',
    name: 'textstat',
    component: () => import('@/tools/textstat/TextstatTool.vue'),
    meta: { toolId: 'textstat', keepAlive: true },
  },
  {
    path: '/lorem',
    name: 'lorem',
    component: () => import('@/tools/lorem/LoremTool.vue'),
    meta: { toolId: 'lorem', keepAlive: true },
  },
  {
    path: '/unicode',
    name: 'unicode',
    component: () => import('@/tools/unicode/UnicodeTool.vue'),
    meta: { toolId: 'unicode', keepAlive: true },
  },
  {
    path: '/httpref',
    name: 'httpref',
    component: () => import('@/tools/httpref/HttprefTool.vue'),
    meta: { toolId: 'httpref', keepAlive: true },
  },
  {
    path: '/data-manager',
    name: 'data-manager',
    component: () => import('@/tools/datamanager/DataManagerTool.vue'),
    meta: { toolId: 'data-manager', keepAlive: true },
  },
  {
    path: '/guide',
    name: 'guide',
    component: () => import('@/views/GuidePage.vue'),
    meta: { keepAlive: true },
  },
  {
    path: '/license',
    name: 'license',
    component: () => import('@/views/LicensePage.vue'),
    meta: { public: true },
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
