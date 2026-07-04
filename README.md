# DevToolbox

[English](#english) | [简体中文](#简体中文)

---

## English

> A purely frontend developer toolbox — 26 tools, zero server, all data stays local.

![Vue 3](https://img.shields.io/badge/Vue-3.4-42b883)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6)
![Vite](https://img.shields.io/badge/Vite-5-646cff)
![Vitest](https://img.shields.io/badge/Vitest-4-6e9f18)
![License](https://img.shields.io/badge/License-Non--commercial-orange)

### Overview

DevToolbox is a browser-based developer toolkit. Every tool runs entirely client-side — no backend, no telemetry, no data leaves the browser. Deploy it on GitHub Pages for zero-cost hosting, or clone and run locally for offline use.

**Live Demo:** [https://lsy0916.github.io/devtoolbox/](https://lsy0916.github.io/devtoolbox/)

### Features

- **26 tools in one place** — JSON, Base64, JWT, Hash, Regex, Cron, SQL, Markdown, and more
- **Privacy-first** — all processing happens in the browser; settings in LocalStorage, history in IndexedDB
- **Bilingual UI** — Chinese / English toggle with vue-i18n
- **Dark mode** — system-following or manual toggle
- **TypeScript strict** — zero `any`, `noUncheckedIndexedAccess` enabled
- **Responsive** — works on desktop and mobile

### Tool List

| Category | Tools |
|----------|-------|
| Data | JSON Formatter, JSON → TypeScript, SQL Formatter, Radix Converter, Data Manager |
| Encoding | Base64, JWT, URL, Hash, QR Code, AES/RSA Crypto, Unicode Analyzer |
| Text | Regex Tester, Text Diff, HTML Escape, Markdown Preview, Case Converter, Text Statistics, Lorem Generator |
| Time | Timestamp Converter, Cron Expression |
| Dev | Color Tool, UUID Generator, Password Generator, API Tester, HTTP Reference |

### Tech Stack

- **Framework**: Vue 3.4 (Composition API + `<script setup>`)
- **Language**: TypeScript 5.3 (strict mode)
- **Build**: Vite 5
- **Styling**: Tailwind CSS 3.4 + Element Plus 2.5
- **State**: Pinia
- **Routing**: Vue Router 4 (Hash mode for GitHub Pages)
- **Storage**: LocalStorage (settings) + IndexedDB via `idb` (history)
- **Editor**: Monaco Editor
- **Testing**: Vitest 4 + @vue/test-utils + jsdom
- **Key libs**: crypto-js, cron-parser, cronstrue, diff-match-patch, js-yaml, marked, qrcode, sql-formatter

### Installation

```bash
# Clone the repository
git clone https://github.com/Lsy0916/DevToolbox.git
cd DevToolbox

# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev
```

### Usage

```bash
# Type checking
npm run type-check

# Production build
npm run build

# Preview production build
npm run preview

# Run unit tests
npm test

# Run tests with coverage report
npm run test:coverage
```

The built `dist/` folder is a static site that can be hosted on any static hosting service (GitHub Pages, Cloudflare Pages, Netlify, Vercel).

### GitHub Pages

This project is configured with GitHub Actions for automatic deployment to GitHub Pages. Every push to the `main` branch triggers the deployment workflow (`.github/workflows/deploy.yml`).

**To enable GitHub Pages:**
1. Go to repository **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Push to `main` — the workflow will build and deploy automatically

**URL:** [https://lsy0916.github.io/devtoolbox/](https://lsy0916.github.io/devtoolbox/)

### Online Access

With an internet connection, visit the [deployed site](https://lsy0916.github.io/devtoolbox/) and use all tools directly in the browser. No installation required.

### Offline Use

To use without internet:
1. Clone or download the project
2. Run `npm install && npm run build`
3. Serve the `dist/` folder with any static server (e.g. `npx serve dist`)
4. All tools work fully offline

### Project Structure

```
DevToolbox/
├── .github/workflows/deploy.yml   # GitHub Actions deployment
├── public/
│   └── icons/                     # Favicon (SVG)
├── src/
│   ├── components/                # Shared components
│   ├── composables/               # Vue composables
│   ├── config/                    # Site configuration
│   ├── locales/                   # i18n (zh-CN, en-US)
│   ├── stores/                    # Pinia stores
│   ├── styles/                    # Global styles
│   ├── tools/                     # 26 tool modules
│   │   ├── base64/
│   │   ├── case/
│   │   ├── color/
│   │   ├── ...
│   │   └── unicode/
│   ├── types/                     # TypeScript type definitions
│   ├── utils/                     # Utility functions
│   ├── views/                     # Page views
│   ├── App.vue
│   ├── main.ts
│   └── router.ts
├── env.d.ts
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

### Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-tool`)
3. Write or update tests for your changes
4. Ensure all tests pass (`npm test`) and types check (`npm run type-check`)
5. Commit with a clear message
6. Open a Pull Request

**Guidelines:**
- Keep tools fully client-side — no backend dependencies
- Maintain TypeScript strict mode (no `any`)
- Add i18n keys for both `zh-CN` and `en-US`
- Write unit tests for utility functions
- Follow the existing code style

### Privacy

- **All data is local** — settings in LocalStorage, history in IndexedDB
- **No network requests** — JWT, keys, JSON content never leave the browser
- **No third-party tracking** — no analytics, ads, or telemetry
- **Data loss risk** — clearing browser data removes everything; use Data Manager to export backups

### License

This project uses a custom non-commercial license. See [LICENSE](./LICENSE) for details.

Personal learning, research, and non-commercial use are permitted. Commercial use (selling, SaaS, embedding in commercial products) requires written authorization.

---

## 简体中文

> 纯前端开发者工具箱 —— 26 个工具，零服务器，数据完全本地。

![Vue 3](https://img.shields.io/badge/Vue-3.4-42b883)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6)
![Vite](https://img.shields.io/badge/Vite-5-646cff)
![Vitest](https://img.shields.io/badge/Vitest-4-6e9f18)
![License](https://img.shields.io/badge/License-非商业-orange)

### 项目概述

DevToolbox 是一个纯浏览器端的开发者工具箱。所有工具完全在客户端运行 —— 无后端、无埋点、数据不离开浏览器。部署到 GitHub Pages 零成本运行，或克隆到本地离线使用。

**在线访问：** [https://lsy0916.github.io/devtoolbox/](https://lsy0916.github.io/devtoolbox/)

### 核心特性

- **26 个工具集于一处** — JSON、Base64、JWT、哈希、正则、Cron、SQL、Markdown 等
- **隐私优先** — 所有处理在浏览器完成；设置存 LocalStorage，历史存 IndexedDB
- **中英双语** — 基于 vue-i18n 的界面语言切换
- **深色模式** — 跟随系统或手动切换
- **TypeScript 严格模式** — 零 `any`，开启 `noUncheckedIndexedAccess`
- **响应式** — 桌面端和移动端均可用

### 工具列表

| 分类 | 工具 |
|------|------|
| 数据 | JSON 格式化、JSON 转 TypeScript、SQL 格式化、进制转换、数据管理 |
| 编解码 | Base64、JWT、URL、哈希、二维码、AES/RSA 加解密、Unicode 分析 |
| 文本 | 正则测试、文本对比、HTML 转义、Markdown 预览、大小写转换、文本统计、Lorem 生成 |
| 时间 | 时间戳转换、Cron 表达式 |
| 开发 | 颜色工具、UUID 生成、密码生成、接口测试、HTTP 参考 |

### 技术栈

- **框架**：Vue 3.4（Composition API + `<script setup>`）
- **语言**：TypeScript 5.3（严格模式）
- **构建**：Vite 5
- **样式**：Tailwind CSS 3.4 + Element Plus 2.5
- **状态**：Pinia
- **路由**：Vue Router 4（Hash 模式，兼容 GitHub Pages）
- **存储**：LocalStorage（设置）+ IndexedDB via `idb`（历史）
- **编辑器**：Monaco Editor
- **测试**：Vitest 4 + @vue/test-utils + jsdom
- **关键依赖**：crypto-js, cron-parser, cronstrue, diff-match-patch, js-yaml, marked, qrcode, sql-formatter

### 安装

```bash
# 克隆仓库
git clone https://github.com/Lsy0916/DevToolbox.git
cd DevToolbox

# 安装依赖
npm install

# 启动开发服务器（http://localhost:5173）
npm run dev
```

### 使用方法

```bash
# 类型检查
npm run type-check

# 生产构建
npm run build

# 预览生产构建
npm run preview

# 运行单元测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage
```

构建产物 `dist/` 是纯静态站点，可托管在任何静态托管服务上（GitHub Pages、Cloudflare Pages、Netlify、Vercel）。

### GitHub Pages 部署

本项目已配置 GitHub Actions 自动部署到 GitHub Pages。每次推送到 `main` 分支会自动触发部署工作流（`.github/workflows/deploy.yml`）。

**启用 GitHub Pages 步骤：**
1. 进入仓库 **Settings → Pages**
2. 在 **Build and deployment** 下，将 **Source** 设为 **GitHub Actions**
3. 推送到 `main` 分支 — 工作流将自动构建并部署

**访问地址：** [https://lsy0916.github.io/devtoolbox/](https://lsy0916.github.io/devtoolbox/)

### 在线访问

有网络时，直接访问 [部署站点](https://lsy0916.github.io/devtoolbox/) 即可使用全部工具，无需安装。

### 离线使用

无网络时，可提前下载项目本地运行：
1. 克隆或下载项目
2. 执行 `npm install && npm run build`
3. 用任意静态服务器托管 `dist/` 目录（如 `npx serve dist`）
4. 所有工具完全离线可用

### 项目结构

```
DevToolbox/
├── .github/workflows/deploy.yml   # GitHub Actions 部署工作流
├── public/
│   └── icons/                     # 网站图标（SVG）
├── src/
│   ├── components/                # 通用组件
│   ├── composables/               # 组合式函数
│   ├── config/                    # 站点配置
│   ├── locales/                   # 国际化（zh-CN, en-US）
│   ├── stores/                    # Pinia store
│   ├── styles/                    # 全局样式
│   ├── tools/                     # 26 个工具模块
│   │   ├── base64/
│   │   ├── case/
│   │   ├── color/
│   │   ├── ...
│   │   └── unicode/
│   ├── types/                     # TypeScript 类型定义
│   ├── utils/                     # 工具函数
│   ├── views/                     # 页面视图
│   ├── App.vue
│   ├── main.ts
│   └── router.ts
├── env.d.ts
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

### 贡献指南

欢迎贡献！请按以下步骤操作：

1. Fork 本仓库
2. 创建功能分支（`git checkout -b feature/amazing-tool`）
3. 为你的改动编写或更新测试
4. 确保所有测试通过（`npm test`）且类型检查无误（`npm run type-check`）
5. 使用清晰的消息提交
6. 提交 Pull Request

**规范：**
- 保持工具完全客户端运行 —— 不依赖后端
- 维持 TypeScript 严格模式（禁用 `any`）
- 为 `zh-CN` 和 `en-US` 同时添加 i18n key
- 为工具函数编写单元测试
- 遵循现有代码风格

### 隐私说明

- **所有数据本地存储** — 设置在 LocalStorage，历史在 IndexedDB
- **无网络请求** — JWT、密钥、JSON 内容等完全不离开浏览器
- **无第三方追踪** — 不集成任何分析、广告或追踪脚本
- **数据丢失风险** — 清除浏览器数据会丢失全部内容；请使用「数据管理」工具导出备份

### License

本项目使用自定义非商业协议。详见 [LICENSE](./LICENSE)。

允许个人学习、研究和非商业使用。商业使用（销售、SaaS、嵌入商业产品）需书面授权。
