import { describe, it, expect } from 'vitest'
import {
  encodeUrlByMode,
  decodeUrlByMode,
  parseUrl,
  parseQuery,
  rebuildUrlWithQuery,
  checkUrlSafety,
} from './urlUtils'

describe('encodeUrlByMode / decodeUrlByMode', () => {
  it('encodes a full URL in "uri" mode preserving reserved chars', () => {
    const encoded = encodeUrlByMode('https://example.com/a b?c=d&e=f', 'uri')
    // encodeURI keeps : / ? & = and encodes spaces
    expect(encoded).toBe('https://example.com/a%20b?c=d&e=f')
  })

  it('encodes a component in "component" mode escaping reserved chars', () => {
    const encoded = encodeUrlByMode('a&b=c d', 'component')
    expect(encoded).toBe('a%26b%3Dc%20d')
  })

  it('round-trips through encode/decode for "uri" mode', () => {
    const url = 'https://example.com/a b?c=d'
    expect(decodeUrlByMode(encodeUrlByMode(url, 'uri'), 'uri')).toBe(url)
  })

  it('round-trips through encode/decode for "component" mode', () => {
    const value = 'a&b=c d?e'
    expect(decodeUrlByMode(encodeUrlByMode(value, 'component'), 'component')).toBe(value)
  })
})

describe('parseUrl', () => {
  it('parses a full URL into its components', () => {
    const parsed = parseUrl('https://user@example.com:8080/path/page?q=1#hash')
    expect(parsed.protocol).toBe('https:')
    expect(parsed.host).toBe('example.com:8080')
    expect(parsed.hostname).toBe('example.com')
    expect(parsed.port).toBe('8080')
    expect(parsed.pathname).toBe('/path/page')
    expect(parsed.search).toBe('?q=1')
    expect(parsed.hash).toBe('#hash')
    expect(parsed.origin).toBe('https://example.com:8080')
  })

  it('parses a URL without explicit port', () => {
    const parsed = parseUrl('https://example.com/path')
    expect(parsed.port).toBe('')
    expect(parsed.hostname).toBe('example.com')
  })

  it('throws on an invalid URL', () => {
    expect(() => parseUrl('not a url')).toThrow()
  })
})

describe('parseQuery', () => {
  it('parses a query string with multiple parameters', () => {
    const result = parseQuery('?a=1&b=2')
    expect(result).toEqual([
      { key: 'a', value: '1' },
      { key: 'b', value: '2' },
    ])
  })

  it('parses a query string without a leading "?"', () => {
    expect(parseQuery('a=1&b=2')).toEqual([
      { key: 'a', value: '1' },
      { key: 'b', value: '2' },
    ])
  })

  it('handles repeated keys by producing multiple entries', () => {
    const result = parseQuery('?a=1&a=2')
    expect(result).toEqual([
      { key: 'a', value: '1' },
      { key: 'a', value: '2' },
    ])
  })

  it('returns an empty array for an empty query string', () => {
    expect(parseQuery('')).toEqual([])
    expect(parseQuery('?')).toEqual([])
  })
})

describe('rebuildUrlWithQuery', () => {
  it('rebuilds a URL with the given query parameters', () => {
    const result = rebuildUrlWithQuery('https://example.com/path', [
      { key: 'a', value: '1' },
      { key: 'b', value: '2' },
    ])
    expect(result).toBe('https://example.com/path?a=1&b=2')
  })

  it('drops entries with empty keys', () => {
    const result = rebuildUrlWithQuery('https://example.com/path', [
      { key: '', value: 'x' },
      { key: 'a', value: '1' },
    ])
    expect(result).toBe('https://example.com/path?a=1')
  })

  it('clears existing search when no params are provided', () => {
    const result = rebuildUrlWithQuery('https://example.com/path?old=1', [])
    expect(result).toBe('https://example.com/path')
  })

  it('falls back to a plain string build for an invalid base URL', () => {
    const result = rebuildUrlWithQuery('not a url', [{ key: 'a', value: '1' }])
    expect(result).toBe('not a url?a=1')
  })

  it('returns the base unchanged for an invalid base URL with no params', () => {
    const result = rebuildUrlWithQuery('not a url', [])
    expect(result).toBe('not a url')
  })
})

describe('checkUrlSafety', () => {
  it('returns safe=true for a plain https URL', () => {
    expect(checkUrlSafety('https://example.com/path')).toEqual({ safe: true, reasons: [] })
  })

  it('flags an unknown protocol', () => {
    const r = checkUrlSafety('ftp://example.com')
    expect(r.safe).toBe(false)
    expect(r.reasons).toContain('unknownProtocol')
  })

  it('flags embedded user info', () => {
    const r = checkUrlSafety('https://user:pass@example.com')
    expect(r.safe).toBe(false)
    expect(r.reasons).toContain('userInfoDetected')
  })

  it('flags a non-standard port', () => {
    const r = checkUrlSafety('https://example.com:8080/path')
    expect(r.safe).toBe(false)
    expect(r.reasons).toContain('nonStdPort')
  })

  it('does not flag standard ports 80 and 443', () => {
    expect(checkUrlSafety('http://example.com:80').safe).toBe(true)
    expect(checkUrlSafety('https://example.com:443').safe).toBe(true)
  })

  it('returns invalid for a malformed URL', () => {
    const r = checkUrlSafety('not a url')
    expect(r.safe).toBe(false)
    expect(r.reasons).toContain('invalid')
  })
})
