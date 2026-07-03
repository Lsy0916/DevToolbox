/**
 * 工具注册表与常量定义
 *
 * 此文件是 DevToolbox 的工具元数据中心，包含：
 * - TOOLS: 全部 26 个工具的定义（id/name/icon/description/category）
 * - REGEX_PRESETS: 正则工具的预设模式（邮箱、URL、IPv4 等）
 * - TOOL_CATEGORIES: 分类 ID 到 i18n key 的映射
 * - getToolById: 按 ID 查询工具定义
 *
 * 新增工具时需在此数组追加条目，并在 router.ts 注册路由、
 * 在 locale 文件补充对应的 i18n keys。
 */
import type { ToolDefinition } from '@/types'

export const TOOLS: ToolDefinition[] = [
  {
    id: 'json',
    name: 'tools.json.name',
    icon: '{}',
    description: 'tools.json.description',
    category: 'data',
  },
  {
    id: 'base64',
    name: 'tools.base64.name',
    icon: 'B64',
    description: 'tools.base64.description',
    category: 'encoding',
  },
  {
    id: 'jwt',
    name: 'tools.jwt.name',
    icon: 'JWT',
    description: 'tools.jwt.description',
    category: 'encoding',
  },
  {
    id: 'url',
    name: 'tools.url.name',
    icon: 'URL',
    description: 'tools.url.description',
    category: 'encoding',
  },
  {
    id: 'hash',
    name: 'tools.hash.name',
    icon: '#',
    description: 'tools.hash.description',
    category: 'encoding',
  },
  {
    id: 'regex',
    name: 'tools.regex.name',
    icon: '.*',
    description: 'tools.regex.description',
    category: 'text',
  },
  {
    id: 'timestamp',
    name: 'tools.timestamp.name',
    icon: 'TS',
    description: 'tools.timestamp.description',
    category: 'time',
  },
  {
    id: 'color',
    name: 'tools.color.name',
    icon: 'CLR',
    description: 'tools.color.description',
    category: 'dev',
  },
  {
    id: 'diff',
    name: 'tools.diff.name',
    icon: 'DIFF',
    description: 'tools.diff.description',
    category: 'text',
  },
  {
    id: 'html',
    name: 'tools.html.name',
    icon: '<>',
    description: 'tools.html.description',
    category: 'text',
  },
  {
    id: 'uuid',
    name: 'tools.uuid.name',
    icon: 'UID',
    description: 'tools.uuid.description',
    category: 'dev',
  },
  {
    id: 'password',
    name: 'tools.password.name',
    icon: '***',
    description: 'tools.password.description',
    category: 'dev',
  },
  {
    id: 'qrcode',
    name: 'tools.qrcode.name',
    icon: 'QR',
    description: 'tools.qrcode.description',
    category: 'encoding',
  },
  {
    id: 'api',
    name: 'tools.api.name',
    icon: 'API',
    description: 'tools.api.description',
    category: 'dev',
  },
  {
    id: 'crypto',
    name: 'tools.crypto.name',
    icon: 'AES',
    description: 'tools.crypto.description',
    category: 'encoding',
  },
  {
    id: 'cron',
    name: 'tools.cron.name',
    icon: 'CRON',
    description: 'tools.cron.description',
    category: 'time',
  },
  {
    id: 'json2ts',
    name: 'tools.json2ts.name',
    icon: 'TS',
    description: 'tools.json2ts.description',
    category: 'data',
  },
  {
    id: 'sql',
    name: 'tools.sql.name',
    icon: 'SQL',
    description: 'tools.sql.description',
    category: 'data',
  },
  {
    id: 'markdown',
    name: 'tools.markdown.name',
    icon: 'MD',
    description: 'tools.markdown.description',
    category: 'text',
  },
  {
    id: 'case',
    name: 'tools.case.name',
    icon: 'Aa',
    description: 'tools.case.description',
    category: 'text',
  },
  {
    id: 'radix',
    name: 'tools.radix.name',
    icon: '36',
    description: 'tools.radix.description',
    category: 'data',
  },
  {
    id: 'textstat',
    name: 'tools.textstat.name',
    icon: 'STAT',
    description: 'tools.textstat.description',
    category: 'text',
  },
  {
    id: 'lorem',
    name: 'tools.lorem.name',
    icon: 'LOREM',
    description: 'tools.lorem.description',
    category: 'text',
  },
  {
    id: 'unicode',
    name: 'tools.unicode.name',
    icon: 'U+',
    description: 'tools.unicode.description',
    category: 'encoding',
  },
  {
    id: 'httpref',
    name: 'tools.httpref.name',
    icon: 'HTTP',
    description: 'tools.httpref.description',
    category: 'dev',
  },
  {
    id: 'data-manager',
    name: 'tools.datamanager.name',
    icon: 'DATA',
    description: 'tools.datamanager.description',
    category: 'dev',
  },
]

/** 正则预设模式，供 Regex 工具快速选择 */
export interface RegexPreset {
  /** 预设名称（英文标识，由 i18n 翻译显示） */
  name: string
  /** 正则表达式源码 */
  pattern: string
  /** 正则标志（g/i/m 等） */
  flags: string
  /** 用途说明 */
  description: string
}

/** 正则工具内置预设：邮箱、URL、IPv4、手机号、身份证、中文、十六进制颜色 */
export const REGEX_PRESETS: RegexPreset[] = [
  {
    name: 'Email',
    pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.-]+',
    flags: 'g',
    description: 'Match standard email addresses',
  },
  {
    name: 'URL',
    pattern: 'https?://[^\\s]+',
    flags: 'g',
    description: 'Match http(s) URLs',
  },
  {
    name: 'IPv4',
    pattern:
      '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b',
    flags: 'g',
    description: 'Match IPv4 addresses',
  },
  {
    name: 'Phone (CN)',
    pattern: '1[3-9]\\d{9}',
    flags: 'g',
    description: 'Match Chinese mobile numbers',
  },
  {
    name: 'ID Card (CN)',
    pattern: '\\d{17}[\\dXx]',
    flags: 'g',
    description: 'Match Chinese ID card numbers',
  },
  {
    name: 'Chinese',
    pattern: '[\\u4e00-\\u9fa5]+',
    flags: 'g',
    description: 'Match Chinese characters',
  },
  {
    name: 'Hex Color',
    pattern: '#(?:[0-9a-fA-F]{3}){1,2}',
    flags: 'g',
    description: 'Match hex color codes',
  },
]

/** 分类 ID 到 i18n key 的映射，用于侧边栏分类标题翻译 */
export const TOOL_CATEGORIES: Record<string, string> = {
  data: 'category.data',
  encoding: 'category.encoding',
  time: 'category.time',
  dev: 'category.dev',
  text: 'category.text',
}

/**
 * 按 ID 查询工具定义。
 * @param id - 工具 ID（如 'json'、'base64'）
 * @returns 工具定义，未找到返回 undefined
 */
export function getToolById(id: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.id === id)
}
