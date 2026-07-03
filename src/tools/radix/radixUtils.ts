/**
 * 进制转换工具集
 *
 * - 支持 2-36 进制之间的任意转换
 * - 整数走 BigInt 任意精度路径，小数走 Number 路径
 * - 提供进制合法性校验与带分隔符的分组输出
 */
export interface RadixPreset {
  value: number
  labelKey: string
}

export const RADIX_PRESETS: RadixPreset[] = [
  { value: 2, labelKey: 'tools.radix.presets.bin' },
  { value: 8, labelKey: 'tools.radix.presets.oct' },
  { value: 10, labelKey: 'tools.radix.presets.dec' },
  { value: 16, labelKey: 'tools.radix.presets.hex' },
]

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

function charValue(ch: string): number {
  const c = ch.toLowerCase()
  if (c >= '0' && c <= '9') return c.charCodeAt(0) - 48
  if (c >= 'a' && c <= 'z') return c.charCodeAt(0) - 97 + 10
  return -1
}

// 校验字符串在指定进制下是否合法
export function isValidInBase(value: string, base: number): boolean {
  if (!value) return false
  const v = value.trim().toLowerCase()
  for (const ch of v) {
    if (charValue(ch) < 0 || charValue(ch) >= base) return false
  }
  return true
}

// BigInt 路径：解析任意长度整数
function parseBigIntInBase(value: string, base: number): bigint {
  const v = value.trim().toLowerCase()
  let result = 0n
  const b = BigInt(base)
  for (const ch of v) {
    const d = charValue(ch)
    if (d < 0 || d >= base) throw new Error(`Invalid digit '${ch}' for base ${base}`)
    result = result * b + BigInt(d)
  }
  return result
}

function bigIntToBase(value: bigint, base: number): string {
  if (value === 0n) return '0'
  const b = BigInt(base)
  let n = value
  let out = ''
  while (n > 0n) {
    const d = Number(n % b)
    out = DIGITS[d] + out
    n = n / b
  }
  return out
}

export interface RadixResult {
  output: string
  decimal: string
  isBigInt: boolean
  error?: string
}

// 主转换：支持 2-36 进制，整数走 BigInt 任意精度；小数走 Number（精度有限）
export function convertRadix(value: string, fromBase: number, toBase: number): RadixResult {
  const v = value.trim()
  if (!v) return { output: '', decimal: '', isBigInt: false }

  if (fromBase < 2 || fromBase > 36) return { output: '', decimal: '', isBigInt: false, error: 'base-range' }
  if (toBase < 2 || toBase > 36) return { output: '', decimal: '', isBigInt: false, error: 'base-range' }

  if (!isValidInBase(v, fromBase)) return { output: '', decimal: '', isBigInt: false, error: 'invalid' }

  // 小数路径
  if (v.includes('.')) {
    const num = parseIntSafe(v, fromBase)
    if (num === null) return { output: '', decimal: '', isBigInt: false, error: 'invalid' }
    const intPart = Math.floor(num)
    const intStr = intPart.toString(toBase)
    return {
      output: intStr,
      decimal: num.toString(),
      isBigInt: false,
    }
  }

  // 整数路径：BigInt
  try {
    const big = parseBigIntInBase(v, fromBase)
    return {
      output: bigIntToBase(big, toBase),
      decimal: big.toString(),
      isBigInt: big > BigInt(Number.MAX_SAFE_INTEGER),
    }
  } catch (e) {
    return { output: '', decimal: '', isBigInt: false, error: e instanceof Error ? e.message : 'invalid' }
  }
}

// Number 路径解析（用于小数 / 简单场景）
export function parseIntSafe(value: string, base: number): number | null {
  const v = value.trim().toLowerCase()
  if (!v) return null
  const num = Number.parseInt(v, base)
  return Number.isNaN(num) ? null : num
}

// 带分组的输出（如 1111 0000）
export function formatWithSeparator(value: string, groupSize: number = 4): string {
  if (!value) return ''
  // 从右往左分组
  const reversed = value.split('').reverse().join('')
  const groups: string[] = []
  for (let i = 0; i < reversed.length; i += groupSize) {
    groups.push(reversed.slice(i, i + groupSize))
  }
  return groups.join(' ').split('').reverse().join('')
}
