/**
 * JWT (JSON Web Token) 解析与生成工具集
 *
 * - 支持 JWT 的解析、HS256 签名生成与验证
 * - 提供标准 claims 含义解释及过期状态检查
 * - 包含 base64url 编解码与剩余时间格式化
 */
import HmacSHA256 from 'crypto-js/hmac-sha256'
import Base64 from 'crypto-js/enc-base64'
import type { JwtPayload } from '@/types'

export function decodeBase64Url(input: string): string {
  let str = input.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) {
    str += '='
  }
  return decodeURIComponent(escape(atob(str)))
}

// UTF-8 安全的 base64url 编码
function encodeBase64Url(str: string): string {
  const b64 = btoa(unescape(encodeURIComponent(str)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// 验证 HS256 签名
export function verifyHs256(token: string, secret: string): boolean {
  const cleanToken = token.replace(/^Bearer\s+/, '').trim()
  const parts = cleanToken.split('.')
  if (parts.length !== 3) return false
  const [header, payload, signature] = parts as [string, string, string]
  const expected = HmacSHA256(`${header}.${payload}`, secret)
    .toString(Base64)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return expected === signature
}

// 生成 HS256 JWT
export function generateJwt(payload: object, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const headerB64 = encodeBase64Url(JSON.stringify(header))
  const payloadB64 = encodeBase64Url(JSON.stringify(payload))
  const signature = HmacSHA256(`${headerB64}.${payloadB64}`, secret)
    .toString(Base64)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `${headerB64}.${payloadB64}.${signature}`
}

// 标准 claims 含义解释表
const CLAIM_DESCRIPTIONS: Record<string, string> = {
  sub: 'Subject (主体)',
  aud: 'Audience (受众)',
  iss: 'Issuer (签发者)',
  exp: 'Expiration Time (过期时间)',
  iat: 'Issued At (签发时间)',
  nbf: 'Not Before (生效时间)',
  scope: 'Scopes (授权范围)',
  roles: 'Roles (角色)',
  jti: 'JWT ID (唯一标识)',
}

export function explainClaims(parsed: JwtPayload): Array<{ key: string; value: string; desc: string }> {
  const result: Array<{ key: string; value: string; desc: string }> = []
  const payload = parsed.payload
  for (const [key, value] of Object.entries(payload)) {
    const desc = CLAIM_DESCRIPTIONS[key] ?? ''
    let valueStr: string
    if (typeof value === 'number') {
      valueStr = String(value)
    } else if (typeof value === 'string') {
      valueStr = value
    } else {
      valueStr = JSON.stringify(value)
    }
    result.push({ key, value: valueStr, desc })
  }
  return result
}

export function parseJwt(token: string): JwtPayload {
  const cleanToken = token.replace(/^Bearer\s+/, '').trim()
  const parts = cleanToken.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format: expected 3 parts separated by dots')
  }

  const [headerB64, payloadB64, signature] = parts as [string, string, string]

  let header: Record<string, unknown>
  let payload: Record<string, unknown>

  try {
    header = JSON.parse(decodeBase64Url(headerB64)) as Record<string, unknown>
  } catch {
    throw new Error('Failed to decode JWT header')
  }

  try {
    payload = JSON.parse(decodeBase64Url(payloadB64)) as Record<string, unknown>
  } catch {
    throw new Error('Failed to decode JWT payload')
  }

  const result: JwtPayload = {
    header,
    payload,
    signature,
  }

  if (typeof payload.exp === 'number') result.exp = payload.exp
  if (typeof payload.iat === 'number') result.iat = payload.iat
  if (typeof payload.nbf === 'number') result.nbf = payload.nbf
  if (typeof payload.iss === 'string') result.iss = payload.iss
  if (payload.aud !== undefined) {
    if (typeof payload.aud === 'string') result.aud = payload.aud
    else if (Array.isArray(payload.aud)) result.aud = payload.aud.filter((a): a is string => typeof a === 'string')
  }

  return result
}

export interface JwtStatus {
  isExpired: boolean
  willExpireSoon: boolean
  expiryDate: Date | null
  remainingSeconds: number | null
}

export function getJwtStatus(parsed: JwtPayload): JwtStatus {
  if (!parsed.exp) {
    return { isExpired: false, willExpireSoon: false, expiryDate: null, remainingSeconds: null }
  }
  const now = Date.now()
  const expiryMs = parsed.exp * 1000
  const isExpired = now > expiryMs
  const remainingSeconds = Math.floor((expiryMs - now) / 1000)
  const willExpireSoon = !isExpired && remainingSeconds < 3600
  return {
    isExpired,
    willExpireSoon,
    expiryDate: new Date(expiryMs),
    remainingSeconds,
  }
}

export function formatRemainingTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
}
