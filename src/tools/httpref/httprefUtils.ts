/**
 * HTTP 参考资料工具集
 *
 * - 内置 HTTP 状态码（1xx-5xx）对照表及分类
 * - 内置 HTTP 方法（GET/POST/PUT 等）安全性与幂等性说明
 * - 内置常用 HTTP 请求/响应/实体头字段参考
 */
export interface HttpStatus {
  code: number
  text: string
  descKey: string
}

export interface HttpMethodRef {
  name: string
  safe: boolean
  idempotent: boolean
  hasBody: boolean
  descKey: string
}

export interface HttpHeaderRef {
  name: string
  category: 'general' | 'request' | 'response' | 'entity'
  descKey: string
}

// 1xx - 信息
// 2xx - 成功
// 3xx - 重定向
// 4xx - 客户端错误
// 5xx - 服务端错误
export const HTTP_STATUS_CODES: HttpStatus[] = [
  { code: 100, text: 'Continue', descKey: 'tools.httpref.status.100' },
  { code: 101, text: 'Switching Protocols', descKey: 'tools.httpref.status.101' },
  { code: 200, text: 'OK', descKey: 'tools.httpref.status.200' },
  { code: 201, text: 'Created', descKey: 'tools.httpref.status.201' },
  { code: 202, text: 'Accepted', descKey: 'tools.httpref.status.202' },
  { code: 204, text: 'No Content', descKey: 'tools.httpref.status.204' },
  { code: 206, text: 'Partial Content', descKey: 'tools.httpref.status.206' },
  { code: 301, text: 'Moved Permanently', descKey: 'tools.httpref.status.301' },
  { code: 302, text: 'Found', descKey: 'tools.httpref.status.302' },
  { code: 304, text: 'Not Modified', descKey: 'tools.httpref.status.304' },
  { code: 307, text: 'Temporary Redirect', descKey: 'tools.httpref.status.307' },
  { code: 308, text: 'Permanent Redirect', descKey: 'tools.httpref.status.308' },
  { code: 400, text: 'Bad Request', descKey: 'tools.httpref.status.400' },
  { code: 401, text: 'Unauthorized', descKey: 'tools.httpref.status.401' },
  { code: 403, text: 'Forbidden', descKey: 'tools.httpref.status.403' },
  { code: 404, text: 'Not Found', descKey: 'tools.httpref.status.404' },
  { code: 405, text: 'Method Not Allowed', descKey: 'tools.httpref.status.405' },
  { code: 408, text: 'Request Timeout', descKey: 'tools.httpref.status.408' },
  { code: 409, text: 'Conflict', descKey: 'tools.httpref.status.409' },
  { code: 410, text: 'Gone', descKey: 'tools.httpref.status.410' },
  { code: 413, text: 'Payload Too Large', descKey: 'tools.httpref.status.413' },
  { code: 415, text: 'Unsupported Media Type', descKey: 'tools.httpref.status.415' },
  { code: 418, text: "I'm a teapot", descKey: 'tools.httpref.status.418' },
  { code: 422, text: 'Unprocessable Entity', descKey: 'tools.httpref.status.422' },
  { code: 429, text: 'Too Many Requests', descKey: 'tools.httpref.status.429' },
  { code: 500, text: 'Internal Server Error', descKey: 'tools.httpref.status.500' },
  { code: 501, text: 'Not Implemented', descKey: 'tools.httpref.status.501' },
  { code: 502, text: 'Bad Gateway', descKey: 'tools.httpref.status.502' },
  { code: 503, text: 'Service Unavailable', descKey: 'tools.httpref.status.503' },
  { code: 504, text: 'Gateway Timeout', descKey: 'tools.httpref.status.504' },
]

export const HTTP_METHODS: HttpMethodRef[] = [
  { name: 'GET', safe: true, idempotent: true, hasBody: false, descKey: 'tools.httpref.methods.GET' },
  { name: 'POST', safe: false, idempotent: false, hasBody: true, descKey: 'tools.httpref.methods.POST' },
  { name: 'PUT', safe: false, idempotent: true, hasBody: true, descKey: 'tools.httpref.methods.PUT' },
  { name: 'DELETE', safe: false, idempotent: true, hasBody: false, descKey: 'tools.httpref.methods.DELETE' },
  { name: 'PATCH', safe: false, idempotent: false, hasBody: true, descKey: 'tools.httpref.methods.PATCH' },
  { name: 'HEAD', safe: true, idempotent: true, hasBody: false, descKey: 'tools.httpref.methods.HEAD' },
  { name: 'OPTIONS', safe: true, idempotent: true, hasBody: false, descKey: 'tools.httpref.methods.OPTIONS' },
  { name: 'TRACE', safe: true, idempotent: true, hasBody: false, descKey: 'tools.httpref.methods.TRACE' },
  { name: 'CONNECT', safe: false, idempotent: false, hasBody: false, descKey: 'tools.httpref.methods.CONNECT' },
]

export const HTTP_HEADERS: HttpHeaderRef[] = [
  { name: 'Authorization', category: 'request', descKey: 'tools.httpref.headers.Authorization' },
  { name: 'Accept', category: 'request', descKey: 'tools.httpref.headers.Accept' },
  { name: 'Accept-Encoding', category: 'request', descKey: 'tools.httpref.headers.AcceptEncoding' },
  { name: 'Accept-Language', category: 'request', descKey: 'tools.httpref.headers.AcceptLanguage' },
  { name: 'Cache-Control', category: 'general', descKey: 'tools.httpref.headers.CacheControl' },
  { name: 'Cookie', category: 'request', descKey: 'tools.httpref.headers.Cookie' },
  { name: 'Content-Type', category: 'entity', descKey: 'tools.httpref.headers.ContentType' },
  { name: 'Content-Length', category: 'entity', descKey: 'tools.httpref.headers.ContentLength' },
  { name: 'Content-Encoding', category: 'entity', descKey: 'tools.httpref.headers.ContentEncoding' },
  { name: 'Date', category: 'general', descKey: 'tools.httpref.headers.Date' },
  { name: 'ETag', category: 'response', descKey: 'tools.httpref.headers.ETag' },
  { name: 'Host', category: 'request', descKey: 'tools.httpref.headers.Host' },
  { name: 'If-Modified-Since', category: 'request', descKey: 'tools.httpref.headers.IfModifiedSince' },
  { name: 'If-None-Match', category: 'request', descKey: 'tools.httpref.headers.IfNoneMatch' },
  { name: 'Location', category: 'response', descKey: 'tools.httpref.headers.Location' },
  { name: 'Origin', category: 'request', descKey: 'tools.httpref.headers.Origin' },
  { name: 'Referer', category: 'request', descKey: 'tools.httpref.headers.Referer' },
  { name: 'Set-Cookie', category: 'response', descKey: 'tools.httpref.headers.SetCookie' },
  { name: 'User-Agent', category: 'request', descKey: 'tools.httpref.headers.UserAgent' },
  { name: 'Vary', category: 'response', descKey: 'tools.httpref.headers.Vary' },
  { name: 'WWW-Authenticate', category: 'response', descKey: 'tools.httpref.headers.WWWAuthenticate' },
  { name: 'X-Forwarded-For', category: 'request', descKey: 'tools.httpref.headers.XForwardedFor' },
]

export function statusCategory(code: number): 'info' | 'success' | 'redirect' | 'client' | 'server' {
  if (code < 200) return 'info'
  if (code < 300) return 'success'
  if (code < 400) return 'redirect'
  if (code < 500) return 'client'
  return 'server'
}
