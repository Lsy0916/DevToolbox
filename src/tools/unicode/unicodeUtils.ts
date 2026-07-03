/**
 * Unicode 字符分析工具集
 *
 * - 逐字符分析文本，输出码点、UTF-8/UTF-16 编码及字符分类
 * - 正确处理代理对，支持 CJK、标点、控制符等类别识别
 * - 提供码点与字节的格式化输出
 */
import type { UnicodeCharInfo, UnicodeCategory } from '@/types'

function categorize(char: string): UnicodeCategory {
  if (!char) return 'other'
  const cp = char.codePointAt(0) ?? 0
  if (cp < 0x20 || cp === 0x7F) return 'control'
  if (/[\u4e00-\u9fff]/.test(char)) return 'cjk'
  if (/\s/.test(char)) return 'space'
  if (/[0-9]/.test(char)) return 'digit'
  if (/[A-Z]/.test(char)) return 'uppercase'
  if (/[a-z]/.test(char)) return 'lowercase'
  // 标点
  if (/[\u3000-\u303F\uFF00-\uFFEF!-/:-@\[-`{-~]/.test(char)) return 'punctuation'
  // 其余非 ASCII 多为符号
  if (cp > 0x80) return 'symbol'
  return 'other'
}

export function analyzeChars(text: string): UnicodeCharInfo[] {
  if (!text) return []
  // 按 code point 遍历（正确处理代理对）
  const chars = Array.from(text)
  return chars.map((char) => {
    const codePoint = char.codePointAt(0) ?? 0
    const encoder = new TextEncoder()
    const utf8 = Array.from(encoder.encode(char))
    // UTF-16 单元（代理对为两个）
    const utf16: number[] = []
    for (let i = 0; i < char.length; i++) {
      utf16.push(char.charCodeAt(i))
    }
    return {
      char,
      codePoint,
      utf8,
      utf16,
      category: categorize(char),
    }
  })
}

export function formatCodePoint(cp: number): string {
  const hex = cp.toString(16).toUpperCase()
  return cp > 0xFFFF ? `U+${hex.padStart(6, '0')}` : `U+${hex.padStart(4, '0')}`
}

export function formatBytes(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')
}
