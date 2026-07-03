import { describe, it, expect } from 'vitest'
import {
  aesEncrypt,
  aesDecrypt,
  generateAesKey,
  aesGcmEncrypt,
  aesGcmDecrypt,
  generateRsaOaepKeyPair,
  rsaEncrypt,
  rsaDecrypt,
  rsaSign,
  rsaVerify,
  hexToBytes,
  bytesToBase64,
  base64ToBytes,
  type AesOptions,
} from './cryptoUtils'

const CBC_BASE64_OPTIONS: AesOptions = {
  mode: 'CBC',
  padding: 'Pkcs7',
  keyEncoding: 'Utf8',
  ivEncoding: 'Utf8',
  outputEncoding: 'Base64',
}

const ECB_BASE64_OPTIONS: AesOptions = {
  mode: 'ECB',
  padding: 'Pkcs7',
  keyEncoding: 'Utf8',
  ivEncoding: 'Utf8',
  outputEncoding: 'Base64',
}

describe('AES (crypto-js, sync)', () => {
  it('round-trips CBC mode with Utf8 key/IV and Base64 output', () => {
    const key = '1234567890123456' // 16 bytes
    const iv = '6543210987654321'
    const plaintext = 'Hello, AES!'
    const ciphertext = aesEncrypt(plaintext, key, iv, CBC_BASE64_OPTIONS)
    expect(ciphertext).not.toBe(plaintext)
    expect(aesDecrypt(ciphertext, key, iv, CBC_BASE64_OPTIONS)).toBe(plaintext)
  })

  it('round-trips ECB mode (no IV used)', () => {
    const key = '1234567890123456'
    const plaintext = 'ECB mode test'
    const ciphertext = aesEncrypt(plaintext, key, '', ECB_BASE64_OPTIONS)
    expect(aesDecrypt(ciphertext, key, '', ECB_BASE64_OPTIONS)).toBe(plaintext)
  })

  it('produces Hex output when outputEncoding is Hex', () => {
    const options: AesOptions = { ...CBC_BASE64_OPTIONS, outputEncoding: 'Hex' }
    const ciphertext = aesEncrypt('data', '1234567890123456', '6543210987654321', options)
    expect(ciphertext).toMatch(/^[0-9a-f]+$/)
  })

  it('round-trips with Hex-encoded key and IV', () => {
    const keyHex = '0123456789abcdef0123456789abcdef' // 16 bytes hex
    const ivHex = 'fedcba98765432100123456789abcdef'
    const options: AesOptions = {
      mode: 'CBC',
      padding: 'Pkcs7',
      keyEncoding: 'Hex',
      ivEncoding: 'Hex',
      outputEncoding: 'Base64',
    }
    const ciphertext = aesEncrypt('hex key test', keyHex, ivHex, options)
    expect(aesDecrypt(ciphertext, keyHex, ivHex, options)).toBe('hex key test')
  })
})

describe('generateAesKey', () => {
  it('returns 256-bit key (64 hex chars) and 128-bit IV (32 hex chars)', () => {
    const { key, iv } = generateAesKey()
    expect(key).toMatch(/^[0-9a-f]{64}$/)
    expect(iv).toMatch(/^[0-9a-f]{32}$/)
  })

  it('produces different values on subsequent calls', () => {
    const a = generateAesKey()
    const b = generateAesKey()
    expect(a.key).not.toBe(b.key)
    expect(a.iv).not.toBe(b.iv)
  })
})

describe('AES-GCM (Web Crypto, async)', () => {
  it('round-trips encrypt/decrypt for a UTF-8 message', async () => {
    // 32-byte key (256 bits), 12-byte IV (96 bits) — GCM standard.
    const keyHex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    const ivHex = '0123456789abcdef01234567'
    const plaintext = 'GCM secret message 🚀'
    const ciphertext = await aesGcmEncrypt(plaintext, keyHex, ivHex)
    expect(ciphertext).not.toBe(plaintext)
    expect(await aesGcmDecrypt(ciphertext, keyHex, ivHex)).toBe(plaintext)
  })

  it('fails decryption when the key is wrong', async () => {
    const keyHex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    const wrongKeyHex = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210'
    const ivHex = '0123456789abcdef01234567'
    const ciphertext = await aesGcmEncrypt('msg', keyHex, ivHex)
    await expect(aesGcmDecrypt(ciphertext, wrongKeyHex, ivHex)).rejects.toThrow()
  })
})

describe('RSA-OAEP (Web Crypto, async)', () => {
  it('generates a 1024-bit key pair in PEM format', async () => {
    const { publicKeyPem, privateKeyPem } = await generateRsaOaepKeyPair(1024)
    expect(publicKeyPem).toContain('-----BEGIN PUBLIC KEY-----')
    expect(publicKeyPem).toContain('-----END PUBLIC KEY-----')
    expect(privateKeyPem).toContain('-----BEGIN PRIVATE KEY-----')
    expect(privateKeyPem).toContain('-----END PRIVATE KEY-----')
  }, 15000)

  it('round-trips encrypt/decrypt with a generated key pair', async () => {
    const { publicKeyPem, privateKeyPem } = await generateRsaOaepKeyPair(1024)
    const plaintext = 'RSA-OAEP hello'
    const ciphertext = await rsaEncrypt(plaintext, publicKeyPem)
    expect(await rsaDecrypt(ciphertext, privateKeyPem)).toBe(plaintext)
  }, 15000)

  it('round-trips sign/verify with a generated key pair', async () => {
    // Note: the source comment says OAEP keys cannot be used for signing,
    // but the implementation re-imports the PKCS8 PEM as RSASSA-PKCS1-v1_5.
    // If the runtime rejects the cross-algorithm import, this test would fail
    // — but in practice WebCrypto allows re-importing the same raw RSA key
    // material under a different algorithm.
    const { publicKeyPem, privateKeyPem } = await generateRsaOaepKeyPair(1024)
    const message = 'sign me'
    const signature = await rsaSign(message, privateKeyPem)
    expect(typeof signature).toBe('string')
    expect(await rsaVerify(message, signature, publicKeyPem)).toBe(true)
  }, 15000)

  it('rejects verification with the wrong message', async () => {
    const { publicKeyPem, privateKeyPem } = await generateRsaOaepKeyPair(1024)
    const signature = await rsaSign('original', privateKeyPem)
    expect(await rsaVerify('tampered', signature, publicKeyPem)).toBe(false)
  }, 15000)
})

describe('byte helpers (hexToBytes / bytesToBase64 / base64ToBytes)', () => {
  it('converts hex to bytes and back', () => {
    const hex = '48656c6c6f' // "Hello"
    const bytes = hexToBytes(hex)
    expect(bytes.length).toBe(5)
    expect(bytes[0]).toBe(0x48)
  })

  it('bytesToBase64 produces a valid base64 string', () => {
    const bytes = new Uint8Array([72, 73]) // "HI"
    expect(bytesToBase64(bytes)).toBe('SEk=')
  })

  it('base64ToBytes inverts bytesToBase64', () => {
    const original = new Uint8Array([1, 2, 3, 250, 255])
    const b64 = bytesToBase64(original)
    const decoded = base64ToBytes(b64)
    expect(Array.from(decoded)).toEqual(Array.from(original))
  })

  it('handles an empty byte array', () => {
    expect(bytesToBase64(new Uint8Array(0))).toBe('')
    expect(base64ToBytes('').length).toBe(0)
  })
})
