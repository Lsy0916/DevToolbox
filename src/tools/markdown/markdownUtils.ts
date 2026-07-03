/**
 * Markdown 渲染与统计工具集
 *
 * - 基于 marked 将 Markdown 渲染为 HTML（支持 GFM）
 * - 支持去除 HTML 标签与实体还原为纯文本
 * - 支持中英文混合字数统计
 */
import { marked } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: false,
})

export function renderMarkdown(md: string): string {
  if (!md) return ''
  try {
    return marked.parse(md) as string
  } catch {
    return ''
  }
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function countWords(md: string): number {
  if (!md) return 0
  const text = stripHtml(renderMarkdown(md))
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const en = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[a-zA-Z0-9]+/g) || []).length
  return cjk + en
}
