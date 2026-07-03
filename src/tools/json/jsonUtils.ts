/**
 * JSON 格式化与转换工具集
 *
 * - 提供 JSON 的格式化、压缩、校验、转义/反转义功能
 * - 支持 JSON ⇄ YAML 互转、递归排序键、删除空字段
 * - 支持简易 JSONPath 查询（$.a.b[0].c 格式）
 */
import * as yaml from 'js-yaml'
import type { ValidationResult } from '@/types'

export function formatJson(input: string): string {
  const obj = JSON.parse(input)
  return JSON.stringify(obj, null, 2)
}

export function minifyJson(input: string): string {
  const obj = JSON.parse(input)
  return JSON.stringify(obj)
}

export function validateJson(input: string): ValidationResult {
  if (!input.trim()) {
    return { ok: false, error: 'Empty input' }
  }
  try {
    JSON.parse(input)
    return { ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    const lineMatch = message.match(/position (\d+)/)
    if (lineMatch) {
      const pos = parseInt(lineMatch[1]!, 10)
      const before = input.slice(0, pos)
      const line = before.split('\n').length
      const column = pos - before.lastIndexOf('\n')
      return { ok: false, error: message, line, column }
    }
    return { ok: false, error: message }
  }
}

export function escapeJson(input: string): string {
  return JSON.stringify(input).slice(1, -1)
}

export function unescapeJson(input: string): string {
  const result = JSON.parse(`"${input}"`)
  return typeof result === 'string' ? result : String(result)
}

// JSON ⇄ YAML 互转
export function jsonToYaml(input: string): string {
  const obj = JSON.parse(input)
  return yaml.dump(obj, { indent: 2, lineWidth: 120 })
}

export function yamlToJson(input: string): string {
  const obj = yaml.load(input)
  return JSON.stringify(obj, null, 2)
}

// 递归排序对象键（按字母序）
export function sortKeys(input: string): string {
  const obj = JSON.parse(input)
  return JSON.stringify(sortKeysDeep(obj), null, 2)
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep)
  if (value && typeof value === 'object') {
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortKeysDeep((value as Record<string, unknown>)[key])
    }
    return sorted
  }
  return value
}

// 递归删除空字段（null / '' / [] / {}）
export function removeEmptyFields(input: string): string {
  const obj = JSON.parse(input)
  return JSON.stringify(removeEmptyDeep(obj), null, 2)
}

function removeEmptyDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(removeEmptyDeep).filter((v) => !isEmpty(v))
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = removeEmptyDeep(v)
      if (!isEmpty(cleaned)) result[k] = cleaned
    }
    return result
  }
  return value
}

function isEmpty(v: unknown): boolean {
  return v === null || v === '' || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && v !== null && Object.keys(v).length === 0)
}

// 简化 JSONPath 查询：支持 $.a.b[0].c 格式，不支持通配符
export function queryJsonPath(input: string, path: string): string {
  const obj = JSON.parse(input)
  const tokens = path.replace(/^\$\.?/, '').split(/\.|\[(\d+)\]/).filter((t) => t !== '' && t !== undefined)
  let current: unknown = obj
  for (const token of tokens) {
    if (current === null || current === undefined) {
      throw new Error(`Cannot read property "${token}" of ${String(current)}`)
    }
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[token]
    } else {
      throw new Error(`Cannot access "${token}" on non-object`)
    }
  }
  return JSON.stringify(current, null, 2)
}
