/**
 * URL 解析与编解码工具集
 *
 * - 提供 URL 的解析、组件/整体编解码
 * - 支持查询参数的解析与基于参数列表的 URL 重建
 * - 提供 URL 安全性检查（协议、IDN、用户信息、非标准端口）
 */
export interface ParsedUrl {
  protocol: string
  host: string
  hostname: string
  port: string
  pathname: string
  search: string
  hash: string
  origin: string
}

export type EncodeMode = 'component' | 'uri'

// 按编码模式编解码：component 用 encodeURIComponent，uri 用 encodeURI
export function encodeUrlByMode(input: string, mode: EncodeMode): string {
  return mode === 'uri' ? encodeURI(input) : encodeURIComponent(input)
}

export function decodeUrlByMode(input: string, mode: EncodeMode): string {
  return mode === 'uri' ? decodeURI(input) : decodeURIComponent(input)
}

export function parseUrl(input: string): ParsedUrl {
  const url = new URL(input)
  return {
    protocol: url.protocol,
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    origin: url.origin,
  }
}

export function parseQuery(input: string): Array<{ key: string; value: string }> {
  const search = input.includes('?') ? input.split('?')[1] ?? '' : input
  const params = new URLSearchParams(search)
  const result: Array<{ key: string; value: string }> = []
  params.forEach((value, key) => {
    result.push({ key, value })
  })
  return result
}

// 用 base + 参数列表重建 URL
export function rebuildUrlWithQuery(base: string, params: Array<{ key: string; value: string }>): string {
  try {
    const url = new URL(base)
    url.search = ''
    const sp = new URLSearchParams()
    for (const p of params) {
      if (p.key) sp.append(p.key, p.value)
    }
    url.search = sp.toString()
    return url.toString()
  } catch {
    const search = params.length && params.some((p) => p.key)
      ? '?' + new URLSearchParams(params.filter((p) => p.key).map((p) => [p.key, p.value])).toString()
      : ''
    return `${base}${search}`
  }
}

// URL 安全性检查
export function checkUrlSafety(url: string): { safe: boolean; reasons: string[] } {
  const reasons: string[] = []
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { safe: false, reasons: ['invalid'] }
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    reasons.push('unknownProtocol')
  }
  if (parsed.hostname.includes('xn--')) {
    reasons.push('idnDetected')
  }
  if (parsed.username || parsed.password) {
    reasons.push('userInfoDetected')
  }
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    reasons.push('nonStdPort')
  }
  return { safe: reasons.length === 0, reasons }
}
