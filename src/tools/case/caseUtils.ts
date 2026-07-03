/**
 * 文本大小写转换工具集
 *
 * - 支持大写、小写、标题、句子、驼峰、帕斯卡等多种命名风格转换
 * - 内置词元拆分，兼容 camelCase / snake_case / kebab-case 及 CJK 字符
 * - 提供大小写反转与常用模式列表
 */
export type CaseMode =
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'constant'
  | 'invert'

export const CASE_MODES: { value: CaseMode; labelKey: string }[] = [
  { value: 'upper', labelKey: 'tools.case.modes.upper' },
  { value: 'lower', labelKey: 'tools.case.modes.lower' },
  { value: 'title', labelKey: 'tools.case.modes.title' },
  { value: 'sentence', labelKey: 'tools.case.modes.sentence' },
  { value: 'camel', labelKey: 'tools.case.modes.camel' },
  { value: 'pascal', labelKey: 'tools.case.modes.pascal' },
  { value: 'snake', labelKey: 'tools.case.modes.snake' },
  { value: 'kebab', labelKey: 'tools.case.modes.kebab' },
  { value: 'constant', labelKey: 'tools.case.modes.constant' },
  { value: 'invert', labelKey: 'tools.case.modes.invert' },
]

// 将文本拆分为词单元（支持 camelCase / snake_case / kebab-case / 空格 / CJK 单字）
function tokenize(text: string): string[] {
  if (!text) return []
  // 在大小写边界、非字母数字处拆分；CJK 每字单独
  const pieces = text
    .replace(/([a-z])([A-Z])/g, '$1\0$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1\0$2')
    .split(/[\s_\-\.]+|\0+/)
    .filter(Boolean)
  // 把 CJK 字符拆成单字词
  const result: string[] = []
  for (const p of pieces) {
    const cjk = p.match(/[\u4e00-\u9fa5]+|[a-zA-Z0-9]+/g)
    if (cjk) {
      for (const seg of cjk) {
        if (/[\u4e00-\u9fa5]/.test(seg)) {
          for (const ch of seg) result.push(ch)
        } else {
          result.push(seg)
        }
      }
    }
  }
  return result.length ? result : [text]
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s
}

export function convertCase(text: string, mode: CaseMode): string {
  if (!text) return ''
  switch (mode) {
    case 'upper':
      return text.toUpperCase()
    case 'lower':
      return text.toLowerCase()
    case 'title':
      return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    case 'sentence': {
      const lower = text.toLowerCase()
      return lower.replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase())
    }
    case 'camel': {
      const words = tokenize(text)
      return words.map((w, i) => i === 0 ? w.toLowerCase() : capitalize(w)).join('')
    }
    case 'pascal': {
      const words = tokenize(text)
      return words.map((w) => capitalize(w)).join('')
    }
    case 'snake':
      return tokenize(text).map((w) => w.toLowerCase()).join('_')
    case 'kebab':
      return tokenize(text).map((w) => w.toLowerCase()).join('-')
    case 'constant':
      return tokenize(text).map((w) => w.toUpperCase()).join('_')
    case 'invert':
      return text.replace(/[a-zA-Z]/g, (c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
    default:
      return text
  }
}
