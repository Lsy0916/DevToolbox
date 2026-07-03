import { describe, it, expect } from 'vitest'
import { generateLorem } from './loremUtils'
import type { LoremUnit } from './loremUtils'

describe('loremUtils', () => {
  describe('generateLorem - word unit', () => {
    it('generates the requested number of words', () => {
      const result = generateLorem('word', 5)
      const words = result.split(' ')
      expect(words).toHaveLength(5)
      // all words are lowercase alphabetic
      for (const w of words) {
        expect(w).toMatch(/^[a-z]+$/)
      }
    })

    it('joins words with single spaces', () => {
      const result = generateLorem('word', 10)
      expect(result.includes('  ')).toBe(false) // no double spaces
    })

    it('clamps count to a minimum of 1', () => {
      expect(generateLorem('word', 0).split(' ')).toHaveLength(1)
      expect(generateLorem('word', -5).split(' ')).toHaveLength(1)
    })

    it('clamps count to a maximum of 100', () => {
      expect(generateLorem('word', 150).split(' ')).toHaveLength(100)
    })

    it('uses the classic opening when startWithClassic is true (deterministic)', () => {
      expect(generateLorem('word', 5, true)).toBe('lorem ipsum dolor sit amet')
      expect(generateLorem('word', 8, true)).toBe(
        'lorem ipsum dolor sit amet consectetur adipiscing elit',
      )
    })

    it('returns the full classic opening when count exceeds its length', () => {
      // The classic opening has 19 words; asking for more still yields 19.
      const result = generateLorem('word', 25, true)
      expect(result.split(' ')).toHaveLength(19)
      expect(result.startsWith('lorem ipsum dolor sit amet')).toBe(true)
      expect(result.endsWith('magna aliqua')).toBe(true)
    })
  })

  describe('generateLorem - sentence unit', () => {
    it('generates the requested number of sentences', () => {
      const result = generateLorem('sentence', 3)
      // Each sentence ends with '.', joined by ' '.
      const parts = result.split('. ')
      expect(parts).toHaveLength(3)
      expect(result.endsWith('.')).toBe(true)
    })

    it('capitalizes the first letter of each sentence and ends with a period', () => {
      const result = generateLorem('sentence', 2)
      for (const sentence of result.split('. ').filter(Boolean)) {
        const trimmed = sentence.replace(/\.$/, '')
        expect(trimmed.charAt(0)).toBe(trimmed.charAt(0).toUpperCase())
      }
    })

    it('clamps sentence count to [1, 100]', () => {
      expect(generateLorem('sentence', 0).split('. ')).toHaveLength(1)
      expect(generateLorem('sentence', 200).split('. ')).toHaveLength(100)
    })

    it('replaces the first sentence with the classic opening when startWithClassic', () => {
      const result = generateLorem('sentence', 2, true)
      expect(result.startsWith('Lorem ipsum dolor sit amet consectetur adipiscing elit.')).toBe(true)
      // still two sentences total
      expect(result.split('. ')).toHaveLength(2)
    })

    it('produces a single classic sentence when count is 1 and startWithClassic', () => {
      expect(generateLorem('sentence', 1, true)).toBe(
        'Lorem ipsum dolor sit amet consectetur adipiscing elit.',
      )
    })
  })

  describe('generateLorem - paragraph unit', () => {
    it('generates the requested number of paragraphs separated by blank lines', () => {
      const result = generateLorem('paragraph', 3)
      const paras = result.split('\n\n')
      expect(paras).toHaveLength(3)
    })

    it('each paragraph contains multiple sentences ending with periods', () => {
      const result = generateLorem('paragraph', 1)
      // a paragraph has 4-8 sentences, so at least one '. '
      expect(result.includes('.')).toBe(true)
      expect(result.endsWith('.')).toBe(true)
    })

    it('clamps paragraph count to [1, 100]', () => {
      expect(generateLorem('paragraph', 0).split('\n\n')).toHaveLength(1)
      expect(generateLorem('paragraph', 999).split('\n\n')).toHaveLength(100)
    })

    it('returns a single paragraph when count is 1 with startWithClassic', () => {
      const result = generateLorem('paragraph', 1, true)
      expect(result.split('\n\n')).toHaveLength(1)
    })
  })

  describe('generateLorem - all units smoke test', () => {
    it('all units produce non-empty strings for count 1', () => {
      const units: LoremUnit[] = ['word', 'sentence', 'paragraph']
      for (const unit of units) {
        const result = generateLorem(unit, 1)
        expect(result.length).toBeGreaterThan(0)
      }
    })
  })
})
