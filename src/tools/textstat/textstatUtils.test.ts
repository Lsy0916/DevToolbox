import { describe, it, expect } from 'vitest'
import { analyzeText } from './textstatUtils'

describe('textstatUtils', () => {
  describe('analyzeText', () => {
    it('returns all-zero stats for empty input', () => {
      expect(analyzeText('')).toEqual({
        characters: 0,
        charactersNoSpaces: 0,
        words: 0,
        lines: 0,
        sentences: 0,
        paragraphs: 0,
        readingTimeMin: 0,
      })
    })

    it('analyzes a simple English sentence', () => {
      const stats = analyzeText('Hello world')
      expect(stats.characters).toBe(11)
      expect(stats.charactersNoSpaces).toBe(10)
      expect(stats.words).toBe(2)
      expect(stats.lines).toBe(1)
      expect(stats.sentences).toBe(1)
      expect(stats.paragraphs).toBe(1)
      expect(stats.readingTimeMin).toBe(1) // minimum 1 minute
    })

    it('counts multiple sentences via punctuation', () => {
      const stats = analyzeText('Hello world. This is a test! Really?')
      expect(stats.characters).toBe(36)
      expect(stats.charactersNoSpaces).toBe(30) // 36 - 6 spaces
      expect(stats.words).toBe(7)
      expect(stats.sentences).toBe(3)
      expect(stats.paragraphs).toBe(1)
    })

    it('counts lines via newline splits', () => {
      const stats = analyzeText('line1\nline2\nline3')
      expect(stats.lines).toBe(3)
      expect(stats.words).toBe(3)
    })

    it('handles CRLF and CR line endings', () => {
      expect(analyzeText('a\r\nb\rc').lines).toBe(3)
      expect(analyzeText('a\rb').lines).toBe(2)
    })

    it('counts paragraphs separated by blank lines', () => {
      const stats = analyzeText('para1\n\npara2\n\npara3')
      expect(stats.paragraphs).toBe(3)
    })

    it('ignores whitespace-only paragraphs', () => {
      const stats = analyzeText('para1\n\n   \n\npara2')
      expect(stats.paragraphs).toBe(2)
    })

    it('counts CJK characters as individual words', () => {
      const stats = analyzeText('你好世界')
      expect(stats.characters).toBe(4)
      expect(stats.charactersNoSpaces).toBe(4)
      expect(stats.words).toBe(4) // 4 CJK chars
      expect(stats.sentences).toBe(1) // no punctuation, fallback to 1
    })

    it('counts mixed CJK + English words', () => {
      const stats = analyzeText('hello 你好 world')
      // English: hello, world = 2 words; CJK: 你, 好 = 2 words -> 4 total
      expect(stats.words).toBe(4)
    })

    it('counts CJK sentences with Chinese punctuation', () => {
      const stats = analyzeText('你好。世界！测试？')
      expect(stats.sentences).toBe(3)
    })

    it('computes reading time for a large English text (>= 2 min)', () => {
      // 250 words at 200 wpm -> ceil(1.25) = 2 minutes
      const text = `${Array.from({ length: 250 }, (_, i) => `word${i}`).join(' ')}.`
      const stats = analyzeText(text)
      expect(stats.words).toBeGreaterThanOrEqual(250)
      expect(stats.readingTimeMin).toBe(2)
    })

    it('clamps reading time to a minimum of 1 minute for small text', () => {
      const stats = analyzeText('one two three')
      expect(stats.readingTimeMin).toBe(1)
    })

    it('charactersNoSpaces excludes all whitespace, not just spaces', () => {
      const stats = analyzeText('a b\tc\nd')
      expect(stats.characters).toBe(7) // a, space, b, tab, c, newline, d
      expect(stats.charactersNoSpaces).toBe(4) // a b c d
    })

    it('treats a single trailing sentence without punctuation as one sentence', () => {
      const stats = analyzeText('just some words here')
      expect(stats.sentences).toBe(1)
    })
  })
})
