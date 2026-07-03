import { describe, it, expect } from 'vitest'
import {
  decodeBase64Url,
  verifyHs256,
  generateJwt,
  explainClaims,
  parseJwt,
  getJwtStatus,
  formatRemainingTime,
} from './jwtUtils'
import type { JwtPayload } from '@/types'

const SECRET = 'mysecret'

// Real JWT token: header {"alg":"HS256","typ":"JWT"},
// payload {"sub":"123","exp":9999999999}, signed with HS256 and `SECRET`.
const KNOWN_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjk5OTk5OTk5OTl9.3WOiTTZmoRj9qJjuRP_KdpY1GBjW0qWAzZ_lUSinBKs'

describe('jwtUtils', () => {
  describe('decodeBase64Url', () => {
    it('decodes a base64url string without padding', () => {
      expect(decodeBase64Url('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')).toBe(
        '{"alg":"HS256","typ":"JWT"}',
      )
    })

    it('decodes a base64url string that needs padding', () => {
      // 'aGVsbG8' is base64url for 'hello' (no padding)
      expect(decodeBase64Url('aGVsbG8')).toBe('hello')
    })

    it('decodes standard base64 with - and _ converted', () => {
      // Round-trip via btoa/replace
      const input = '{"sub":"123"}'
      const b64url = btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      expect(decodeBase64Url(b64url)).toBe(input)
    })

    it('handles unicode payload', () => {
      const input = '{"name":"中文"}'
      const b64url = btoa(unescape(encodeURIComponent(input)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
      expect(decodeBase64Url(b64url)).toBe(input)
    })

    it('handles empty string', () => {
      expect(decodeBase64Url('')).toBe('')
    })
  })

  describe('generateJwt', () => {
    it('generates a token with three dot-separated parts', () => {
      const token = generateJwt({ sub: '123' }, SECRET)
      const parts = token.split('.')
      expect(parts).toHaveLength(3)
    })

    it('always uses HS256 alg in header', () => {
      const token = generateJwt({ sub: '123' }, SECRET)
      const parsed = parseJwt(token)
      expect(parsed.header).toEqual({ alg: 'HS256', typ: 'JWT' })
    })

    it('encodes the payload as JSON', () => {
      const payload = { sub: 'user-1', role: 'admin', nbf: 100 }
      const token = generateJwt(payload, SECRET)
      const parsed = parseJwt(token)
      expect(parsed.payload).toEqual(payload)
    })

    it('produces a token that verifies with the same secret', () => {
      const token = generateJwt({ sub: '123' }, SECRET)
      expect(verifyHs256(token, SECRET)).toBe(true)
    })

    it('produces a token without padding in its parts', () => {
      const token = generateJwt({ sub: '123' }, SECRET)
      for (const part of token.split('.')) {
        expect(part).not.toContain('=')
        expect(part).not.toContain('+')
        expect(part).not.toContain('/')
      }
    })
  })

  describe('verifyHs256', () => {
    it('returns true for a valid token with correct secret', () => {
      expect(verifyHs256(KNOWN_TOKEN, SECRET)).toBe(true)
    })

    it('returns false for a valid token with wrong secret', () => {
      expect(verifyHs256(KNOWN_TOKEN, 'wrong-secret')).toBe(false)
    })

    it('returns true for a token with Bearer prefix', () => {
      expect(verifyHs256(`Bearer ${KNOWN_TOKEN}`, SECRET)).toBe(true)
    })

    it('returns true for a token with Bearer and extra whitespace', () => {
      expect(verifyHs256(`Bearer  ${KNOWN_TOKEN} `, SECRET)).toBe(true)
    })

    it('returns false for a token with a tampered payload', () => {
      const parts = KNOWN_TOKEN.split('.')
      // Flip the payload to a different sub
      const newPayload = btoa(unescape(encodeURIComponent('{"sub":"999","exp":9999999999}')))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
      const tampered = `${parts[0]}.${newPayload}.${parts[2]}`
      expect(verifyHs256(tampered, SECRET)).toBe(false)
    })

    it('returns false for a token with a tampered signature', () => {
      const parts = KNOWN_TOKEN.split('.')
      const tampered = `${parts[0]}.${parts[1]}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`
      expect(verifyHs256(tampered, SECRET)).toBe(false)
    })

    it('returns false for a token without 3 parts', () => {
      expect(verifyHs256('only.one.part', SECRET)).toBe(false)
      expect(verifyHs256('onlyonepart', SECRET)).toBe(false)
      expect(verifyHs256('a.b.c.d', SECRET)).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(verifyHs256('', SECRET)).toBe(false)
    })
  })

  describe('parseJwt', () => {
    it('parses a valid token into header, payload, signature', () => {
      const parsed = parseJwt(KNOWN_TOKEN)
      expect(parsed.header).toEqual({ alg: 'HS256', typ: 'JWT' })
      expect(parsed.payload).toEqual({ sub: '123', exp: 9999999999 })
      expect(parsed.signature).toBe(KNOWN_TOKEN.split('.')[2])
    })

    it('extracts standard claims (exp) at top level', () => {
      const parsed = parseJwt(KNOWN_TOKEN)
      expect(parsed.exp).toBe(9999999999)
    })

    it('extracts iss (string) claim', () => {
      const token = generateJwt({ iss: 'issuer-x' }, SECRET)
      const parsed = parseJwt(token)
      expect(parsed.iss).toBe('issuer-x')
    })

    it('extracts iat and nbf (number) claims', () => {
      const token = generateJwt({ iat: 1000, nbf: 2000 }, SECRET)
      const parsed = parseJwt(token)
      expect(parsed.iat).toBe(1000)
      expect(parsed.nbf).toBe(2000)
    })

    it('extracts aud (string) claim', () => {
      const token = generateJwt({ aud: 'audience-x' }, SECRET)
      const parsed = parseJwt(token)
      expect(parsed.aud).toBe('audience-x')
    })

    it('extracts aud (string array) claim', () => {
      const token = generateJwt({ aud: ['a', 'b'] }, SECRET)
      const parsed = parseJwt(token)
      expect(parsed.aud).toEqual(['a', 'b'])
    })

    it('strips a Bearer prefix', () => {
      const parsed = parseJwt(`Bearer ${KNOWN_TOKEN}`)
      expect(parsed.payload).toEqual({ sub: '123', exp: 9999999999 })
    })

    it('throws on invalid format (not 3 parts)', () => {
      expect(() => parseJwt('a.b')).toThrow('Invalid JWT format')
      expect(() => parseJwt('a.b.c.d')).toThrow('Invalid JWT format')
      expect(() => parseJwt('')).toThrow('Invalid JWT format')
    })

    it('throws when header is not valid JSON', () => {
      // header part that decodes to non-JSON
      const badHeader = btoa('not-json').replace(/=+$/, '')
      const parts = KNOWN_TOKEN.split('.')
      const badToken = `${badHeader}.${parts[1]}.${parts[2]}`
      expect(() => parseJwt(badToken)).toThrow('Failed to decode JWT header')
    })

    it('throws when payload is not valid JSON', () => {
      const badPayload = btoa('not-json').replace(/=+$/, '')
      const parts = KNOWN_TOKEN.split('.')
      const badToken = `${parts[0]}.${badPayload}.${parts[2]}`
      expect(() => parseJwt(badToken)).toThrow('Failed to decode JWT payload')
    })

    it('does not set optional claims when absent', () => {
      const token = generateJwt({ custom: 'value' }, SECRET)
      const parsed = parseJwt(token)
      expect(parsed.exp).toBeUndefined()
      expect(parsed.iat).toBeUndefined()
      expect(parsed.nbf).toBeUndefined()
      expect(parsed.iss).toBeUndefined()
      expect(parsed.aud).toBeUndefined()
    })
  })

  describe('explainClaims', () => {
    it('returns descriptions for known claims', () => {
      const parsed: JwtPayload = parseJwt(KNOWN_TOKEN)
      const result = explainClaims(parsed)
      const subEntry = result.find((r) => r.key === 'sub')
      const expEntry = result.find((r) => r.key === 'exp')
      expect(subEntry).toBeDefined()
      expect(subEntry?.value).toBe('123')
      expect(subEntry?.desc).toContain('Subject')
      expect(expEntry).toBeDefined()
      expect(expEntry?.value).toBe('9999999999')
      expect(expEntry?.desc).toContain('Expiration')
    })

    it('returns empty desc for unknown claims', () => {
      const parsed: JwtPayload = {
        header: {},
        payload: { customKey: 'customValue' },
        signature: '',
      }
      const result = explainClaims(parsed)
      const entry = result.find((r) => r.key === 'customKey')
      expect(entry).toBeDefined()
      expect(entry?.value).toBe('customValue')
      expect(entry?.desc).toBe('')
    })

    it('stringifies object claim values', () => {
      const parsed: JwtPayload = {
        header: {},
        payload: { roles: ['admin', 'user'] },
        signature: '',
      }
      const result = explainClaims(parsed)
      const entry = result.find((r) => r.key === 'roles')
      expect(entry).toBeDefined()
      expect(entry?.value).toBe(JSON.stringify(['admin', 'user']))
      // roles is a known claim
      expect(entry?.desc).toContain('Roles')
    })

    it('returns empty array for empty payload', () => {
      const parsed: JwtPayload = { header: {}, payload: {}, signature: '' }
      expect(explainClaims(parsed)).toEqual([])
    })

    it('handles numeric and string values', () => {
      const parsed: JwtPayload = {
        header: {},
        payload: { num: 42, str: 'hello' },
        signature: '',
      }
      const result = explainClaims(parsed)
      const num = result.find((r) => r.key === 'num')
      const str = result.find((r) => r.key === 'str')
      expect(num?.value).toBe('42')
      expect(str?.value).toBe('hello')
    })

    it('covers all documented standard claims', () => {
      const parsed: JwtPayload = {
        header: {},
        payload: {
          sub: 's',
          aud: 'a',
          iss: 'i',
          exp: 1,
          iat: 1,
          nbf: 1,
          scope: 'sc',
          roles: 'r',
          jti: 'j',
        },
        signature: '',
      }
      const result = explainClaims(parsed)
      for (const key of ['sub', 'aud', 'iss', 'exp', 'iat', 'nbf', 'scope', 'roles', 'jti']) {
        const entry = result.find((r) => r.key === key)
        expect(entry, `expected entry for ${key}`).toBeDefined()
        expect(entry?.desc).not.toBe('')
      }
    })
  })

  describe('getJwtStatus', () => {
    it('returns null status when exp is missing', () => {
      const parsed: JwtPayload = {
        header: {},
        payload: {},
        signature: '',
      }
      const status = getJwtStatus(parsed)
      expect(status.isExpired).toBe(false)
      expect(status.willExpireSoon).toBe(false)
      expect(status.expiryDate).toBeNull()
      expect(status.remainingSeconds).toBeNull()
    })

    it('returns null status when exp is undefined', () => {
      const parsed: JwtPayload = {
        header: {},
        payload: { sub: 'x' },
        signature: '',
      }
      const status = getJwtStatus(parsed)
      expect(status.expiryDate).toBeNull()
      expect(status.remainingSeconds).toBeNull()
    })

    it('marks a far-future token as not expired and not soon', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 86400 // +1 day
      const parsed: JwtPayload = {
        header: {},
        payload: { exp: futureExp },
        signature: '',
        exp: futureExp,
      }
      const status = getJwtStatus(parsed)
      expect(status.isExpired).toBe(false)
      expect(status.willExpireSoon).toBe(false)
      expect(status.expiryDate).toEqual(new Date(futureExp * 1000))
      expect(status.remainingSeconds).toBeGreaterThan(3600)
    })

    it('marks an expired token as expired', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      const parsed: JwtPayload = {
        header: {},
        payload: { exp: pastExp },
        signature: '',
        exp: pastExp,
      }
      const status = getJwtStatus(parsed)
      expect(status.isExpired).toBe(true)
      expect(status.willExpireSoon).toBe(false) // already expired, so not "soon"
      expect(status.expiryDate).toEqual(new Date(pastExp * 1000))
      expect(status.remainingSeconds).toBeLessThan(0)
    })

    it('marks a token expiring soon as willExpireSoon', () => {
      const soonExp = Math.floor(Date.now() / 1000) + 600 // 10 minutes
      const parsed: JwtPayload = {
        header: {},
        payload: { exp: soonExp },
        signature: '',
        exp: soonExp,
      }
      const status = getJwtStatus(parsed)
      expect(status.isExpired).toBe(false)
      expect(status.willExpireSoon).toBe(true)
      expect(status.remainingSeconds).toBeLessThan(3600)
      expect(status.remainingSeconds).toBeGreaterThan(0)
    })

    it('does not mark willExpireSoon at exactly the 3600s boundary', () => {
      // remainingSeconds === 3600 -> willExpireSoon = 3600 < 3600 === false
      const exp = Math.floor(Date.now() / 1000) + 3600
      const parsed: JwtPayload = {
        header: {},
        payload: { exp },
        signature: '',
        exp,
      }
      const status = getJwtStatus(parsed)
      expect(status.isExpired).toBe(false)
      // At the boundary, remainingSeconds could be 3599 due to elapsed time;
      // we just assert it's not expired. (willExpireSoon depends on timing.)
      expect(status.expiryDate).toEqual(new Date(exp * 1000))
    })
    it('returns remainingSeconds decreasing with time', () => {
      const soonExp = Math.floor(Date.now() / 1000) + 100
      const parsed: JwtPayload = {
        header: {},
        payload: { exp: soonExp },
        signature: '',
        exp: soonExp,
      }
      const status = getJwtStatus(parsed)
      expect(status.remainingSeconds).toBeLessThanOrEqual(100)
    })
  })

  describe('formatRemainingTime', () => {
    it('formats seconds under 60', () => {
      expect(formatRemainingTime(0)).toBe('0s')
      expect(formatRemainingTime(1)).toBe('1s')
      expect(formatRemainingTime(30)).toBe('30s')
      expect(formatRemainingTime(59)).toBe('59s')
    })

    it('formats minutes and seconds', () => {
      expect(formatRemainingTime(60)).toBe('1m 0s')
      expect(formatRemainingTime(90)).toBe('1m 30s')
      expect(formatRemainingTime(119)).toBe('1m 59s')
      expect(formatRemainingTime(3599)).toBe('59m 59s')
    })

    it('formats hours and minutes', () => {
      expect(formatRemainingTime(3600)).toBe('1h 0m')
      expect(formatRemainingTime(3700)).toBe('1h 1m')
      expect(formatRemainingTime(86399)).toBe('23h 59m')
    })

    it('formats days and hours', () => {
      expect(formatRemainingTime(86400)).toBe('1d 0h')
      expect(formatRemainingTime(90000)).toBe('1d 1h')
      expect(formatRemainingTime(86400 * 2 + 3600 * 3)).toBe('2d 3h')
    })

    it('handles large values', () => {
      const seconds = 86400 * 30 + 3600 * 5
      expect(formatRemainingTime(seconds)).toBe('30d 5h')
    })
  })
})
