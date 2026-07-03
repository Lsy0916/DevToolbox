import { describe, it, expect } from 'vitest'
import { analyzeChars, formatCodePoint, formatBytes } from './unicodeUtils'

describe('unicodeUtils', () => {
  describe('analyzeChars', () => {
    it('returns an empty array for empty input', () => {
      expect(analyzeChars('')).toEqual([])
    })

    it('analyzes "A中🎉" with correct code points, UTF-8 bytes, UTF-16 units and categories', () => {
      const result = analyzeChars('A中🎉')
      expect(result).toHaveLength(3)

      // 'A' (U+0041)
      expect(result[0]).toEqual({
        char: 'A',
        codePoint: 0x41,
        utf8: [65],
        utf16: [65],
        category: 'uppercase',
      })

      // '中' (U+4E2D)
      expect(result[1]).toEqual({
        char: '中',
        codePoint: 0x4e2d,
        utf8: [0xe4, 0xb8, 0xad],
        utf16: [0x4e2d],
        category: 'cjk',
      })

      // '🎉' (U+1F389) — surrogate pair in UTF-16
      expect(result[2]).toEqual({
        char: '🎉',
        codePoint: 0x1f389,
        utf8: [0xf0, 0x9f, 0x8e, 0x89],
        utf16: [0xd83c, 0xdf89],
        category: 'symbol',
      })
    })

    it('correctly handles surrogate pairs as a single character', () => {
      const result = analyzeChars('😀') // U+1F600
      expect(result).toHaveLength(1)
      expect(result[0].char).toBe('😀')
      expect(result[0].codePoint).toBe(0x1f600)
      expect(result[0].utf16).toHaveLength(2) // surrogate pair
    })

    it('categorizes ASCII letters, digits, spaces and punctuation', () => {
      const result = analyzeChars('a 9!')
      expect(result.map((c) => c.category)).toEqual([
        'lowercase',
        'space',
        'digit',
        'punctuation',
      ])
    })

    it('categorizes control characters', () => {
      const result = analyzeChars('\n')
      expect(result[0].category).toBe('control')
      expect(result[0].codePoint).toBe(0x0a)
    })

    it('categorizes uppercase and lowercase latin letters', () => {
      const result = analyzeChars('Zz')
      expect(result[0]).toMatchObject({ char: 'Z', category: 'uppercase' })
      expect(result[1]).toMatchObject({ char: 'z', category: 'lowercase' })
    })

    it('reports correct UTF-8 byte counts per character', () => {
      const result = analyzeChars('A中🎉')
      expect(result[0].utf8).toHaveLength(1) // ASCII
      expect(result[1].utf8).toHaveLength(3) // CJK is 3 bytes in UTF-8
      expect(result[2].utf8).toHaveLength(4) // emoji is 4 bytes
    })

    it('reports correct UTF-16 unit counts per character', () => {
      const result = analyzeChars('A中🎉')
      expect(result[0].utf16).toHaveLength(1) // BMP
      expect(result[1].utf16).toHaveLength(1) // BMP CJK
      expect(result[2].utf16).toHaveLength(2) // supplementary plane
    })
  })

  describe('formatCodePoint', () => {
    it('formats BMP code points with 4-digit padding', () => {
      expect(formatCodePoint(0x41)).toBe('U+0041')
      expect(formatCodePoint(0x4e2d)).toBe('U+4E2D')
      expect(formatCodePoint(0)).toBe('U+0000')
      expect(formatCodePoint(0xffff)).toBe('U+FFFF')
    })

    it('formats supplementary plane code points with 6-digit padding', () => {
      expect(formatCodePoint(0x1f389)).toBe('U+01F389')
      expect(formatCodePoint(0x1f600)).toBe('U+01F600')
      expect(formatCodePoint(0x10000)).toBe('U+010000')
    })

    it('uppercase the hex digits', () => {
      expect(formatCodePoint(0xabcdef)).toBe('U+ABCDEF')
    })
  })

  describe('formatBytes', () => {
    it('formats a single byte as two hex digits', () => {
      expect(formatBytes([65])).toBe('41')
      expect(formatBytes([0])).toBe('00')
      expect(formatBytes([255])).toBe('FF')
    })

    it('formats multiple bytes separated by spaces', () => {
      expect(formatBytes([0xe4, 0xb8, 0xad])).toBe('E4 B8 AD')
      expect(formatBytes([0xf0, 0x9f, 0x8e, 0x89])).toBe('F0 9F 8E 89')
    })

    it('returns an empty string for empty input', () => {
      expect(formatBytes([])).toBe('')
    })

    it('uppercase the hex digits and pads each byte to 2 chars', () => {
      expect(formatBytes([0x1, 0xa, 0x10])).toBe('01 0A 10')
    })
  })
})
