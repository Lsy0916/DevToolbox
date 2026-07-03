import { describe, it, expect } from 'vitest'
import {
  HTTP_STATUS_CODES,
  HTTP_METHODS,
  HTTP_HEADERS,
  statusCategory,
} from './httprefUtils'
import type { HttpStatus, HttpMethodRef, HttpHeaderRef } from './httprefUtils'

const VALID_CATEGORIES = ['general', 'request', 'response', 'entity'] as const

describe('httprefUtils', () => {
  describe('HTTP_STATUS_CODES', () => {
    it('is a non-empty array of status entries', () => {
      expect(HTTP_STATUS_CODES.length).toBeGreaterThan(0)
      for (const entry of HTTP_STATUS_CODES) {
        expect(typeof entry.code).toBe('number')
        expect(typeof entry.text).toBe('string')
        expect(entry.text.length).toBeGreaterThan(0)
        expect(typeof entry.descKey).toBe('string')
      }
    })
    it('contains common status codes', () => {
      const codes = HTTP_STATUS_CODES.map((s) => s.code)
      expect(codes).toContain(200)
      expect(codes).toContain(404)
      expect(codes).toContain(500)
    })
    it('has unique status codes', () => {
      const codes = HTTP_STATUS_CODES.map((s) => s.code)
      expect(new Set(codes).size).toBe(codes.length)
    })
    it('maps code 404 to "Not Found"', () => {
      const found = HTTP_STATUS_CODES.find((s) => s.code === 404)
      expect(found?.text).toBe('Not Found')
    })
  })

  describe('HTTP_METHODS', () => {
    it('contains the standard HTTP methods', () => {
      const names = HTTP_METHODS.map((m) => m.name)
      for (const expected of ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']) {
        expect(names).toContain(expected)
      }
    })
    it('marks GET as safe, idempotent, and bodyless', () => {
      const get = HTTP_METHODS.find((m) => m.name === 'GET') as HttpMethodRef
      expect(get.safe).toBe(true)
      expect(get.idempotent).toBe(true)
      expect(get.hasBody).toBe(false)
    })
    it('marks POST as unsafe and non-idempotent with a body', () => {
      const post = HTTP_METHODS.find((m) => m.name === 'POST') as HttpMethodRef
      expect(post.safe).toBe(false)
      expect(post.idempotent).toBe(false)
      expect(post.hasBody).toBe(true)
    })
    it('every method has a descKey', () => {
      for (const method of HTTP_METHODS) {
        expect(typeof method.descKey).toBe('string')
        expect(method.descKey.length).toBeGreaterThan(0)
      }
    })
  })

  describe('HTTP_HEADERS', () => {
    it('is a non-empty array of header entries', () => {
      expect(HTTP_HEADERS.length).toBeGreaterThan(0)
      for (const header of HTTP_HEADERS) {
        expect(typeof header.name).toBe('string')
        expect(VALID_CATEGORIES).toContain(header.category)
        expect(typeof header.descKey).toBe('string')
      }
    })
    it('contains common headers', () => {
      const names = HTTP_HEADERS.map((h) => h.name)
      expect(names).toContain('Authorization')
      expect(names).toContain('Content-Type')
      expect(names).toContain('User-Agent')
    })
    it('categorizes Authorization as a request header', () => {
      const auth = HTTP_HEADERS.find((h) => h.name === 'Authorization') as HttpHeaderRef
      expect(auth.category).toBe('request')
    })
    it('categorizes ETag as a response header', () => {
      const etag = HTTP_HEADERS.find((h) => h.name === 'ETag') as HttpHeaderRef
      expect(etag.category).toBe('response')
    })
  })

  describe('statusCategory', () => {
    it('classifies 1xx as info', () => {
      expect(statusCategory(100)).toBe('info')
      expect(statusCategory(199)).toBe('info')
    })
    it('classifies 2xx as success', () => {
      expect(statusCategory(200)).toBe('success')
      expect(statusCategory(299)).toBe('success')
    })
    it('classifies 3xx as redirect', () => {
      expect(statusCategory(300)).toBe('redirect')
      expect(statusCategory(399)).toBe('redirect')
    })
    it('classifies 4xx as client error', () => {
      expect(statusCategory(400)).toBe('client')
      expect(statusCategory(499)).toBe('client')
    })
    it('classifies 5xx as server error', () => {
      expect(statusCategory(500)).toBe('server')
      expect(statusCategory(599)).toBe('server')
    })
  })
})
