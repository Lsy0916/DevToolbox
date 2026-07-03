import { describe, it, expect } from 'vitest'
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToHsv,
  getColorInfo,
  relativeLuminance,
  contrastRatio,
  generatePalette,
  lightenColor,
  darkenColor,
  gradientBetween,
  cssGradient,
} from './colorUtils'

describe('colorUtils', () => {
  describe('hexToRgb', () => {
    it('converts a 6-digit hex to RGB', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
    })
    it('converts a 3-digit shorthand hex to RGB', () => {
      expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    })
    it('converts hex without the leading #', () => {
      expect(hexToRgb('000000')).toEqual({ r: 0, g: 0, b: 0 })
    })
    it('returns null for invalid input', () => {
      expect(hexToRgb('#xyz')).toBeNull()
      expect(hexToRgb('')).toBeNull()
      expect(hexToRgb('#12345')).toBeNull()
    })
  })

  describe('rgbToHex', () => {
    it('converts RGB to a hex string', () => {
      expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000')
    })
    it('pads each channel to two digits', () => {
      expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000')
    })
    it('clamps out-of-range values', () => {
      expect(rgbToHex({ r: 300, g: -10, b: 128 })).toBe('#ff0080')
    })
    it('rounds fractional values', () => {
      expect(rgbToHex({ r: 127.4, g: 127.6, b: 0 })).toBe('#7f8000')
    })
  })

  describe('rgbToHsl', () => {
    it('converts red to HSL', () => {
      expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 })
    })
    it('converts green to HSL', () => {
      expect(rgbToHsl({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, l: 50 })
    })
    it('converts black to HSL with zero saturation', () => {
      expect(rgbToHsl({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, l: 0 })
    })
    it('converts white to HSL with full lightness', () => {
      expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 })
    })
  })

  describe('hslToRgb', () => {
    it('converts red HSL back to RGB', () => {
      expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 })
    })
    it('converts green HSL back to RGB', () => {
      expect(hslToRgb({ h: 120, s: 100, l: 50 })).toEqual({ r: 0, g: 255, b: 0 })
    })
    it('converts zero-saturation black', () => {
      expect(hslToRgb({ h: 0, s: 0, l: 0 })).toEqual({ r: 0, g: 0, b: 0 })
    })
    it('converts zero-saturation white', () => {
      expect(hslToRgb({ h: 0, s: 0, l: 100 })).toEqual({ r: 255, g: 255, b: 255 })
    })
  })

  describe('rgbToHsv', () => {
    it('converts red to HSV', () => {
      expect(rgbToHsv({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, v: 100 })
    })
    it('converts black to HSV with zero value', () => {
      expect(rgbToHsv({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, v: 0 })
    })
    it('converts white to HSV with zero saturation', () => {
      expect(rgbToHsv({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, v: 100 })
    })
    it('converts green to HSV', () => {
      expect(rgbToHsv({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, v: 100 })
    })
  })

  describe('getColorInfo', () => {
    it('returns full color info for a valid hex', () => {
      const info = getColorInfo('#ff0000')
      expect(info).not.toBeNull()
      expect(info?.hex).toBe('#ff0000')
      expect(info?.rgb).toEqual({ r: 255, g: 0, b: 0 })
      expect(info?.hsl).toEqual({ h: 0, s: 100, l: 50 })
      expect(info?.hsv).toEqual({ h: 0, s: 100, v: 100 })
    })
    it('returns null for an invalid hex', () => {
      expect(getColorInfo('not-a-color')).toBeNull()
    })
  })

  describe('relativeLuminance', () => {
    it('returns 0 for black', () => {
      expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0)
    })
    it('returns 1 for white', () => {
      expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5)
    })
  })

  describe('contrastRatio', () => {
    it('returns 21 for white vs black', () => {
      expect(contrastRatio({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 })).toBeCloseTo(21, 5)
    })
    it('returns 1 for identical colors', () => {
      expect(contrastRatio({ r: 128, g: 128, b: 128 }, { r: 128, g: 128, b: 128 })).toBe(1)
    })
    it('is symmetric', () => {
      const a = { r: 255, g: 0, b: 0 }
      const b = { r: 0, g: 0, b: 255 }
      expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 5)
    })
  })

  describe('generatePalette', () => {
    it('generates a complementary palette with 2 colors', () => {
      const palette = generatePalette('#ff0000', 'complementary')
      expect(palette).toHaveLength(2)
      expect(palette[0]).toBe('#ff0000')
      expect(palette[1]).toBe('#00ffff')
    })
    it('generates an analogous palette with 3 colors', () => {
      expect(generatePalette('#ff0000', 'analogous')).toHaveLength(3)
    })
    it('generates a triadic palette with 3 colors', () => {
      expect(generatePalette('#ff0000', 'triadic')).toHaveLength(3)
    })
    it('generates a tetradic palette with 4 colors', () => {
      expect(generatePalette('#ff0000', 'tetradic')).toHaveLength(4)
    })
    it('returns an empty array for an invalid hex', () => {
      expect(generatePalette('invalid', 'complementary')).toEqual([])
    })
  })

  describe('lightenColor / darkenColor', () => {
    it('lightens black toward gray', () => {
      expect(lightenColor('#000000', 50)).toBe('#808080')
    })
    it('clamps lightness at 100', () => {
      expect(lightenColor('#ffffff', 50)).toBe('#ffffff')
    })
    it('darkens white toward gray', () => {
      expect(darkenColor('#ffffff', 50)).toBe('#808080')
    })
    it('returns the original hex for invalid input', () => {
      expect(lightenColor('invalid', 20)).toBe('invalid')
    })
  })

  describe('gradientBetween', () => {
    it('generates a gradient with the requested number of steps', () => {
      const gradient = gradientBetween('#000000', '#ffffff', 3)
      expect(gradient).toEqual(['#000000', '#808080', '#ffffff'])
    })
    it('includes the endpoints for a 2-step gradient', () => {
      expect(gradientBetween('#ff0000', '#00ff00', 2)).toEqual(['#ff0000', '#00ff00'])
    })
    it('returns an empty array for fewer than 2 steps', () => {
      expect(gradientBetween('#000000', '#ffffff', 1)).toEqual([])
    })
    it('returns an empty array for invalid input', () => {
      expect(gradientBetween('invalid', '#ffffff', 3)).toEqual([])
    })
  })

  describe('cssGradient', () => {
    it('builds a linear-gradient string with the given angle', () => {
      expect(cssGradient(['#ff0000', '#00ff00'], 90)).toBe('linear-gradient(90deg, #ff0000, #00ff00)')
    })
    it('defaults the angle to 90', () => {
      expect(cssGradient(['#ff0000'])).toBe('linear-gradient(90deg, #ff0000)')
    })
    it('returns an empty string for no colors', () => {
      expect(cssGradient([], 45)).toBe('')
    })
  })
})
