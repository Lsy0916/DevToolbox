import { describe, it, expect } from 'vitest'
import {
  encodeBase64,
  decodeBase64,
  encodeBase64UrlSafe,
  decodeBase64UrlSafe,
  textToHex,
  hexToText,
  arrayBufferToBase64,
  base64ToBlob,
  getMimeTypeFromDataUrl,
  formatBytes,
} from './base64Utils'

describe('encodeBase64 / decodeBase64', () => {
  it('encodes ASCII text', () => {
    expect(encodeBase64('hello')).toBe('aGVsbG8=')
  })

  it('decodes ASCII text back', () => {
    expect(decodeBase64('aGVsbG8=')).toBe('hello')
  })

  it('round-trips UTF-8 multibyte text', () => {
    const text = '你好，世界！'
    expect(decodeBase64(encodeBase64(text))).toBe(text)
  })

  it('handles empty string', () => {
    expect(encodeBase64('')).toBe('')
    expect(decodeBase64('')).toBe('')
  })
})

describe('encodeBase64UrlSafe / decodeBase64UrlSafe', () => {
  it('produces URL-safe characters without padding', () => {
    const encoded = encodeBase64UrlSafe('???>???')
    expect(encoded).not.toContain('+')
    expect(encoded).not.toContain('/')
    expect(encoded).not.toContain('=')
  })

  it('round-trips through encode/decode', () => {
    const text = 'a+b/c?d=e'
    expect(decodeBase64UrlSafe(encodeBase64UrlSafe(text))).toBe(text)
  })

  it('round-trips UTF-8 text', () => {
    const text = '日本語テスト 🚀'
    expect(decodeBase64UrlSafe(encodeBase64UrlSafe(text))).toBe(text)
  })
})

describe('textToHex / hexToText', () => {
  it('encodes ASCII to hex', () => {
    expect(textToHex('AB')).toBe('4142')
  })

  it('decodes hex back to ASCII', () => {
    expect(hexToText('4142')).toBe('AB')
  })

  it('encodes UTF-8 multibyte characters to hex bytes', () => {
    // "中" in UTF-8 is E4 B8 AD
    expect(textToHex('中')).toBe('e4b8ad')
  })

  it('round-trips UTF-8 text', () => {
    const text = 'Hello, 世界!'
    expect(hexToText(textToHex(text))).toBe(text)
  })

  it('throws on invalid hex string', () => {
    expect(() => hexToText('xyz')).toThrow('Invalid hex string')
  })

  it('throws on odd-length hex string', () => {
    expect(() => hexToText('abc')).toThrow('Invalid hex string')
  })

  it('ignores whitespace in hex input', () => {
    expect(hexToText('41 42')).toBe('AB')
  })
})

describe('arrayBufferToBase64', () => {
  it('encodes an empty buffer', () => {
    expect(arrayBufferToBase64(new ArrayBuffer(0))).toBe('')
  })

  it('encodes a small buffer correctly', () => {
    const bytes = new Uint8Array([72, 73]) // "HI"
    expect(arrayBufferToBase64(bytes.buffer)).toBe('SEk=')
  })

  it('handles a buffer larger than the chunk size', () => {
    const bytes = new Uint8Array(0x9000) // > 0x8000 chunk size
    for (let i = 0; i < bytes.length; i++) bytes[i] = i % 256
    const encoded = arrayBufferToBase64(bytes.buffer)
    // Decode and compare
    const decoded = atob(encoded)
    expect(decoded.length).toBe(bytes.length)
    expect(decoded.charCodeAt(0)).toBe(0)
    expect(decoded.charCodeAt(255)).toBe(255)
  })
})

describe('base64ToBlob', () => {
  it('creates a Blob with the given MIME type', () => {
    const blob = base64ToBlob('aGVsbG8=', 'text/plain')
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('text/plain')
    expect(blob.size).toBe(5)
  })

  it('creates a Blob from an empty base64 string', () => {
    const blob = base64ToBlob('', 'application/octet-stream')
    expect(blob.size).toBe(0)
    expect(blob.type).toBe('application/octet-stream')
  })
})

describe('getMimeTypeFromDataUrl', () => {
  it('extracts the MIME type from a data URL', () => {
    expect(getMimeTypeFromDataUrl('data:image/png;base64,iVBOR...')).toBe('image/png')
  })

  it('returns the default MIME type when no match is found', () => {
    expect(getMimeTypeFromDataUrl('https://example.com/file.png')).toBe('application/octet-stream')
  })

  it('returns the default MIME type for plain text data URL without base64', () => {
    expect(getMimeTypeFromDataUrl('data:text/plain,hello')).toBe('application/octet-stream')
  })
})

describe('formatBytes', () => {
  it('formats bytes below 1 KB', () => {
    expect(formatBytes(512)).toBe('512 B')
  })

  it('formats bytes in KB', () => {
    expect(formatBytes(2048)).toBe('2.00 KB')
  })

  it('formats bytes in MB', () => {
    expect(formatBytes(1024 * 1024 * 3)).toBe('3.00 MB')
  })

  it('formats zero bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
  })
})
