/**
 * 哈希计算工具集
 *
 * - 支持 MD5、SHA-1、SHA-256/384/512 文本哈希计算
 * - 支持 HMAC-SHA256/512 生成与恒定时间哈希比对
 * - 支持文件分片哈希计算并带进度回调
 */
import CryptoJS from 'crypto-js'
import HmacSHA256 from 'crypto-js/hmac-sha256'
import HmacSHA512 from 'crypto-js/hmac-sha512'
import type { HashAlgorithm } from '@/types'

export function md5(input: string): string {
  return CryptoJS.MD5(input).toString()
}

export function sha1(input: string): string {
  return CryptoJS.SHA1(input).toString()
}

export async function sha256(input: string): Promise<string> {
  const buffer = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', buffer)
  return bufferToHex(hash)
}

export async function sha384(input: string): Promise<string> {
  const buffer = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-384', buffer)
  return bufferToHex(hash)
}

export async function sha512(input: string): Promise<string> {
  const buffer = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-512', buffer)
  return bufferToHex(hash)
}

export async function hashText(
  input: string,
  algorithm: HashAlgorithm,
): Promise<string> {
  switch (algorithm) {
    case 'MD5':
      return md5(input)
    case 'SHA-1':
      return sha1(input)
    case 'SHA-256':
      return sha256(input)
    case 'SHA-384':
      return sha384(input)
    case 'SHA-512':
      return sha512(input)
  }
}

// HMAC 计算
export function hmacSha256(message: string, secret: string): string {
  return HmacSHA256(message, secret).toString()
}

export function hmacSha512(message: string, secret: string): string {
  return HmacSHA512(message, secret).toString()
}

// 哈希值比对（恒定时间，防时序攻击；大小写不敏感）
export function compareHash(actual: string, expected: string): boolean {
  const a = actual.trim().toLowerCase()
  const b = expected.trim().toLowerCase()
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export async function hashFile(
  file: File,
  algorithm: HashAlgorithm,
  onProgress?: (percent: number) => void,
): Promise<string> {
  if (algorithm === 'MD5' || algorithm === 'SHA-1') {
    return hashFileWithCryptoJS(file, algorithm, onProgress)
  }
  return hashFileWithWebCrypto(file, algorithm, onProgress)
}

async function hashFileWithCryptoJS(
  file: File,
  algorithm: HashAlgorithm,
  onProgress?: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunkSize = 2 * 1024 * 1024
    const chunks = Math.ceil(file.size / chunkSize)
    let currentChunk = 0
    const hash = algorithm === 'MD5' ? CryptoJS.algo.MD5.create() : CryptoJS.algo.SHA1.create()
    const reader = new FileReader()

    reader.onload = (e) => {
      if (e.target?.result) {
        const arrayBuffer = e.target.result as ArrayBuffer
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer)
        hash.update(wordArray)
        currentChunk += 1
        if (onProgress) onProgress(Math.round((currentChunk / chunks) * 100))
        if (currentChunk < chunks) {
          loadNext()
        } else {
          resolve(hash.finalize().toString())
        }
      }
    }

    reader.onerror = () => reject(new Error('File read error'))

    function loadNext(): void {
      const start = currentChunk * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      reader.readAsArrayBuffer(file.slice(start, end))
    }

    loadNext()
  })
}

async function hashFileWithWebCrypto(
  file: File,
  algorithm: HashAlgorithm,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const buffer = await file.arrayBuffer()
  if (onProgress) onProgress(100)
  const hash = await crypto.subtle.digest(algorithm, buffer)
  return bufferToHex(hash)
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const hexChars: string[] = []
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]!
    hexChars.push(b.toString(16).padStart(2, '0'))
  }
  return hexChars.join('')
}
