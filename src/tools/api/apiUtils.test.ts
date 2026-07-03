import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  kvToObject,
  buildUrl,
  buildBody,
  executeRequest,
  generateCurl,
  formatDuration,
  formatSize,
  statusCategory,
  tryFormatJson,
  detectBodyLanguage,
} from './apiUtils'
import type { KeyValue } from '@/types'

describe('kvToObject', () => {
  it('converts enabled key-value rows to an object', () => {
    const rows: KeyValue[] = [
      { key: 'a', value: '1', enabled: true },
      { key: 'b', value: '2', enabled: true },
    ]
    expect(kvToObject(rows)).toEqual({ a: '1', b: '2' })
  })

  it('skips disabled rows', () => {
    const rows: KeyValue[] = [
      { key: 'a', value: '1', enabled: true },
      { key: 'b', value: '2', enabled: false },
    ]
    expect(kvToObject(rows)).toEqual({ a: '1' })
  })

  it('skips rows with an empty key', () => {
    const rows: KeyValue[] = [
      { key: '', value: '1', enabled: true },
      { key: 'b', value: '2', enabled: true },
    ]
    expect(kvToObject(rows)).toEqual({ b: '2' })
  })

  it('returns an empty object for an empty input array', () => {
    expect(kvToObject([])).toEqual({})
  })
})

describe('buildUrl', () => {
  it('returns the base url when there are no params', () => {
    expect(buildUrl('https://example.com', [])).toBe('https://example.com')
  })

  it('appends a query string with "?" when the base has no query', () => {
    const params: KeyValue[] = [
      { key: 'foo', value: 'bar', enabled: true },
      { key: 'baz', value: 'qux', enabled: true },
    ]
    expect(buildUrl('https://example.com', params)).toBe('https://example.com?foo=bar&baz=qux')
  })

  it('appends with "&" when the base url already has a "?"', () => {
    const params: KeyValue[] = [{ key: 'foo', value: 'bar', enabled: true }]
    expect(buildUrl('https://example.com?a=1', params)).toBe('https://example.com?a=1&foo=bar')
  })

  it('skips disabled params', () => {
    const params: KeyValue[] = [
      { key: 'foo', value: 'bar', enabled: true },
      { key: 'x', value: 'y', enabled: false },
    ]
    expect(buildUrl('https://example.com', params)).toBe('https://example.com?foo=bar')
  })

  it('skips params with an empty key', () => {
    const params: KeyValue[] = [
      { key: '', value: 'bar', enabled: true },
      { key: 'foo', value: 'bar', enabled: true },
    ]
    expect(buildUrl('https://example.com', params)).toBe('https://example.com?foo=bar')
  })

  it('URL-encodes special characters in keys and values', () => {
    const params: KeyValue[] = [{ key: 'q', value: 'hello world&more', enabled: true }]
    expect(buildUrl('https://example.com', params)).toBe(
      'https://example.com?q=hello%20world%26more',
    )
  })
})

describe('buildBody', () => {
  it('returns null data for the "none" body type', () => {
    expect(buildBody('none', '', [])).toEqual({ data: null })
  })

  it('returns the raw text with json content type', () => {
    expect(buildBody('json', '{"a":1}', [])).toEqual({
      data: '{"a":1}',
      contentType: 'application/json',
    })
  })

  it('returns the raw text with plain content type', () => {
    expect(buildBody('text', 'hello', [])).toEqual({ data: 'hello', contentType: 'text/plain' })
  })

  it('returns a urlencoded body string from form rows', () => {
    const formRows: KeyValue[] = [
      { key: 'a', value: '1', enabled: true },
      { key: 'b', value: '2', enabled: true },
    ]
    const result = buildBody('urlencoded', '', formRows)
    expect(result.contentType).toBe('application/x-www-form-urlencoded')
    expect(result.data).toBe('a=1&b=2')
  })

  it('skips disabled rows when building urlencoded body', () => {
    const formRows: KeyValue[] = [
      { key: 'a', value: '1', enabled: true },
      { key: 'b', value: '2', enabled: false },
    ]
    const result = buildBody('urlencoded', '', formRows)
    expect(result.data).toBe('a=1')
  })

  it('returns a FormData object for the "form" body type', () => {
    const formRows: KeyValue[] = [
      { key: 'a', value: '1', enabled: true },
      { key: 'b', value: '2', enabled: false },
    ]
    const result = buildBody('form', '', formRows)
    expect(result.data).toBeInstanceOf(FormData)
    expect((result.data as FormData).get('a')).toBe('1')
    expect((result.data as FormData).get('b')).toBeNull()
    expect(result.contentType).toBeUndefined()
  })

  it('returns null data for an unknown body type', () => {
    expect(buildBody('unknown' as never, '', [])).toEqual({ data: null })
  })
})

describe('executeRequest', () => {
  const mockResponse = {
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'content-type': 'application/json' }),
    text: async () => '{"ok":true}',
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('makes a successful request and returns the parsed response', async () => {
    const result = await executeRequest('GET', 'https://example.com', [], 'none', '', [])
    expect(result.status).toBe(200)
    expect(result.statusText).toBe('OK')
    expect(result.body).toBe('{"ok":true}')
    expect(result.headers['content-type']).toBe('application/json')
    expect(typeof result.duration).toBe('number')
    expect(result.size).toBeGreaterThan(0)
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ method: 'GET', redirect: 'follow' }),
    )
  })

  it('sets Content-Type from the body when not provided in headers', async () => {
    await executeRequest('POST', 'https://example.com', [], 'json', '{"a":1}', [])
    const callArgs = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1]
    expect(callArgs.headers['Content-Type']).toBe('application/json')
    expect(callArgs.body).toBe('{"a":1}')
  })

  it('does not override Content-Type when provided in headers', async () => {
    const headers: KeyValue[] = [
      { key: 'Content-Type', value: 'application/xml', enabled: true },
    ]
    await executeRequest('POST', 'https://example.com', headers, 'json', '{"a":1}', [])
    const callArgs = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1]
    expect(callArgs.headers['Content-Type']).toBe('application/xml')
  })

  it('uses case-insensitive matching for existing Content-Type header', async () => {
    const headers: KeyValue[] = [
      { key: 'content-type', value: 'application/xml', enabled: true },
    ]
    await executeRequest('POST', 'https://example.com', headers, 'json', '{"a":1}', [])
    const callArgs = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1]
    expect(callArgs.headers['content-type']).toBe('application/xml')
    expect(callArgs.headers['Content-Type']).toBeUndefined()
  })

  it('returns a timeout error when fetch rejects with AbortError', async () => {
    const err = new DOMException('Aborted', 'AbortError')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(err))
    const result = await executeRequest('GET', 'https://example.com', [], 'none', '', [], 1000)
    expect(result.status).toBe(0)
    expect(result.errorType).toBe('timeout')
    expect(result.error).toContain('1000ms')
    expect(result.size).toBe(0)
  })

  it('returns a cors error when fetch rejects with TypeError while online', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const result = await executeRequest('GET', 'https://example.com', [], 'none', '', [])
    expect(result.status).toBe(0)
    expect(result.errorType).toBe('cors')
    expect(result.error).toBe('Failed to fetch')
  })

  it('returns a network error when fetch rejects with TypeError while offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const result = await executeRequest('GET', 'https://example.com', [], 'none', '', [])
    expect(result.status).toBe(0)
    expect(result.errorType).toBe('network')
  })

  it('returns an unknown error for generic Error throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))
    const result = await executeRequest('GET', 'https://example.com', [], 'none', '', [])
    expect(result.status).toBe(0)
    expect(result.errorType).toBe('unknown')
    expect(result.error).toBe('boom')
  })

  it('returns an unknown error with "Unknown error" message for non-Error throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('string error'))
    const result = await executeRequest('GET', 'https://example.com', [], 'none', '', [])
    expect(result.status).toBe(0)
    expect(result.errorType).toBe('unknown')
    expect(result.error).toBe('Unknown error')
  })
})

describe('generateCurl', () => {
  it('generates a basic GET curl command', () => {
    const result = generateCurl('GET', 'https://example.com', [], 'none', '', [])
    expect(result).toContain('curl -X GET')
    expect(result).toContain("'https://example.com'")
    expect(result).not.toContain('-H ')
    expect(result).not.toContain('-d ')
  })

  it('includes -H flags for enabled headers', () => {
    const headers: KeyValue[] = [
      { key: 'Authorization', value: 'Bearer token', enabled: true },
    ]
    const result = generateCurl('GET', 'https://example.com', headers, 'none', '', [])
    expect(result).toContain("-H 'Authorization: Bearer token'")
  })

  it('includes Content-Type derived from the body type', () => {
    const result = generateCurl('POST', 'https://example.com', [], 'json', '{"a":1}', [])
    expect(result).toContain("-H 'Content-Type: application/json'")
    expect(result).toContain("-d '{\"a\":1}'")
  })

  it('does not override Content-Type when provided in headers', () => {
    const headers: KeyValue[] = [
      { key: 'Content-Type', value: 'application/xml', enabled: true },
    ]
    const result = generateCurl('POST', 'https://example.com', headers, 'json', '{"a":1}', [])
    expect(result).toContain("-H 'Content-Type: application/xml'")
    expect(result).not.toContain('application/json')
  })

  it('generates a -d flag for urlencoded bodies', () => {
    const formRows: KeyValue[] = [
      { key: 'a', value: '1', enabled: true },
      { key: 'b', value: '2', enabled: true },
    ]
    const result = generateCurl('POST', 'https://example.com', [], 'urlencoded', '', formRows)
    expect(result).toContain("-d 'a=1&b=2'")
  })

  it('generates -F flags for form bodies (skipping disabled rows)', () => {
    const formRows: KeyValue[] = [
      { key: 'a', value: '1', enabled: true },
      { key: 'b', value: '2', enabled: false },
    ]
    const result = generateCurl('POST', 'https://example.com', [], 'form', '', formRows)
    expect(result).toContain("-F 'a=1'")
    expect(result).not.toContain("-F 'b=2'")
  })

  it('escapes single quotes inside json/text bodies', () => {
    const result = generateCurl('POST', 'https://example.com', [], 'text', "it's", [])
    expect(result).toContain("-d 'it'\\''s'")
  })

  it('does not include -d for an empty json/text body', () => {
    const result = generateCurl('POST', 'https://example.com', [], 'json', '', [])
    expect(result).not.toMatch(/-d /)
  })

  it('joins command parts with a backslash-newline continuation', () => {
    const result = generateCurl('GET', 'https://example.com', [], 'none', '', [])
    expect(result).toContain(' \\\n  ')
  })
})

describe('formatDuration', () => {
  it('formats durations under 1000ms with the "ms" suffix', () => {
    expect(formatDuration(0)).toBe('0ms')
    expect(formatDuration(500)).toBe('500ms')
    expect(formatDuration(999)).toBe('999ms')
  })

  it('formats durations of 1000ms and above as seconds with 2 decimals', () => {
    expect(formatDuration(1000)).toBe('1.00s')
    expect(formatDuration(1500)).toBe('1.50s')
    expect(formatDuration(60000)).toBe('60.00s')
  })
})

describe('formatSize', () => {
  it('formats sizes under 1024 bytes with the "B" suffix', () => {
    expect(formatSize(0)).toBe('0B')
    expect(formatSize(512)).toBe('512B')
    expect(formatSize(1023)).toBe('1023B')
  })

  it('formats sizes between 1024 and 1MB with the "KB" suffix', () => {
    expect(formatSize(1024)).toBe('1.0KB')
    expect(formatSize(1536)).toBe('1.5KB')
  })

  it('formats sizes of 1MB and above with the "MB" suffix', () => {
    expect(formatSize(1024 * 1024)).toBe('1.00MB')
    expect(formatSize(2 * 1024 * 1024)).toBe('2.00MB')
  })
})

describe('statusCategory', () => {
  it('classifies 0 as error', () => {
    expect(statusCategory(0)).toBe('error')
  })

  it('classifies 1xx codes as info', () => {
    expect(statusCategory(100)).toBe('info')
    expect(statusCategory(199)).toBe('info')
  })

  it('classifies 2xx codes as success', () => {
    expect(statusCategory(200)).toBe('success')
    expect(statusCategory(299)).toBe('success')
  })

  it('classifies 3xx codes as redirect', () => {
    expect(statusCategory(300)).toBe('redirect')
    expect(statusCategory(399)).toBe('redirect')
  })

  it('classifies 4xx codes as client', () => {
    expect(statusCategory(400)).toBe('client')
    expect(statusCategory(404)).toBe('client')
    expect(statusCategory(499)).toBe('client')
  })

  it('classifies 5xx codes as server', () => {
    expect(statusCategory(500)).toBe('server')
    expect(statusCategory(503)).toBe('server')
  })
})

describe('tryFormatJson', () => {
  it('returns an empty string as-is', () => {
    expect(tryFormatJson('')).toBe('')
  })

  it('pretty-prints valid JSON objects with 2-space indentation', () => {
    expect(tryFormatJson('{"a":1,"b":2}')).toBe('{\n  "a": 1,\n  "b": 2\n}')
  })

  it('pretty-prints valid JSON arrays', () => {
    expect(tryFormatJson('[1,2,3]')).toBe('[\n  1,\n  2,\n  3\n]')
  })

  it('returns the original string for invalid JSON', () => {
    const invalid = '{not valid json}'
    expect(tryFormatJson(invalid)).toBe(invalid)
  })
})

describe('detectBodyLanguage', () => {
  it('detects json from the content-type header', () => {
    expect(detectBodyLanguage('{}', 'application/json')).toBe('json')
  })

  it('detects html from the content-type header', () => {
    expect(detectBodyLanguage('<html>', 'text/html')).toBe('html')
  })

  it('detects xml content-type as html', () => {
    expect(detectBodyLanguage('<xml/>', 'application/xml')).toBe('html')
  })

  it('detects json from a body starting with "{" when content-type is plain', () => {
    expect(detectBodyLanguage('{"a":1}', 'text/plain')).toBe('json')
  })

  it('detects json from a body starting with "[" when content-type is plain', () => {
    expect(detectBodyLanguage('[1,2]', 'text/plain')).toBe('json')
  })

  it('detects html from a body starting with "<" when content-type is plain', () => {
    expect(detectBodyLanguage('<div>hi</div>', 'text/plain')).toBe('html')
  })

  it('returns plaintext for non-structured bodies', () => {
    expect(detectBodyLanguage('hello world', 'text/plain')).toBe('plaintext')
  })

  it('returns plaintext for a body that looks like JSON but fails to parse', () => {
    expect(detectBodyLanguage('{not valid}', 'text/plain')).toBe('plaintext')
  })

  it('uses case-insensitive matching on the content-type', () => {
    expect(detectBodyLanguage('', 'APPLICATION/JSON')).toBe('json')
  })
})
