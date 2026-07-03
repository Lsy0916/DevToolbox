import { describe, it, expect } from 'vitest'
import {
  RADIX_PRESETS,
  isValidInBase,
  convertRadix,
  parseIntSafe,
  formatWithSeparator,
} from './radixUtils'

describe('radixUtils', () => {
  describe('RADIX_PRESETS', () => {
    it('exposes bin/oct/dec/hex presets', () => {
      expect(RADIX_PRESETS).toHaveLength(4)
      const values = RADIX_PRESETS.map((p) => p.value)
      expect(values).toEqual([2, 8, 10, 16])
    })

    it('each preset has a labelKey', () => {
      for (const preset of RADIX_PRESETS) {
        expect(typeof preset.labelKey).toBe('string')
        expect(preset.labelKey.startsWith('tools.radix.presets.')).toBe(true)
      }
    })
  })

  describe('isValidInBase', () => {
    it('accepts valid digits for a given base', () => {
      expect(isValidInBase('ff', 16)).toBe(true)
      expect(isValidInBase('FF', 16)).toBe(true)
      expect(isValidInBase('255', 10)).toBe(true)
      expect(isValidInBase('11111111', 2)).toBe(true)
      expect(isValidInBase('377', 8)).toBe(true)
      expect(isValidInBase('z', 36)).toBe(true)
    })

    it('rejects digits outside the base range', () => {
      expect(isValidInBase('ff', 10)).toBe(false) // f not valid in base 10
      expect(isValidInBase('8', 8)).toBe(false) // 8 not valid in octal
      expect(isValidInBase('2', 2)).toBe(false) // 2 not valid in binary
      expect(isValidInBase('g', 16)).toBe(false) // g not valid in hex
    })

    it('rejects non-digit characters', () => {
      expect(isValidInBase('1.5', 10)).toBe(false)
      expect(isValidInBase('1-2', 10)).toBe(false)
      expect(isValidInBase('abc!', 16)).toBe(false)
    })

    it('rejects empty input', () => {
      expect(isValidInBase('', 10)).toBe(false)
    })

    it('trims surrounding whitespace before checking', () => {
      expect(isValidInBase('  ff  ', 16)).toBe(true)
    })
  })

  describe('convertRadix', () => {
    it('converts hex to decimal (ff -> 255)', () => {
      expect(convertRadix('ff', 16, 10)).toEqual({
        output: '255',
        decimal: '255',
        isBigInt: false,
      })
    })

    it('converts decimal to hex (255 -> ff)', () => {
      expect(convertRadix('255', 10, 16)).toEqual({
        output: 'ff',
        decimal: '255',
        isBigInt: false,
      })
    })

    it('converts binary to decimal', () => {
      expect(convertRadix('11111111', 2, 10).output).toBe('255')
      expect(convertRadix('11111111', 2, 10).decimal).toBe('255')
    })

    it('converts octal to decimal', () => {
      expect(convertRadix('377', 8, 10).output).toBe('255')
    })

    it('converts decimal to binary', () => {
      expect(convertRadix('255', 10, 2).output).toBe('11111111')
    })

    it('converts decimal to octal', () => {
      expect(convertRadix('255', 10, 8).output).toBe('377')
    })

    it('round-trips hex -> dec -> hex', () => {
      const dec = convertRadix('deadbeef', 16, 10)
      const back = convertRadix(dec.output, 10, 16)
      expect(back.output).toBe('deadbeef')
    })

    it('supports base 36 with alphanumeric digits', () => {
      expect(convertRadix('z', 36, 10).output).toBe('35')
      expect(convertRadix('10', 36, 10).output).toBe('36')
    })

    it('uses BigInt path and flags very large numbers', () => {
      const big = '99999999999999999999' // 20 digits, exceeds MAX_SAFE_INTEGER
      const result = convertRadix(big, 10, 16)
      expect(result.isBigInt).toBe(true)
      expect(result.decimal).toBe(big)
      // round-trip back to decimal
      const back = convertRadix(result.output, 16, 10)
      expect(back.decimal).toBe(big)
    })

    it('does not flag numbers within safe integer range', () => {
      expect(convertRadix('9007199254740991', 10, 16).isBigInt).toBe(false) // MAX_SAFE_INTEGER
    })

    it('handles zero', () => {
      expect(convertRadix('0', 10, 16).output).toBe('0')
      expect(convertRadix('0', 10, 16).decimal).toBe('0')
    })

    it('returns empty result for empty input', () => {
      expect(convertRadix('', 10, 2)).toEqual({
        output: '',
        decimal: '',
        isBigInt: false,
      })
      expect(convertRadix('   ', 10, 2)).toEqual({
        output: '',
        decimal: '',
        isBigInt: false,
      })
    })

    it('returns base-range error for bases outside 2-36', () => {
      expect(convertRadix('10', 1, 10)).toEqual({
        output: '',
        decimal: '',
        isBigInt: false,
        error: 'base-range',
      })
      expect(convertRadix('10', 37, 10)).toEqual({
        output: '',
        decimal: '',
        isBigInt: false,
        error: 'base-range',
      })
      expect(convertRadix('10', 10, 1)).toEqual({
        output: '',
        decimal: '',
        isBigInt: false,
        error: 'base-range',
      })
      expect(convertRadix('10', 10, 37)).toEqual({
        output: '',
        decimal: '',
        isBigInt: false,
        error: 'base-range',
      })
    })

    it('returns invalid error for digits not valid in source base', () => {
      expect(convertRadix('ff', 10, 2).error).toBe('invalid')
      expect(convertRadix('8', 8, 10).error).toBe('invalid')
      // The decimal point is not a valid digit, so it is rejected up front.
      expect(convertRadix('1.5', 10, 2).error).toBe('invalid')
    })
  })

  describe('parseIntSafe', () => {
    it('parses valid integers in a given base', () => {
      expect(parseIntSafe('ff', 16)).toBe(255)
      expect(parseIntSafe('255', 10)).toBe(255)
      expect(parseIntSafe('11111111', 2)).toBe(255)
      expect(parseIntSafe('377', 8)).toBe(255)
    })

    it('is case-insensitive', () => {
      expect(parseIntSafe('FF', 16)).toBe(255)
    })

    it('returns null for empty input', () => {
      expect(parseIntSafe('', 10)).toBeNull()
      expect(parseIntSafe('   ', 10)).toBeNull()
    })

    it('returns null for non-numeric input', () => {
      expect(parseIntSafe('xyz', 10)).toBeNull()
    })

    it('parses the leading integer portion when given a decimal-like string', () => {
      // Number.parseInt stops at the '.'
      expect(parseIntSafe('1.5', 10)).toBe(1)
    })
  })

  describe('formatWithSeparator', () => {
    it('groups binary digits from the right by 4', () => {
      expect(formatWithSeparator('11110000', 4)).toBe('1111 0000')
      expect(formatWithSeparator('11111111', 4)).toBe('1111 1111')
    })

    it('handles groups that do not divide evenly', () => {
      expect(formatWithSeparator('123456789', 4)).toBe('1 2345 6789')
    })

    it('uses a custom group size', () => {
      expect(formatWithSeparator('11110000', 2)).toBe('11 11 00 00')
      expect(formatWithSeparator('11110000', 8)).toBe('11110000')
    })

    it('uses default group size of 4', () => {
      expect(formatWithSeparator('11110000')).toBe('1111 0000')
    })

    it('returns empty string for empty input', () => {
      expect(formatWithSeparator('', 4)).toBe('')
    })

    it('handles a short string shorter than the group size', () => {
      expect(formatWithSeparator('ff', 4)).toBe('ff')
      expect(formatWithSeparator('1', 4)).toBe('1')
    })
  })
})
