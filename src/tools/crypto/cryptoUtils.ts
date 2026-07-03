/**
 * 加解密工具集
 *
 * - 提供 AES（CBC/ECB）对称加解密与密钥生成，基于 crypto-js
 * - 提供 AES-GCM（WebCrypto）及 RSA-OAEP 加解密、RSA 签名验签
 * - 内置 PEM ⇄ 字节、Hex/Base64 编解码转换工具
 */
import CryptoJS from 'crypto-js'

// === AES 对称加解密（crypto-js）===

export type AesMode = 'CBC' | 'ECB'
export type AesPadding = 'Pkcs7' | 'None'
export type AesEncoding = 'Utf8' | 'Base64' | 'Hex'

export interface AesOptions {
  mode: AesMode
  padding: AesPadding
  keyEncoding: AesEncoding
  ivEncoding: AesEncoding
  outputEncoding: 'Base64' | 'Hex'
}

function parseEncoding(text: string, encoding: AesEncoding): CryptoJS.lib.WordArray {
  if (encoding === 'Base64') return CryptoJS.enc.Base64.parse(text)
  if (encoding === 'Hex') return CryptoJS.enc.Hex.parse(text)
  return CryptoJS.enc.Utf8.parse(text)
}

function getMode(mode: AesMode): typeof CryptoJS.mode.CBC {
  return mode === 'CBC' ? CryptoJS.mode.CBC : CryptoJS.mode.ECB
}

function getPadding(padding: AesPadding): typeof CryptoJS.pad.Pkcs7 {
  return padding === 'Pkcs7' ? CryptoJS.pad.Pkcs7 : CryptoJS.pad.NoPadding
}

export function aesEncrypt(plaintext: string, key: string, iv: string, options: AesOptions): string {
  const keyWA = parseEncoding(key, options.keyEncoding)
  const ivWA = options.mode === 'ECB' ? undefined : parseEncoding(iv, options.ivEncoding)
  const encrypted = CryptoJS.AES.encrypt(plaintext, keyWA, {
    mode: getMode(options.mode),
    padding: getPadding(options.padding),
    iv: ivWA,
  })
  return options.outputEncoding === 'Hex'
    ? encrypted.ciphertext.toString(CryptoJS.enc.Hex)
    : encrypted.ciphertext.toString(CryptoJS.enc.Base64)
}

export function aesDecrypt(ciphertext: string, key: string, iv: string, options: AesOptions): string {
  const keyWA = parseEncoding(key, options.keyEncoding)
  const ivWA = options.mode === 'ECB' ? undefined : parseEncoding(iv, options.ivEncoding)

  let cipherParams: CryptoJS.lib.CipherParams
  if (options.outputEncoding === 'Hex') {
    cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext: CryptoJS.enc.Hex.parse(ciphertext) })
  } else {
    cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext: CryptoJS.enc.Base64.parse(ciphertext) })
  }

  const decrypted = CryptoJS.AES.decrypt(cipherParams, keyWA, {
    mode: getMode(options.mode),
    padding: getPadding(options.padding),
    iv: ivWA,
  })
  return decrypted.toString(CryptoJS.enc.Utf8)
}

// 生成随机 AES 密钥（256 位）和 IV（128 位）
export function generateAesKey(): { key: string; iv: string } {
  const key = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex)
  const iv = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex)
  return { key, iv }
}

// === AES-GCM（WebCrypto，实验性）===

export async function aesGcmEncrypt(plaintext: string, keyHex: string, ivHex: string): Promise<string> {
  const keyBytes = hexToBytes(keyHex)
  const ivBytes = hexToBytes(ivHex)
  const data = new TextEncoder().encode(plaintext)

  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt'])
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: ivBytes }, cryptoKey, data)
  return bytesToBase64(new Uint8Array(encrypted))
}

export async function aesGcmDecrypt(ciphertextB64: string, keyHex: string, ivHex: string): Promise<string> {
  const keyBytes = hexToBytes(keyHex)
  const ivBytes = hexToBytes(ivHex)
  const data = base64ToBytes(ciphertextB64)

  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt'])
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, cryptoKey, data)
  return new TextDecoder().decode(decrypted)
}

// === RSA 非对称（WebCrypto）===

export type RsaKeySize = 1024 | 2048 | 4096

// RSA-OAEP 加解密（需要单独生成 OAEP 密钥）
export async function generateRsaOaepKeyPair(size: RsaKeySize): Promise<{ publicKeyPem: string; privateKeyPem: string }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: size,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt'],
  )

  const publicKeySpki = await crypto.subtle.exportKey('spki', keyPair.publicKey)
  const privateKeyPkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

  return {
    publicKeyPem: spkiToPem(new Uint8Array(publicKeySpki)),
    privateKeyPem: pkcs8ToPem(new Uint8Array(privateKeyPkcs8)),
  }
}

// RSA-OAEP 公钥加密
export async function rsaEncrypt(plaintext: string, publicKeyPem: string): Promise<string> {
  const spki = pemToSpki(publicKeyPem)
  const cryptoKey = await crypto.subtle.importKey('spki', spki, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt'])
  const data = new TextEncoder().encode(plaintext)
  const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, cryptoKey, data)
  return bytesToBase64(new Uint8Array(encrypted))
}

// RSA-OAEP 私钥解密
export async function rsaDecrypt(ciphertextB64: string, privateKeyPem: string): Promise<string> {
  const pkcs8 = pemToPkcs8(privateKeyPem)
  const cryptoKey = await crypto.subtle.importKey('pkcs8', pkcs8, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt'])
  const data = base64ToBytes(ciphertextB64)
  const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, cryptoKey, data)
  return new TextDecoder().decode(decrypted)
}

// RSASSA-PKCS1-v1_5 私钥签名
export async function rsaSign(message: string, privateKeyPem: string): Promise<string> {
  // 注意：签名需要 RSASSA-PKCS1-v1_5 密钥，但 OAEP 密钥不能用于签名
  // 这里尝试用 PKCS1-v1_5 解析，失败则提示
  const pkcs8 = pemToPkcs8(privateKeyPem)
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pkcs8,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const data = new TextEncoder().encode(message)
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, data)
  return bytesToBase64(new Uint8Array(signature))
}

// RSASSA-PKCS1-v1_5 公钥验签
export async function rsaVerify(message: string, signatureB64: string, publicKeyPem: string): Promise<boolean> {
  const spki = pemToSpki(publicKeyPem)
  const cryptoKey = await crypto.subtle.importKey(
    'spki',
    spki,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const data = new TextEncoder().encode(message)
  const signature = base64ToBytes(signatureB64)
  return crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, data)
}

// === PEM 编解码工具 ===

function spkiToPem(spki: Uint8Array): string {
  const b64 = bytesToBase64(spki)
  return `-----BEGIN PUBLIC KEY-----\n${wrapBase64(b64)}\n-----END PUBLIC KEY-----`
}

function pkcs8ToPem(pkcs8: Uint8Array): string {
  const b64 = bytesToBase64(pkcs8)
  return `-----BEGIN PRIVATE KEY-----\n${wrapBase64(b64)}\n-----END PRIVATE KEY-----`
}

function pemToSpki(pem: string): Uint8Array<ArrayBuffer> {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/-----BEGIN RSA PUBLIC KEY-----/g, '')
    .replace(/-----END RSA PUBLIC KEY-----/g, '')
    .replace(/\s+/g, '')
  return base64ToBytes(b64)
}

function pemToPkcs8(pem: string): Uint8Array<ArrayBuffer> {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
    .replace(/-----END RSA PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '')
  return base64ToBytes(b64)
}

function wrapBase64(b64: string, width: number = 64): string {
  const lines: string[] = []
  for (let i = 0; i < b64.length; i += width) {
    lines.push(b64.slice(i, i + width))
  }
  return lines.join('\n')
}

// === 字节与编码转换 ===

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export { hexToBytes, bytesToBase64, base64ToBytes }
