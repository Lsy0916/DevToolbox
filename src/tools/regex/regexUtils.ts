/**
 * 正则表达式测试与处理工具集
 *
 * - 支持构建正则、全量匹配、替换操作
 * - 提供按匹配结果分割文本及捕获组提取
 * - 支持匹配数量统计
 */
import type { RegexMatch } from '@/types'

export interface BuildRegexResult {
  regex: RegExp | null
  error: string | null
}

export function buildRegex(pattern: string, flags: string): BuildRegexResult {
  if (!pattern) {
    return { regex: null, error: null }
  }
  try {
    const regex = new RegExp(pattern, flags)
    return { regex, error: null }
  } catch (e) {
    return {
      regex: null,
      error: e instanceof Error ? e.message : 'Invalid regular expression',
    }
  }
}

export function matchAll(text: string, regex: RegExp): RegexMatch[] {
  if (!text) return []
  const results: RegexMatch[] = []

  if (!regex.global) {
    const match = text.match(regex)
    if (match) {
      results.push({
        text: match[0],
        index: match.index ?? 0,
        groups: match.slice(1).map((g) => g ?? ''),
      })
    }
    return results
  }

  try {
    for (const match of text.matchAll(regex)) {
      results.push({
        text: match[0],
        index: match.index ?? 0,
        groups: match.slice(1).map((g) => g ?? ''),
      })
    }
  } catch {
    return []
  }
  return results
}

export function replaceAll(text: string, regex: RegExp, replacement: string): string {
  try {
    return text.replace(regex, replacement)
  } catch {
    return text
  }
}

export interface TextSegment {
  text: string
  matched: boolean
}

export function splitByMatches(text: string, matches: RegexMatch[]): TextSegment[] {
  if (!matches.length) {
    return text ? [{ text, matched: false }] : []
  }

  const segments: TextSegment[] = []
  let lastIndex = 0

  for (const match of matches) {
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        matched: false,
      })
    }
    segments.push({
      text: match.text,
      matched: true,
    })
    lastIndex = match.index + match.text.length
  }

  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      matched: false,
    })
  }

  return segments
}

// 提取所有匹配的捕获组（用于数据抽取）
export function extractGroups(text: string, regex: RegExp): string[][] {
  if (!text) return []
  const result: string[][] = []
  const matches = matchAll(text, regex)
  for (const m of matches) {
    if (m.groups.length) result.push(m.groups)
  }
  return result
}

// 统计匹配数量
export function countMatches(text: string, regex: RegExp): number {
  return matchAll(text, regex).length
}
