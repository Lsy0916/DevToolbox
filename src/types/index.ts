/**
 * 全局类型定义
 *
 * TypeScript 严格模式（strict + noUncheckedIndexedAccess），零 any。
 * 所有工具的输入输出类型、应用设置、历史记录、通知等均在此声明。
 * 按功能分区：应用基础 / 工具特定 / 帮助内容。
 */

// === 应用基础类型 ===

/** 主题模式：明色 / 暗色 */
export type ThemeMode = 'light' | 'dark'

/** 界面语言：简体中文 / 美式英文 */
export type AppLocale = 'zh-CN' | 'en-US'

/** 工具分类 ID，用于侧边栏分组 */
export type ToolCategory = 'data' | 'encoding' | 'time' | 'dev' | 'text'

/** Monaco Editor 支持的语言标识 */
export type MonacoLanguage = 'json' | 'javascript' | 'typescript' | 'plaintext' | 'html'

/** 工具元数据定义，注册于 constants.ts 的 TOOLS 数组 */
export interface ToolDefinition {
  /** 工具唯一 ID（如 'json'），同时作为路由路径 */
  id: string
  /** i18n key，运行时翻译为工具显示名 */
  name: string
  /** 侧边栏图标（文本缩写，如 '{}'、'B64'） */
  icon: string
  /** i18n key，工具描述 */
  description: string
  /** 所属分类 */
  category: ToolCategory
}

/** 收藏分组，用户可创建多个分组管理工具 */
export interface FavoritesGroup {
  /** 分组唯一 ID（genGroupId 生成） */
  id: string
  /** 分组显示名 */
  name: string
  /** 分组内收藏的工具 ID 列表 */
  toolIds: string[]
  /** 侧边栏中是否折叠 */
  collapsed: boolean
}

/** 应用设置，持久化于 localStorage */
export interface AppSettings {
  theme: ThemeMode
  locale: AppLocale
  sidebarCollapsed: boolean
  favoritesGroups: FavoritesGroup[]
  /** 最近使用工具 ID 列表（最多 5 个，最新在前） */
  recentTools: string[]
}

/** 历史记录条目，持久化于 IndexedDB */
export interface HistoryItem {
  /** 自增主键（IndexedDB 自动生成） */
  id?: number
  /** 工具 ID */
  tool: string
  /** 输入快照 */
  input: string
  /** 输出快照 */
  output: string
  /** 创建时间 */
  createdAt: Date
}

// === 通知 ===

/** 通知类型：成功 / 错误 / 信息 / 警告，决定显示样式与自动消失时长 */
export type NotificationType = 'success' | 'error' | 'info' | 'warning'

/** Toast 通知条目，由 notificationStore 管理 */
export interface NotificationItem {
  /** 自增 ID，用于定位删除 */
  id: number
  type: NotificationType
  /** 通知正文 */
  message: string
}

// === 哈希计算 ===

/** 支持的哈希算法，均为 Web Crypto API 原生支持 */
export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

/** 单个算法的哈希结果 */
export interface HashResult {
  algorithm: HashAlgorithm
  /** 十六进制哈希值 */
  hash: string
}

// === 文本差异对比 ===

/** 差异对比粒度：按行 / 按字符 / 按单词 */
export type DiffMode = 'line' | 'char' | 'word'

/** 差异片段，三类组合渲染出带高亮的对比视图 */
export interface DiffSegment {
  /** equal=相同 / insert=新增 / delete=删除 */
  type: 'equal' | 'insert' | 'delete'
  /** 该片段的文本内容 */
  text: string
}

// === 颜色转换 ===

/** 颜色格式：十六进制 / RGB / HSL / HSV */
export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsv'

/** RGB 颜色，各通道 0-255 */
export interface RGBColor {
  r: number
  g: number
  b: number
}

/** HSL 颜色：色相 0-360，饱和度/亮度 0-100 */
export interface HSLColor {
  h: number
  s: number
  l: number
}

/** HSV 颜色：色相 0-360，饱和度/明度 0-100 */
export interface HSVColor {
  h: number
  s: number
  v: number
}

/** 颜色完整信息，包含四种格式表示 */
export interface ColorInfo {
  hex: string
  rgb: RGBColor
  hsl: HSLColor
  hsv: HSVColor
}

// === 正则表达式 ===

/** 单个正则匹配结果 */
export interface RegexMatch {
  /** 匹配到的文本 */
  text: string
  /** 在原字符串中的起始索引 */
  index: number
  /** 捕获组内容（索引 0 为完整匹配） */
  groups: string[]
}

// === JWT 解析 ===

/** JWT 解码后的结构化载荷 */
export interface JwtPayload {
  /** 头部（算法、类型等） */
  header: Record<string, unknown>
  /** 业务载荷 */
  payload: Record<string, unknown>
  /** 签名部分（Base64Url） */
  signature: string
  /** 过期时间（Unix 秒） */
  exp?: number
  /** 签发时间（Unix 秒） */
  iat?: number
  /** 生效时间（Unix 秒） */
  nbf?: number
  /** 签发者 */
  iss?: string
  /** 受众 */
  aud?: string | string[]
}

// === 通用校验结果 ===

/** 语法校验结果，用于 JSON/SQL/HTML 等工具 */
export interface ValidationResult {
  /** 是否通过 */
  ok: boolean
  /** 错误信息 */
  error?: string
  /** 错误所在行号（1-based） */
  line?: number
  /** 错误所在列号（1-based） */
  column?: number
}

// === UUID 生成器 ===

/** UUID 版本：v4 随机 / v1 时间戳 / nil 全零占位 */
export type UuidVersion = 'v4' | 'v1' | 'nil'

/** UUID 生成选项 */
export interface UuidOptions {
  version: UuidVersion
  /** 生成数量 */
  count: number
  /** 是否包含连字符（如 550e8400-e29b-...） */
  hyphen: boolean
  /** 是否转大写 */
  uppercase: boolean
}

// === 密码生成器 ===

/** 密码生成选项 */
export interface PasswordOptions {
  /** 密码长度 */
  length: number
  /** 包含大写字母 */
  upper: boolean
  /** 包含小写字母 */
  lower: boolean
  /** 包含数字 */
  digits: boolean
  /** 包含符号 */
  symbols: boolean
  /** 排除易混淆字符（0/O/1/l/I 等） */
  excludeAmbiguous: boolean
  /** 生成数量 */
  count: number
}

/** 密码强度评分：0 最弱 ~ 4 最强 */
export type PasswordScore = 0 | 1 | 2 | 3 | 4

/** 密码强度评估结果 */
export interface PasswordStrength {
  score: PasswordScore
  /** 熵值（bits），越高越安全 */
  entropy: number
}

// === 二维码生成器 ===

/** 二维码纠错等级：L 7% / M 15% / Q 25% / H 30% */
export type QrErrorLevel = 'L' | 'M' | 'Q' | 'H'

/** 二维码生成选项 */
export interface QrOptions {
  /** 图片尺寸（像素） */
  size: number
  /** 边距（模块数） */
  margin: number
  level: QrErrorLevel
  /** 暗色模块颜色（hex） */
  dark: string
  /** 亮色模块颜色（hex） */
  light: string
}

// === API Tester ===

/** HTTP 请求方法 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

/** 请求体类型 */
export type BodyType = 'none' | 'json' | 'form' | 'urlencoded' | 'text'

/** 键值对（请求头、查询参数、表单字段通用） */
export interface KeyValue {
  key: string
  value: string
  /** 是否启用该条目 */
  enabled: boolean
}

/** HTTP 响应结构化结果 */
export interface ApiResponse {
  /** HTTP 状态码 */
  status: number
  statusText: string
  /** 响应头（键值对） */
  headers: Record<string, string>
  /** 响应体原文 */
  body: string
  /** 请求耗时（毫秒） */
  duration: number
  /** 响应体大小（字节） */
  size: number
  /** 错误信息（请求失败时） */
  error?: string
  /** 错误分类 */
  errorType?: 'timeout' | 'network' | 'cors' | 'unknown'
}

// === Cron 表达式 ===

/** 下次执行时间 */
export interface CronNextRun {
  date: Date
  /** 本地化格式化字符串 */
  formatted: string
}

/** Cron 字段描述（用于人话翻译展示） */
export interface CronFieldDesc {
  /** 字段名（分/时/日/月/周） */
  name: string
  /** 字段原始值 */
  value: string
  /** 含义的 i18n key */
  meaningKey: string
  /** i18n 插值参数 */
  meaningParams?: Record<string, string>
}

// === Unicode 字符 ===

/** Unicode 字符分类 */
export type UnicodeCategory =
  | 'uppercase'
  | 'lowercase'
  | 'digit'
  | 'space'
  | 'punctuation'
  | 'symbol'
  | 'cjk'
  | 'control'
  | 'other'

/** 单个字符的 Unicode 分析结果 */
export interface UnicodeCharInfo {
  /** 字符本身 */
  char: string
  /** 码点（十进制） */
  codePoint: number
  /** UTF-8 编码字节序列 */
  utf8: number[]
  /** UTF-16 编码单元序列 */
  utf16: number[]
  category: UnicodeCategory
  /** 字符名称（若可识别） */
  name?: string
}

// === 工具帮助内容 ===

/** 帮助提示类型：信息 / 警告 / 技巧，决定图标与配色 */
export type HelpNoteType = 'info' | 'warning' | 'tip'

/** 帮助步骤 */
export interface HelpStep {
  /** 步骤标题 */
  title: string
  /** 步骤详细说明 */
  detail: string
}

/** 帮助提示条目 */
export interface HelpNote {
  type: HelpNoteType
  /** 提示正文 */
  text: string
}
