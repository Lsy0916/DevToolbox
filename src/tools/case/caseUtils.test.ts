import { describe, it, expect } from 'vitest'
import { convertCase, CASE_MODES } from './caseUtils'
import type { CaseMode } from './caseUtils'

describe('caseUtils', () => {
  describe('CASE_MODES', () => {
    it('exposes all 10 case modes', () => {
      expect(CASE_MODES).toHaveLength(10)
      const values = CASE_MODES.map((m) => m.value)
      expect(values).toEqual([
        'upper',
        'lower',
        'title',
        'sentence',
        'camel',
        'pascal',
        'snake',
        'kebab',
        'constant',
        'invert',
      ])
    })

    it('each mode has a labelKey', () => {
      for (const mode of CASE_MODES) {
        expect(typeof mode.labelKey).toBe('string')
        expect(mode.labelKey.startsWith('tools.case.modes.')).toBe(true)
      }
    })
  })

  describe('convertCase', () => {
    const input = 'hello world'

    it('upper: converts to uppercase', () => {
      expect(convertCase(input, 'upper')).toBe('HELLO WORLD')
    })

    it('lower: converts to lowercase', () => {
      expect(convertCase('HELLO WORLD', 'lower')).toBe('hello world')
    })

    it('title: capitalizes the first letter of each word', () => {
      expect(convertCase('hello world', 'title')).toBe('Hello World')
      expect(convertCase('HELLO WORLD', 'title')).toBe('Hello World')
      expect(convertCase('hELLO wORLD', 'title')).toBe('Hello World')
    })

    it('sentence: capitalizes the first letter of each sentence', () => {
      expect(convertCase('hello world', 'sentence')).toBe('Hello world')
      expect(convertCase('hello. world. end', 'sentence')).toBe('Hello. World. End')
    })

    it('camel: lowercases first word, capitalizes the rest', () => {
      expect(convertCase('hello world', 'camel')).toBe('helloWorld')
      expect(convertCase('Hello World', 'camel')).toBe('helloWorld')
      expect(convertCase('some-mixed_case', 'camel')).toBe('someMixedCase')
    })

    it('pascal: capitalizes every word', () => {
      expect(convertCase('hello world', 'pascal')).toBe('HelloWorld')
      expect(convertCase('some-mixed_case', 'pascal')).toBe('SomeMixedCase')
    })

    it('snake: joins lowercase words with underscore', () => {
      expect(convertCase('hello world', 'snake')).toBe('hello_world')
      expect(convertCase('HelloWorld', 'snake')).toBe('hello_world')
      expect(convertCase('some-mixed_case', 'snake')).toBe('some_mixed_case')
    })

    it('kebab: joins lowercase words with hyphen', () => {
      expect(convertCase('hello world', 'kebab')).toBe('hello-world')
      expect(convertCase('HelloWorld', 'kebab')).toBe('hello-world')
      expect(convertCase('some_mixed_case', 'kebab')).toBe('some-mixed-case')
    })

    it('constant: joins uppercase words with underscore', () => {
      expect(convertCase('hello world', 'constant')).toBe('HELLO_WORLD')
      expect(convertCase('HelloWorld', 'constant')).toBe('HELLO_WORLD')
      expect(convertCase('some-mixed_case', 'constant')).toBe('SOME_MIXED_CASE')
    })

    it('invert: swaps the case of every letter', () => {
      expect(convertCase('hello world', 'invert')).toBe('HELLO WORLD')
      expect(convertCase('HELLO WORLD', 'invert')).toBe('hello world')
      expect(convertCase('Hello World', 'invert')).toBe('hELLO wORLD')
      expect(convertCase('MiXeD 123', 'invert')).toBe('mIxEd 123')
    })

    it('handles CONSTANT_CASE input across modes', () => {
      expect(convertCase('CONSTANT_CASE', 'camel')).toBe('constantCase')
      expect(convertCase('CONSTANT_CASE', 'pascal')).toBe('ConstantCase')
      expect(convertCase('CONSTANT_CASE', 'kebab')).toBe('constant-case')
    })

    it('handles camelCase boundaries when tokenizing', () => {
      expect(convertCase('getUserById', 'snake')).toBe('get_user_by_id')
      expect(convertCase('getUserById', 'constant')).toBe('GET_USER_BY_ID')
      expect(convertCase('getUserById', 'kebab')).toBe('get-user-by-id')
    })
  })

  describe('convertCase edge cases', () => {
    it('returns empty string for empty input regardless of mode', () => {
      const modes: CaseMode[] = [
        'upper',
        'lower',
        'title',
        'sentence',
        'camel',
        'pascal',
        'snake',
        'kebab',
        'constant',
        'invert',
      ]
      for (const mode of modes) {
        expect(convertCase('', mode)).toBe('')
      }
    })

    it('returns empty string for null-ish input', () => {
      expect(convertCase(null as unknown as string, 'upper')).toBe('')
      expect(convertCase(undefined as unknown as string, 'upper')).toBe('')
    })

    it('returns the original text for an unknown mode (default branch)', () => {
      expect(convertCase('hello', 'unknown' as CaseMode)).toBe('hello')
    })

    it('handles a single word', () => {
      expect(convertCase('hello', 'upper')).toBe('HELLO')
      expect(convertCase('hello', 'camel')).toBe('hello')
      expect(convertCase('hello', 'pascal')).toBe('Hello')
      expect(convertCase('hello', 'snake')).toBe('hello')
      expect(convertCase('hello', 'constant')).toBe('HELLO')
    })

    it('handles numbers and mixed content', () => {
      expect(convertCase('hello 123 world', 'snake')).toBe('hello_123_world')
      expect(convertCase('hello 123 world', 'camel')).toBe('hello123World')
    })
  })
})
