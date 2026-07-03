import { describe, it, expect } from 'vitest'
import { generatePassword, estimateStrength } from './passwordUtils'
import type { PasswordOptions } from '@/types'

const AMBIGUOUS = new Set('0O1IlI|`\'";:'.split(''))
const SYMBOL_SET = new Set('!@#$%^&*()_+-=[]{}|;:,.<>?'.split(''))

describe('passwordUtils', () => {
  // ---------- generatePassword ----------
  describe('generatePassword', () => {
    const baseOpts: PasswordOptions = {
      length: 16,
      upper: true,
      lower: true,
      digits: true,
      symbols: true,
      excludeAmbiguous: false,
      count: 1,
    }

    it('returns the requested count of passwords', () => {
      expect(generatePassword({ ...baseOpts, count: 5 })).toHaveLength(5)
    })
    it('returns a single password with count=1', () => {
      expect(generatePassword(baseOpts)).toHaveLength(1)
    })
    it('generates passwords of the requested length', () => {
      expect(generatePassword({ ...baseOpts, length: 20 })[0]).toHaveLength(20)
    })
    it('generates passwords of length 1', () => {
      expect(generatePassword({ ...baseOpts, length: 1 })[0]).toHaveLength(1)
    })
    it('generates empty string for length 0', () => {
      expect(generatePassword({ ...baseOpts, length: 0 })[0]).toBe('')
    })

    it('uses only uppercase letters when only upper is enabled', () => {
      const pwd = generatePassword({ ...baseOpts, upper: true, lower: false, digits: false, symbols: false, length: 100 })[0]
      expect(pwd).toMatch(/^[A-Z]+$/)
    })
    it('uses only lowercase letters when only lower is enabled', () => {
      const pwd = generatePassword({ ...baseOpts, upper: false, lower: true, digits: false, symbols: false, length: 100 })[0]
      expect(pwd).toMatch(/^[a-z]+$/)
    })
    it('uses only digits when only digits is enabled', () => {
      const pwd = generatePassword({ ...baseOpts, upper: false, lower: false, digits: true, symbols: false, length: 100 })[0]
      expect(pwd).toMatch(/^[0-9]+$/)
    })
    it('uses only symbols when only symbols is enabled', () => {
      const pwd = generatePassword({ ...baseOpts, upper: false, lower: false, digits: false, symbols: true, length: 100 })[0]
      for (const ch of pwd) {
        expect(SYMBOL_SET.has(ch)).toBe(true)
      }
    })

    it('excludes ambiguous characters when excludeAmbiguous is true', () => {
      const result = generatePassword({ ...baseOpts, excludeAmbiguous: true, count: 10, length: 50 })
      for (const pwd of result) {
        for (const ch of pwd) {
          expect(AMBIGUOUS.has(ch)).toBe(false)
        }
      }
    })
    it('excludes 0 and 1 from digits when excludeAmbiguous is true', () => {
      const pwd = generatePassword({
        ...baseOpts, upper: false, lower: false, digits: true, symbols: false,
        excludeAmbiguous: true, length: 200,
      })[0]
      expect(pwd).not.toContain('0')
      expect(pwd).not.toContain('1')
    })
    it('excludes | ; : from symbols when excludeAmbiguous is true', () => {
      const pwd = generatePassword({
        ...baseOpts, upper: false, lower: false, digits: false, symbols: true,
        excludeAmbiguous: true, length: 200,
      })[0]
      expect(pwd).not.toContain('|')
      expect(pwd).not.toContain(';')
      expect(pwd).not.toContain(':')
    })

    it('returns an empty array when no character sets are enabled', () => {
      expect(generatePassword({ ...baseOpts, upper: false, lower: false, digits: false, symbols: false })).toEqual([])
    })
    it('returns an empty array for count 0', () => {
      expect(generatePassword({ ...baseOpts, count: 0 })).toEqual([])
    })
    it('returns an empty array for negative count', () => {
      expect(generatePassword({ ...baseOpts, count: -3 })).toEqual([])
    })

    it('generates distinct passwords across a batch', () => {
      const result = generatePassword({ ...baseOpts, count: 20, length: 32 })
      expect(new Set(result).size).toBe(20)
    })
  })

  // ---------- estimateStrength ----------
  describe('estimateStrength', () => {
    it('returns score 0 and entropy 0 for an empty password', () => {
      expect(estimateStrength('')).toEqual({ score: 0, entropy: 0 })
    })

    it('returns score 0 for a short lowercase password', () => {
      const result = estimateStrength('abc')
      expect(result.score).toBe(0)
      expect(result.entropy).toBeLessThan(28)
    })

    it('returns score 1 when entropy reaches 28', () => {
      // 'abcdef' → 6 * log2(26) ≈ 28.2 → 28
      const result = estimateStrength('abcdef')
      expect(result.entropy).toBeGreaterThanOrEqual(28)
      expect(result.entropy).toBeLessThan(36)
      expect(result.score).toBe(1)
    })

    it('returns score 2 when entropy reaches 36', () => {
      // 'abcdefgh' → 8 * log2(26) ≈ 37.6 → 38
      const result = estimateStrength('abcdefgh')
      expect(result.entropy).toBeGreaterThanOrEqual(36)
      expect(result.entropy).toBeLessThan(60)
      expect(result.score).toBe(2)
    })

    it('returns score 3 when entropy reaches 60', () => {
      const result = estimateStrength('abcdefghijklm')
      expect(result.entropy).toBeGreaterThanOrEqual(60)
      expect(result.entropy).toBeLessThan(128)
      expect(result.score).toBe(3)
    })

    it('returns score 4 for a very strong mixed password', () => {
      const result = estimateStrength('MyV3ry$tr0ngP@ssw0rd!2024')
      expect(result.score).toBe(4)
      expect(result.entropy).toBeGreaterThanOrEqual(128)
    })

    it('counts the symbol pool as 32 for entropy', () => {
      // '!' → 1 * log2(32) = 5
      expect(estimateStrength('!').entropy).toBe(5)
    })
    it('counts the digit pool as 10 for entropy', () => {
      // '12345678' → 8 * log2(10) ≈ 26.6 → 27
      expect(estimateStrength('12345678').entropy).toBe(27)
    })
    it('counts the uppercase-only pool as 26', () => {
      // 'ABCDEFGH' → 8 * log2(26) ≈ 37.6 → 38
      expect(estimateStrength('ABCDEFGH').entropy).toBe(38)
    })
    it('combines upper+lower into pool 52', () => {
      // 'aA' → 2 * log2(52) ≈ 11.4 → 11
      expect(estimateStrength('aA').entropy).toBe(11)
    })
    it('combines upper+lower+digits+symbols into pool 94', () => {
      // 'aA1!' → 4 * log2(94) ≈ 26.2 → 26
      expect(estimateStrength('aA1!').entropy).toBe(26)
    })

    it('returns entropy rounded to an integer', () => {
      const result = estimateStrength('abc')
      expect(Number.isInteger(result.entropy)).toBe(true)
    })
    it('score never exceeds 4', () => {
      const result = estimateStrength('Abcdefgh123!@#Abcdefgh123!@#Abcdefgh123!@#Abcdefgh123!@#')
      expect(result.score).toBeLessThanOrEqual(4)
    })
    it('score is never negative', () => {
      expect(estimateStrength('').score).toBeGreaterThanOrEqual(0)
      expect(estimateStrength('x').score).toBeGreaterThanOrEqual(0)
    })
  })
})
