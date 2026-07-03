import { describe, it, expect } from 'vitest'
import {
  md5,
  sha1,
  sha256,
  sha384,
  sha512,
  hashText,
  hmacSha256,
  hmacSha512,
  compareHash,
  hashFile,
} from './hashUtils'
import type { HashAlgorithm } from '@/types'

describe('hashUtils', () => {
  describe('md5', () => {
    it('hashes "hello" to the known MD5 value', () => {
      expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592')
    })

    it('hashes empty string to known MD5 value', () => {
      expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e')
    })

    it('hashes "abc" to the known value', () => {
      expect(md5('abc')).toBe('900150983cd24fb0d6963f7d28e17f72')
    })

    it('produces a 32-char hex string', () => {
      expect(md5('anything')).toMatch(/^[0-9a-f]{32}$/)
    })

    it('is deterministic for the same input', () => {
      expect(md5('repeat')).toBe(md5('repeat'))
    })

    it('produces different hashes for different inputs', () => {
      expect(md5('input1')).not.toBe(md5('input2'))
    })

    it('handles unicode input', () => {
      expect(md5('中文')).toMatch(/^[0-9a-f]{32}$/)
    })
  })

  describe('sha1', () => {
    it('hashes "hello" to the known SHA-1 value', () => {
      expect(sha1('hello')).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d')
    })

    it('hashes empty string to known value', () => {
      expect(sha1('')).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709')
    })

    it('hashes "abc" to the known value', () => {
      expect(sha1('abc')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d')
    })

    it('produces a 40-char hex string', () => {
      expect(sha1('anything')).toMatch(/^[0-9a-f]{40}$/)
    })

    it('is deterministic', () => {
      expect(sha1('repeat')).toBe(sha1('repeat'))
    })
  })

  describe('sha256', () => {
    it('hashes "hello" to the known SHA-256 value', async () => {
      expect(await sha256('hello')).toBe(
        '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      )
    })

    it('hashes empty string to known value', async () => {
      expect(await sha256('')).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      )
    })

    it('hashes "abc" to the known value', async () => {
      expect(await sha256('abc')).toBe(
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      )
    })

    it('produces a 64-char hex string', async () => {
      expect(await sha256('anything')).toMatch(/^[0-9a-f]{64}$/)
    })

    it('is deterministic', async () => {
      const a = await sha256('repeat')
      const b = await sha256('repeat')
      expect(a).toBe(b)
    })

    it('handles unicode input', async () => {
      const result = await sha256('中文')
      expect(result).toMatch(/^[0-9a-f]{64}$/)
      // Known SHA-256 of '中文' (UTF-8 bytes e4 b8 ad e6 96 87)
      expect(result).toBe(
        '72726d8818f693066ceb69afa364218b692e62ea92b385782363780f47529c21',
      )
    })
  })

  describe('sha384', () => {
    it('hashes "hello" to the known SHA-384 value', async () => {
      expect(await sha384('hello')).toBe(
        '59e1748777448c69de6b800d7a33bbfb9ff1b463e44354c3553bcdb9c666fa90125a3c79f90397bdf5f6a13de828684f',
      )
    })

    it('hashes empty string to known value', async () => {
      expect(await sha384('')).toBe(
        '38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b',
      )
    })

    it('hashes "abc" to the known value', async () => {
      expect(await sha384('abc')).toBe(
        'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7',
      )
    })

    it('produces a 96-char hex string', async () => {
      expect(await sha384('anything')).toMatch(/^[0-9a-f]{96}$/)
    })

    it('is deterministic', async () => {
      expect(await sha384('repeat')).toBe(await sha384('repeat'))
    })
  })

  describe('sha512', () => {
    it('hashes "hello" to the known SHA-512 value', async () => {
      expect(await sha512('hello')).toBe(
        '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043',
      )
    })

    it('hashes empty string to known value', async () => {
      expect(await sha512('')).toBe(
        'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
      )
    })

    it('hashes "abc" to the known value', async () => {
      expect(await sha512('abc')).toBe(
        'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
      )
    })

    it('produces a 128-char hex string', async () => {
      expect(await sha512('anything')).toMatch(/^[0-9a-f]{128}$/)
    })

    it('is deterministic', async () => {
      expect(await sha512('repeat')).toBe(await sha512('repeat'))
    })
  })

  describe('hashText', () => {
    it('dispatches to MD5', async () => {
      expect(await hashText('hello', 'MD5')).toBe(md5('hello'))
    })

    it('dispatches to SHA-1', async () => {
      expect(await hashText('hello', 'SHA-1')).toBe(sha1('hello'))
    })

    it('dispatches to SHA-256', async () => {
      expect(await hashText('hello', 'SHA-256')).toBe(await sha256('hello'))
    })

    it('dispatches to SHA-384', async () => {
      expect(await hashText('hello', 'SHA-384')).toBe(await sha384('hello'))
    })

    it('dispatches to SHA-512', async () => {
      expect(await hashText('hello', 'SHA-512')).toBe(await sha512('hello'))
    })

    it('returns known values for each algorithm', async () => {
      const algorithms: HashAlgorithm[] = [
        'MD5',
        'SHA-1',
        'SHA-256',
        'SHA-384',
        'SHA-512',
      ]
      const expected: Record<HashAlgorithm, string> = {
        MD5: '5d41402abc4b2a76b9719d911017c592',
        'SHA-1': 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d',
        'SHA-256':
          '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
        'SHA-384':
          '59e1748777448c69de6b800d7a33bbfb9ff1b463e44354c3553bcdb9c666fa90125a3c79f90397bdf5f6a13de828684f',
        'SHA-512':
          '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043',
      }
      for (const alg of algorithms) {
        expect(await hashText('hello', alg)).toBe(expected[alg])
      }
    })

    it('handles empty input for all algorithms', async () => {
      const algorithms: HashAlgorithm[] = [
        'MD5',
        'SHA-1',
        'SHA-256',
        'SHA-384',
        'SHA-512',
      ]
      for (const alg of algorithms) {
        const result = await hashText('', alg)
        expect(result.length).toBeGreaterThan(0)
      }
    })
  })

  describe('hmacSha256', () => {
    it('produces the known HMAC-SHA256 hex for "hello"/"secret"', () => {
      expect(hmacSha256('hello', 'secret')).toBe(
        '88aab3ede8d3adf94d26ab90d3bafd4a2083070c3bcce9c014ee04a443847c0b',
      )
    })

    it('produces a 64-char hex string', () => {
      expect(hmacSha256('msg', 'key')).toMatch(/^[0-9a-f]{64}$/)
    })

    it('is deterministic', () => {
      expect(hmacSha256('msg', 'key')).toBe(hmacSha256('msg', 'key'))
    })

    it('changes when the message changes', () => {
      expect(hmacSha256('msg1', 'key')).not.toBe(hmacSha256('msg2', 'key'))
    })

    it('changes when the secret changes', () => {
      expect(hmacSha256('msg', 'key1')).not.toBe(hmacSha256('msg', 'key2'))
    })

    it('handles empty message', () => {
      expect(hmacSha256('', 'key')).toMatch(/^[0-9a-f]{64}$/)
    })

    it('handles empty secret', () => {
      expect(hmacSha256('msg', '')).toMatch(/^[0-9a-f]{64}$/)
    })

    it('handles unicode message and secret', () => {
      expect(hmacSha256('中文', '密钥')).toMatch(/^[0-9a-f]{64}$/)
    })
  })

  describe('hmacSha512', () => {
    it('produces the known HMAC-SHA512 hex for "hello"/"secret"', () => {
      expect(hmacSha512('hello', 'secret')).toBe(
        'db1595ae88a62fd151ec1cba81b98c39df82daae7b4cb9820f446d5bf02f1dcfca6683d88cab3e273f5963ab8ec469a746b5b19086371239f67d1e5f99a79440',
      )
    })

    it('produces a 128-char hex string', () => {
      expect(hmacSha512('msg', 'key')).toMatch(/^[0-9a-f]{128}$/)
    })

    it('is deterministic', () => {
      expect(hmacSha512('msg', 'key')).toBe(hmacSha512('msg', 'key'))
    })

    it('changes when the message changes', () => {
      expect(hmacSha512('msg1', 'key')).not.toBe(hmacSha512('msg2', 'key'))
    })

    it('handles empty message', () => {
      expect(hmacSha512('', 'key')).toMatch(/^[0-9a-f]{128}$/)
    })
  })

  describe('compareHash', () => {
    it('returns true for equal strings', () => {
      expect(compareHash('abc123', 'abc123')).toBe(true)
    })

    it('returns true for equal strings differing only in case', () => {
      expect(compareHash('ABC123', 'abc123')).toBe(true)
      expect(compareHash('AbC123', 'aBC123')).toBe(true)
    })

    it('returns true for equal strings with surrounding whitespace', () => {
      expect(compareHash('  abc  ', 'abc')).toBe(true)
      expect(compareHash('abc', '\tabc\n')).toBe(true)
    })

    it('returns false for different strings of the same length', () => {
      expect(compareHash('abc123', 'abc124')).toBe(false)
    })

    it('returns false for strings of different lengths', () => {
      expect(compareHash('abc', 'abcd')).toBe(false)
      expect(compareHash('abcd', 'abc')).toBe(false)
    })

    it('returns false when one is empty and the other is not', () => {
      expect(compareHash('', 'a')).toBe(false)
      expect(compareHash('a', '')).toBe(false)
    })

    it('returns true for two empty strings', () => {
      expect(compareHash('', '')).toBe(true)
    })

    it('compares hex hashes case-insensitively', () => {
      const upper = '5D41402ABC4B2A76B9719D911017C592'
      const lower = '5d41402abc4b2a76b9719d911017c592'
      expect(compareHash(upper, lower)).toBe(true)
    })

    it('returns false for completely different content of equal length', () => {
      expect(compareHash('aaaaaa', 'bbbbbb')).toBe(false)
    })
  })

  describe('hashFile', () => {
    it('hashes a small file with MD5 to the known value', async () => {
      const file = new File(['hello'], 'test.txt', { type: 'text/plain' })
      const result = await hashFile(file, 'MD5')
      expect(result).toBe('5d41402abc4b2a76b9719d911017c592')
    })

    it('hashes a small file with SHA-1 to the known value', async () => {
      const file = new File(['hello'], 'test.txt', { type: 'text/plain' })
      const result = await hashFile(file, 'SHA-1')
      expect(result).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d')
    })

    it('hashes a small file with SHA-256 to the known value', async () => {
      const file = new File(['hello'], 'test.txt', { type: 'text/plain' })
      const result = await hashFile(file, 'SHA-256')
      expect(result).toBe(
        '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      )
    })

    it('hashes a small file with SHA-384 to the known value', async () => {
      const file = new File(['hello'], 'test.txt', { type: 'text/plain' })
      const result = await hashFile(file, 'SHA-384')
      expect(result).toBe(
        '59e1748777448c69de6b800d7a33bbfb9ff1b463e44354c3553bcdb9c666fa90125a3c79f90397bdf5f6a13de828684f',
      )
    })

    it('hashes a small file with SHA-512 to the known value', async () => {
      const file = new File(['hello'], 'test.txt', { type: 'text/plain' })
      const result = await hashFile(file, 'SHA-512')
      expect(result).toBe(
        '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043',
      )
    })

    it('calls onProgress with 100 for Web Crypto path', async () => {
      const file = new File(['hello'], 'test.txt', { type: 'text/plain' })
      const calls: number[] = []
      await hashFile(file, 'SHA-256', (p) => calls.push(p))
      expect(calls).toContain(100)
    })

    it('calls onProgress for CryptoJS path', async () => {
      const file = new File(['hello'], 'test.txt', { type: 'text/plain' })
      const calls: number[] = []
      await hashFile(file, 'MD5', (p) => calls.push(p))
      expect(calls.length).toBeGreaterThan(0)
      expect(calls[calls.length - 1]).toBe(100)
    })

    it('hashes an empty file', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' })
      expect(await hashFile(file, 'MD5')).toBe(
        'd41d8cd98f00b204e9800998ecf8427e',
      )
      expect(await hashFile(file, 'SHA-256')).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      )
    })

    it('hashes a file with unicode content', async () => {
      const file = new File(['中文'], 'unicode.txt', { type: 'text/plain' })
      // MD5 of UTF-8 '中文'
      expect(await hashFile(file, 'MD5')).toBe(md5('中文'))
      expect(await hashFile(file, 'SHA-256')).toBe(await sha256('中文'))
    })

    it('hashes a large file (chunked CryptoJS path)', async () => {
      // Larger than the 2MB chunk size to exercise chunking
      const size = 3 * 1024 * 1024
      const data = new Uint8Array(size)
      for (let i = 0; i < size; i++) data[i] = i % 256
      const file = new File([data], 'large.bin', { type: 'application/octet-stream' })
      const viaMd5 = await hashFile(file, 'MD5')
      const viaSha256 = await hashFile(file, 'SHA-256')
      expect(viaMd5).toMatch(/^[0-9a-f]{32}$/)
      expect(viaSha256).toMatch(/^[0-9a-f]{64}$/)
      // Determinism: same input yields the same hash across runs
      expect(await hashFile(file, 'MD5')).toBe(viaMd5)
    })
  })
})
