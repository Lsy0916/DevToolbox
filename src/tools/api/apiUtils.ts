/**
 * HTTP API 请求测试工具集
 *
 * - 构建带查询参数的 URL、多种请求体（JSON/表单/URL 编码等）
 * - 执行 fetch 请求并处理超时、CORS、网络错误，返回统一响应
 * - 提供 cURL 命令生成、耗时/字节格式化与响应体语言检测
 */
import type { HttpMethod, BodyType, KeyValue, ApiResponse } from '@/types'

// 启用的键值对转换为对象
export function kvToObject(rows: KeyValue[]): Record<string, string> {
  const obj: Record<string, string> = {}
  for (const row of rows) {
    if (row.enabled && row.key) {
      obj[row.key] = row.value
    }
  }
  return obj
}

// 构建带查询参数的 URL
export function buildUrl(baseUrl: string, params: KeyValue[]): string {
  const enabled = params.filter((p) => p.enabled && p.key)
  if (!enabled.length) return baseUrl
  const query = enabled.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}${query}`
}

// 构建请求体
export function buildBody(
  bodyType: BodyType,
  bodyText: string,
  formRows: KeyValue[],
): { data: BodyInit | null; contentType?: string } {
  if (bodyType === 'none') return { data: null }
  if (bodyType === 'json') return { data: bodyText, contentType: 'application/json' }
  if (bodyType === 'text') return { data: bodyText, contentType: 'text/plain' }
  if (bodyType === 'urlencoded') {
    const obj = kvToObject(formRows)
    return { data: new URLSearchParams(obj).toString(), contentType: 'application/x-www-form-urlencoded' }
  }
  if (bodyType === 'form') {
    const fd = new FormData()
    for (const row of formRows) {
      if (row.enabled && row.key) fd.append(row.key, row.value)
    }
    return { data: fd }
  }
  return { data: null }
}

// 执行请求
export async function executeRequest(
  method: HttpMethod,
  url: string,
  headers: KeyValue[],
  bodyType: BodyType,
  bodyText: string,
  formRows: KeyValue[],
  timeoutMs: number = 30000,
): Promise<ApiResponse> {
  const startTime = performance.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const headerObj = kvToObject(headers)
    const { data, contentType } = buildBody(bodyType, bodyText, formRows)
    if (contentType && !Object.keys(headerObj).some((k) => k.toLowerCase() === 'content-type')) {
      headerObj['Content-Type'] = contentType
    }

    const response = await fetch(url, {
      method,
      headers: headerObj,
      body: data,
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeoutId)
    const duration = Math.round(performance.now() - startTime)

    const respHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      respHeaders[key] = value
    })

    const body = await response.text()
    const size = new Blob([body]).size

    return {
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders,
      body,
      duration,
      size,
    }
  } catch (e) {
    clearTimeout(timeoutId)
    const duration = Math.round(performance.now() - startTime)

    if (e instanceof DOMException && e.name === 'AbortError') {
      return {
        status: 0,
        statusText: '',
        headers: {},
        body: '',
        duration,
        size: 0,
        error: `Request timeout after ${timeoutMs}ms`,
        errorType: 'timeout',
      }
    }

    if (e instanceof TypeError) {
      const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false
      const errorType: 'network' | 'cors' = isOffline ? 'network' : 'cors'
      return {
        status: 0,
        statusText: '',
        headers: {},
        body: '',
        duration,
        size: 0,
        error: e.message || 'Network error',
        errorType,
      }
    }

    return {
      status: 0,
      statusText: '',
      headers: {},
      body: '',
      duration,
      size: 0,
      error: e instanceof Error ? e.message : 'Unknown error',
      errorType: 'unknown',
    }
  }
}

// 生成 cURL 命令
export function generateCurl(
  method: HttpMethod,
  url: string,
  headers: KeyValue[],
  bodyType: BodyType,
  bodyText: string,
  formRows: KeyValue[],
): string {
  const parts: string[] = [`curl -X ${method}`]

  const headerObj = kvToObject(headers)
  const { contentType } = buildBody(bodyType, bodyText, formRows)
  if (contentType && !Object.keys(headerObj).some((k) => k.toLowerCase() === 'content-type')) {
    headerObj['Content-Type'] = contentType
  }

  for (const [key, value] of Object.entries(headerObj)) {
    parts.push(`-H '${key}: ${value}'`)
  }

  if (bodyType === 'urlencoded') {
    const obj = kvToObject(formRows)
    const body = new URLSearchParams(obj).toString()
    parts.push(`-d '${body}'`)
  } else if (bodyType === 'form') {
    for (const row of formRows) {
      if (row.enabled && row.key) {
        parts.push(`-F '${row.key}=${row.value}'`)
      }
    }
  } else if ((bodyType === 'json' || bodyType === 'text') && bodyText) {
    parts.push(`-d '${bodyText.replace(/'/g, "'\\''")}'`)
  }

  parts.push(`'${url}'`)
  return parts.join(' \\\n  ')
}

// 格式化耗时
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// 格式化字节数
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
}

// 状态码分类
export function statusCategory(status: number): 'info' | 'success' | 'redirect' | 'client' | 'server' | 'error' {
  if (status === 0) return 'error'
  if (status < 200) return 'info'
  if (status < 300) return 'success'
  if (status < 400) return 'redirect'
  if (status < 500) return 'client'
  return 'server'
}

// 尝试美化 JSON 响应体
export function tryFormatJson(body: string): string {
  if (!body) return body
  try {
    return JSON.stringify(JSON.parse(body), null, 2)
  } catch {
    return body
  }
}

// 检测响应体语言（用于 Monaco 高亮）
export function detectBodyLanguage(body: string, contentType: string): 'json' | 'html' | 'plaintext' {
  const ct = contentType.toLowerCase()
  if (ct.includes('json')) return 'json'
  if (ct.includes('html')) return 'html'
  if (ct.includes('xml')) return 'html'
  // 尝试 JSON 探测
  const trimmed = body.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed)
      return 'json'
    } catch {
      // fallthrough
    }
  }
  if (trimmed.startsWith('<')) return 'html'
  return 'plaintext'
}
