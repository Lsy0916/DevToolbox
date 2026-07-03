/**
 * 颜色转换与配色工具集
 *
 * - 支持 HEX / RGB / HSL / HSV 互转及颜色信息聚合
 * - 提供相对亮度、对比度计算及亮/暗调节
 * - 支持互补色、类比色等配色方案生成与渐变色阶输出
 */
import type { RGBColor, HSLColor, HSVColor, ColorInfo } from '@/types'

export function hexToRgb(hex: string): RGBColor | null {
  const normalized = hex.replace(/^#/, '').trim()
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null
  }

  const full =
    normalized.length === 3
      ? normalized.split('').map((c) => c + c).join('')
      : normalized

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

export function rgbToHex(rgb: RGBColor): string {
  const toHex = (n: number): string => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)))
    return clamped.toString(16).padStart(2, '0')
  }
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

export function rgbToHsl(rgb: RGBColor): HSLColor {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const l = (max + min) / 2

  let h = 0
  let s = 0

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)

    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6
    } else {
      h = ((r - g) / delta + 4) / 6
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export function hslToRgb(hsl: HSLColor): RGBColor {
  const h = hsl.h / 360
  const s = hsl.s / 100
  const l = hsl.l / 100

  let r: number
  let g: number
  let b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      let tt = t
      if (tt < 0) tt += 1
      if (tt > 1) tt -= 1
      if (tt < 1 / 6) return p + (q - p) * 6 * tt
      if (tt < 1 / 2) return q
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

export function rgbToHsv(rgb: RGBColor): HSVColor {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  const s = max === 0 ? 0 : delta / max
  const v = max

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6
    } else {
      h = ((r - g) / delta + 4) / 6
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  }
}

export function getColorInfo(hex: string): ColorInfo | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null

  return {
    hex: rgbToHex(rgb),
    rgb,
    hsl: rgbToHsl(rgb),
    hsv: rgbToHsv(rgb),
  }
}

export function relativeLuminance(rgb: RGBColor): number {
  const channel = (c: number): number => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
}

export function contrastRatio(rgb1: RGBColor, rgb2: RGBColor): number {
  const l1 = relativeLuminance(rgb1)
  const l2 = relativeLuminance(rgb2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export type ColorScheme = 'complementary' | 'analogous' | 'triadic' | 'tetradic'

export function generatePalette(hex: string, scheme: ColorScheme): string[] {
  const rgb = hexToRgb(hex)
  if (!rgb) return []

  const hsl = rgbToHsl(rgb)
  const rotations: Record<ColorScheme, number[]> = {
    complementary: [0, 180],
    analogous: [-30, 0, 30],
    triadic: [0, 120, 240],
    tetradic: [0, 90, 180, 270],
  }

  return rotations[scheme].map((offset) => {
    const newH = (hsl.h + offset + 360) % 360
    return rgbToHex(hslToRgb({ h: newH, s: hsl.s, l: hsl.l }))
  })
}

// 调亮颜色（amount: 0-100，HSL 亮度增量）
export function lightenColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const hsl = rgbToHsl(rgb)
  const newL = Math.max(0, Math.min(100, hsl.l + amount))
  return rgbToHex(hslToRgb({ h: hsl.h, s: hsl.s, l: newL }))
}

// 调暗颜色
export function darkenColor(hex: string, amount: number): string {
  return lightenColor(hex, -amount)
}

// 两色之间生成渐变色阶（含首尾）
export function gradientBetween(hex1: string, hex2: string, steps: number): string[] {
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)
  if (!rgb1 || !rgb2 || steps < 2) return []
  const result: string[] = []
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t)
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t)
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t)
    result.push(rgbToHex({ r, g, b }))
  }
  return result
}

// 生成 CSS 线性渐变字符串
export function cssGradient(colors: string[], angle: number = 90): string {
  if (!colors.length) return ''
  return `linear-gradient(${angle}deg, ${colors.join(', ')})`
}
