/**
 * 密码生成与强度评估工具集
 *
 * - 基于字符池与拒绝采样生成无模偏差的安全随机密码
 * - 支持大小写、数字、符号及易混淆字符排除选项
 * - 基于熵位数评估密码强度（0-4 分）
 */
import type { PasswordOptions, PasswordScore, PasswordStrength } from '@/types'

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'
// 易混淆字符集（排除 0/O/1/I/l/I/| 等）
const AMBIGUOUS = new Set('0O1IlI|`\'";:'.split(''))

// 根据选项构建字符池
function buildCharset(opts: PasswordOptions): string {
  let charset = ''
  if (opts.upper) charset += UPPER
  if (opts.lower) charset += LOWER
  if (opts.digits) charset += DIGITS
  if (opts.symbols) charset += SYMBOLS
  if (opts.excludeAmbiguous) {
    charset = charset
      .split('')
      .filter((c) => !AMBIGUOUS.has(c))
      .join('')
  }
  return charset
}

// 拒绝采样生成 [0, max) 内的安全随机整数，避免模偏差
function secureRandomInt(max: number): number {
  if (max <= 0) return 0
  const range = 256 - (256 % max)
  const buf = new Uint8Array(1)
  let val = 0
  do {
    crypto.getRandomValues(buf)
    val = buf[0]!
  } while (val >= range)
  return val % max
}

// 批量生成密码
export function generatePassword(opts: PasswordOptions): string[] {
  const charset = buildCharset(opts)
  if (!charset) return []
  const result: string[] = []
  for (let i = 0; i < opts.count; i++) {
    let pwd = ''
    for (let j = 0; j < opts.length; j++) {
      pwd += charset[secureRandomInt(charset.length)] ?? ''
    }
    result.push(pwd)
  }
  return result
}

// 评估密码强度：基于熵位数映射到 0-4 分
export function estimateStrength(pwd: string): PasswordStrength {
  if (!pwd) return { score: 0, entropy: 0 }
  let poolSize = 0
  if (/[a-z]/.test(pwd)) poolSize += 26
  if (/[A-Z]/.test(pwd)) poolSize += 26
  if (/[0-9]/.test(pwd)) poolSize += 10
  if (/[^a-zA-Z0-9]/.test(pwd)) poolSize += 32
  const entropy = pwd.length * Math.log2(poolSize || 1)
  let score: PasswordScore = 0
  if (entropy >= 128) score = 4
  else if (entropy >= 60) score = 3
  else if (entropy >= 36) score = 2
  else if (entropy >= 28) score = 1
  return { score, entropy: Math.round(entropy) }
}
