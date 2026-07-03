import { describe, it, expect } from 'vitest'
import { generateUuid } from './uuidUtils'
import type { UuidOptions } from '@/types'

// Case-insensitive regexes so they match both lower and uppercase UUIDs
const V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const V1_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const NIL_UUID = '00000000-0000-0000-0000-000000000000'

describe('uuidUtils', () => {
  // ---------- generateUuid v4 ----------
  describe('generateUuid v4', () => {
    const opts: UuidOptions = { version: 'v4', count: 1, hyphen: true, uppercase: false }

    it('generates a UUID matching the v4 pattern', () => {
      const result = generateUuid(opts)
      expect(result[0]).toMatch(V4_REGEX)
    })
    it('generates the requested count', () => {
      expect(generateUuid({ ...opts, count: 5 })).toHaveLength(5)
    })
    it('removes hyphens when hyphen is false', () => {
      const result = generateUuid({ ...opts, hyphen: false })
      expect(result[0]).not.toContain('-')
      expect(result[0]).toHaveLength(32)
    })
    it('uppercases the UUID when uppercase is true', () => {
      const result = generateUuid({ ...opts, uppercase: true })
      expect(result[0]).toBe(result[0].toUpperCase())
      expect(result[0]).toMatch(V4_REGEX)
    })
    it('removes hyphens and uppercases together', () => {
      const result = generateUuid({ ...opts, hyphen: false, uppercase: true })
      expect(result[0]).not.toContain('-')
      expect(result[0]).toBe(result[0].toUpperCase())
      expect(result[0]).toMatch(/^[0-9A-F]{32}$/)
    })
    it('generates unique values across a batch', () => {
      const result = generateUuid({ ...opts, count: 100 })
      expect(new Set(result).size).toBe(100)
    })
    it('generates lowercase by default', () => {
      const [uuid] = generateUuid(opts)
      expect(uuid).toBe(uuid.toLowerCase())
    })
    it('has correct version nibble (4)', () => {
      const [uuid] = generateUuid(opts)
      expect(uuid[14]).toBe('4')
    })
    it('has correct variant nibble (8/9/a/b)', () => {
      const [uuid] = generateUuid(opts)
      expect(['8', '9', 'a', 'b']).toContain(uuid[19])
    })
  })

  // ---------- generateUuid v1 ----------
  describe('generateUuid v1', () => {
    const opts: UuidOptions = { version: 'v1', count: 1, hyphen: true, uppercase: false }

    it('generates a UUID matching the v1 pattern', () => {
      const result = generateUuid(opts)
      expect(result[0]).toMatch(V1_REGEX)
    })
    it('generates the requested count', () => {
      expect(generateUuid({ ...opts, count: 3 })).toHaveLength(3)
    })
    it('generates unique values across a batch', () => {
      const result = generateUuid({ ...opts, count: 50 })
      expect(new Set(result).size).toBe(50)
    })
    it('uppercases the UUID when uppercase is true', () => {
      const result = generateUuid({ ...opts, uppercase: true })
      expect(result[0]).toBe(result[0].toUpperCase())
      expect(result[0]).toMatch(V1_REGEX)
    })
    it('removes hyphens when hyphen is false', () => {
      const result = generateUuid({ ...opts, hyphen: false })
      expect(result[0]).not.toContain('-')
      expect(result[0]).toHaveLength(32)
    })
    it('has correct version nibble (1)', () => {
      const [uuid] = generateUuid(opts)
      expect(uuid[14]).toBe('1')
    })
    it('has correct variant nibble (8/9/a/b)', () => {
      const [uuid] = generateUuid(opts)
      expect(['8', '9', 'a', 'b']).toContain(uuid[19])
    })
  })

  // ---------- generateUuid nil ----------
  describe('generateUuid nil', () => {
    const opts: UuidOptions = { version: 'nil', count: 1, hyphen: true, uppercase: false }

    it('returns the all-zero nil UUID', () => {
      expect(generateUuid(opts)[0]).toBe(NIL_UUID)
    })
    it('generates multiple nil UUIDs', () => {
      expect(generateUuid({ ...opts, count: 3 })).toEqual([NIL_UUID, NIL_UUID, NIL_UUID])
    })
    it('strips hyphens when hyphen is false', () => {
      expect(generateUuid({ ...opts, hyphen: false })[0]).toBe('0'.repeat(32))
    })
    it('returns all zeros in uppercase mode (unchanged)', () => {
      expect(generateUuid({ ...opts, uppercase: true })[0]).toBe(NIL_UUID)
    })
  })

  // ---------- count clamping ----------
  describe('count clamping', () => {
    it('clamps a count below 1 up to 1', () => {
      const result = generateUuid({ version: 'nil', count: 0, hyphen: true, uppercase: false })
      expect(result).toHaveLength(1)
    })
    it('clamps a negative count up to 1', () => {
      const result = generateUuid({ version: 'nil', count: -5, hyphen: true, uppercase: false })
      expect(result).toHaveLength(1)
    })
    it('clamps a count above 1000 down to 1000', () => {
      const result = generateUuid({ version: 'nil', count: 5000, hyphen: true, uppercase: false })
      expect(result).toHaveLength(1000)
    })
    it('accepts count = 1000 exactly', () => {
      const result = generateUuid({ version: 'nil', count: 1000, hyphen: true, uppercase: false })
      expect(result).toHaveLength(1000)
    })
  })
})
