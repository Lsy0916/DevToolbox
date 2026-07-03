/**
 * 文本差异比较工具集
 *
 * - 基于 diff-match-patch 提供字符级差异比较
 * - 支持按行、按词的差异比较与统计
 * - 提供 unified diff 格式输出及文本相等性判断
 */
import DiffMatchPatch from 'diff-match-patch'
import type { DiffSegment } from '@/types'

const dmp = new DiffMatchPatch()

export function diffChars(text1: string, text2: string): DiffSegment[] {
  const diffs = dmp.diff_main(text1, text2)
  dmp.diff_cleanupSemantic(diffs)
  return diffs.map(([op, text]) => ({
    type: op === 0 ? 'equal' : op === 1 ? 'insert' : 'delete',
    text,
  }))
}

export function diffLines(text1: string, text2: string): DiffSegment[] {
  const lines1 = text1.split('\n')
  const lines2 = text2.split('\n')
  const result: DiffSegment[] = []
  const maxLen = Math.max(lines1.length, lines2.length)

  for (let i = 0; i < maxLen; i++) {
    const l1 = lines1[i] ?? ''
    const l2 = lines2[i] ?? ''
    if (l1 === l2) {
      result.push({ type: 'equal', text: l1 })
    } else {
      if (l1) result.push({ type: 'delete', text: l1 })
      if (l2) result.push({ type: 'insert', text: l2 })
    }
  }
  return result
}

export interface DiffStats {
  additions: number
  deletions: number
  unchanged: number
}

export function getDiffStats(segments: DiffSegment[]): DiffStats {
  let additions = 0
  let deletions = 0
  let unchanged = 0
  for (const seg of segments) {
    if (seg.type === 'insert') additions++
    else if (seg.type === 'delete') deletions++
    else unchanged++
  }
  return { additions, deletions, unchanged }
}

// 按词差异（以空白分隔的词为单位）
export function diffWords(text1: string, text2: string): DiffSegment[] {
  const words1 = text1.split(/(\s+)/)
  const words2 = text2.split(/(\s+)/)
  const result: DiffSegment[] = []
  const maxLen = Math.max(words1.length, words2.length)
  for (let i = 0; i < maxLen; i++) {
    const w1 = words1[i] ?? ''
    const w2 = words2[i] ?? ''
    if (w1 === w2) {
      result.push({ type: 'equal', text: w1 })
    } else {
      if (w1) result.push({ type: 'delete', text: w1 })
      if (w2) result.push({ type: 'insert', text: w2 })
    }
  }
  return result
}

// 生成 unified diff 格式文本
export function formatUnifiedDiff(segments: DiffSegment[]): string {
  const lines: string[] = []
  for (const seg of segments) {
    const prefix = seg.type === 'insert' ? '+' : seg.type === 'delete' ? '-' : ' '
    const segLines = seg.text.split('\n')
    for (const line of segLines) {
      lines.push(`${prefix}${line}`)
    }
  }
  return lines.join('\n')
}

// 忽略首尾空白后比较是否相等
export function areTextsEqual(t1: string, t2: string, ignoreWhitespace: boolean = false): boolean {
  if (ignoreWhitespace) {
    return t1.replace(/\s+/g, ' ').trim() === t2.replace(/\s+/g, ' ').trim()
  }
  return t1 === t2
}
