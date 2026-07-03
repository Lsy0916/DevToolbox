/**
 * UUID 生成器工具集
 *
 * - 支持 v4（随机）、v1（时间戳 + 随机节点）、nil（全零）三种版本
 * - v4 优先使用 crypto.randomUUID，降级手动拼装并设置版本/变体位
 * - 支持批量生成、连字符与大写后处理
 */
import type { UuidOptions, UuidVersion } from '@/types'

// 生成单个 v4 UUID（优先使用 crypto.randomUUID，降级手动拼装）
function generateV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // 降级：手动用 getRandomValues 生成 16 字节并设置版本/变体位
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6]! & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8]! & 0x3f) | 0x80 // variant 10
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`
}

// 生成单个 v1 UUID（时间戳 + 随机节点，简化版）
function generateV1(): string {
  // 1582-10-15 00:00:00 UTC 的 Unix 毫秒时间戳
  const gregorianOffsetMs = -12219292800000
  const timestamp100ns = BigInt(Date.now() - gregorianOffsetMs) * 10000n

  const timeLow = Number(timestamp100ns & 0xffffffffn)
  const timeMid = Number((timestamp100ns >> 32n) & 0xffffn)
  // time_hi 前 4 位为 version（1），后 12 位为时间戳高位
  const timeHi = Number((timestamp100ns >> 48n) & 0x0fffn) | 0x1000

  // clock_seq：随机 2 字节，高字节前 2 位为 variant（10）
  const seqBytes = new Uint8Array(2)
  crypto.getRandomValues(seqBytes)
  const clockSeqHi = (seqBytes[0]! & 0x3f) | 0x80
  const clockSeqLow = seqBytes[1]!

  // node：6 字节随机，multicast bit 置 1（避免与真实 MAC 冲突）
  const nodeBytes = new Uint8Array(6)
  crypto.getRandomValues(nodeBytes)
  nodeBytes[0] = nodeBytes[0]! | 0x01

  const hex = (n: number, len: number): string => n.toString(16).padStart(len, '0')
  const timeLowStr = hex(timeLow, 8)
  const timeMidStr = hex(timeMid, 4)
  const timeHiStr = hex(timeHi, 4)
  const csStr = `${clockSeqHi.toString(16).padStart(2, '0')}${clockSeqLow.toString(16).padStart(2, '0')}`
  const nodeStr = Array.from(nodeBytes, (b) => b.toString(16).padStart(2, '0')).join('')

  return `${timeLowStr}-${timeMidStr}-${timeHiStr}-${csStr}-${nodeStr}`
}

// nil UUID：全零
const NIL_UUID = '00000000-0000-0000-0000-000000000000'

function generateSingle(version: UuidVersion): string {
  if (version === 'v4') return generateV4()
  if (version === 'v1') return generateV1()
  return NIL_UUID
}

// 批量生成 UUID，应用连字符/大写后处理
export function generateUuid(opts: UuidOptions): string[] {
  const n = Math.max(1, Math.min(1000, opts.count))
  const result: string[] = []
  for (let i = 0; i < n; i++) {
    let uuid = generateSingle(opts.version)
    if (!opts.hyphen) uuid = uuid.replace(/-/g, '')
    if (opts.uppercase) uuid = uuid.toUpperCase()
    result.push(uuid)
  }
  return result
}
