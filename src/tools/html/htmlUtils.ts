/**
 * HTML 实体编解码与文本处理工具集
 *
 * - 提供 HTML 特殊字符的编解码及完整实体编码
 * - 内置常用 HTML 实体对照表（名称/十进制/十六进制）
 * - 支持去除 HTML 标签、统计实体数量
 */
const encodeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
}

export function encodeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (char) => encodeMap[char] ?? char)
}

export function decodeHtml(input: string): string {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = input
  return textarea.value
}

export interface HtmlEntity {
  char: string
  name: string
  decimal: string
  hex: string
}

export const HTML_ENTITIES: HtmlEntity[] = [
  { char: '&', name: '&amp;', decimal: '&#38;', hex: '&#x26;' },
  { char: '<', name: '&lt;', decimal: '&#60;', hex: '&#x3C;' },
  { char: '>', name: '&gt;', decimal: '&#62;', hex: '&#x3E;' },
  { char: '"', name: '&quot;', decimal: '&#34;', hex: '&#x22;' },
  { char: "'", name: '&#x27;', decimal: '&#39;', hex: '&#x27;' },
  { char: ' ', name: '&nbsp;', decimal: '&#160;', hex: '&#xA0;' },
  { char: '©', name: '&copy;', decimal: '&#169;', hex: '&#xA9;' },
  { char: '®', name: '&reg;', decimal: '&#174;', hex: '&#xAE;' },
  { char: '™', name: '&trade;', decimal: '&#8482;', hex: '&#x2122;' },
  { char: '—', name: '&mdash;', decimal: '&#8212;', hex: '&#x2014;' },
  { char: '–', name: '&ndash;', decimal: '&#8211;', hex: '&#x2013;' },
  { char: '…', name: '&hellip;', decimal: '&#8230;', hex: '&#x2026;' },
]

// 去除所有 HTML 标签，保留纯文本
export function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

// 完整实体编码：将所有非 ASCII 字符编码为 &#xNNNN; 十六进制实体
export function encodeFullEntities(input: string): string {
  return input.replace(/[^\x00-\x7F]/g, (ch) => {
    const code = ch.codePointAt(0)
    return code !== undefined ? `&#x${code.toString(16).toUpperCase()};` : ch
  })
}

// 统计文本中的 HTML 实体数量
export function countEntities(input: string): number {
  const matches = input.match(/&[#a-zA-Z0-9]+;/g)
  return matches ? matches.length : 0
}
