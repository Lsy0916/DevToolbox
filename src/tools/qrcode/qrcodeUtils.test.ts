import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the qrcode library so tests don't need a real canvas implementation (jsdom lacks one)
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(),
  },
}))

import QRCode from 'qrcode'
import { generateQrDataUrl, downloadQr } from './qrcodeUtils'
import type { QrOptions } from '@/types'

const mockedToDataURL = vi.mocked(QRCode.toDataURL)

const defaultOpts: QrOptions = {
  size: 256,
  margin: 2,
  level: 'M',
  dark: '#000000',
  light: '#ffffff',
}

describe('qrcodeUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------- generateQrDataUrl ----------
  describe('generateQrDataUrl', () => {
    it('returns the data URL produced by QRCode.toDataURL', async () => {
      const expected = 'data:image/png;base64,mockdata'
      mockedToDataURL.mockResolvedValue(expected)

      const result = await generateQrDataUrl('hello', defaultOpts)
      expect(result).toBe(expected)
    })

    it('calls QRCode.toDataURL with the text and options', async () => {
      mockedToDataURL.mockResolvedValue('data:image/png;base64,xxx')

      await generateQrDataUrl('https://example.com', defaultOpts)

      expect(mockedToDataURL).toHaveBeenCalledTimes(1)
      expect(mockedToDataURL).toHaveBeenCalledWith('https://example.com', {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 256,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
    })

    it('passes through errorCorrectionLevel option', async () => {
      mockedToDataURL.mockResolvedValue('data:image/png;base64,xxx')

      await generateQrDataUrl('text', { ...defaultOpts, level: 'H' })

      expect(mockedToDataURL).toHaveBeenCalledWith(
        'text',
        expect.objectContaining({ errorCorrectionLevel: 'H' }),
      )
    })

    it('passes through errorCorrectionLevel L', async () => {
      mockedToDataURL.mockResolvedValue('data:image/png;base64,xxx')

      await generateQrDataUrl('text', { ...defaultOpts, level: 'L' })

      expect(mockedToDataURL).toHaveBeenCalledWith(
        'text',
        expect.objectContaining({ errorCorrectionLevel: 'L' }),
      )
    })

    it('passes through size as width', async () => {
      mockedToDataURL.mockResolvedValue('data:image/png;base64,xxx')

      await generateQrDataUrl('text', { ...defaultOpts, size: 512 })

      expect(mockedToDataURL).toHaveBeenCalledWith(
        'text',
        expect.objectContaining({ width: 512 }),
      )
    })

    it('passes through margin option', async () => {
      mockedToDataURL.mockResolvedValue('data:image/png;base64,xxx')

      await generateQrDataUrl('text', { ...defaultOpts, margin: 4 })

      expect(mockedToDataURL).toHaveBeenCalledWith(
        'text',
        expect.objectContaining({ margin: 4 }),
      )
    })

    it('passes through color options', async () => {
      mockedToDataURL.mockResolvedValue('data:image/png;base64,xxx')

      await generateQrDataUrl('text', {
        ...defaultOpts,
        dark: '#ff0000',
        light: '#00ff00',
      })

      expect(mockedToDataURL).toHaveBeenCalledWith('text', {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 256,
        color: { dark: '#ff0000', light: '#00ff00' },
      })
    })

    it('throws "empty" when text is empty string', async () => {
      await expect(generateQrDataUrl('', defaultOpts)).rejects.toThrow('empty')
      expect(mockedToDataURL).not.toHaveBeenCalled()
    })

    it('does not call QRCode.toDataURL for empty text', async () => {
      await expect(generateQrDataUrl('', defaultOpts)).rejects.toThrow()
      expect(mockedToDataURL).not.toHaveBeenCalled()
    })

    it('propagates errors from QRCode.toDataURL', async () => {
      mockedToDataURL.mockRejectedValue(new Error('QR generation failed'))

      await expect(generateQrDataUrl('text', defaultOpts)).rejects.toThrow('QR generation failed')
    })

    it('accepts non-empty text that is not a URL', async () => {
      mockedToDataURL.mockResolvedValue('data:image/png;base64,abc')

      const result = await generateQrDataUrl('just some text', defaultOpts)
      expect(result).toBe('data:image/png;base64,abc')
      expect(mockedToDataURL).toHaveBeenCalledWith('just some text', expect.any(Object))
    })
  })

  // ---------- downloadQr ----------
  describe('downloadQr', () => {
    it('does not throw when called with valid arguments', () => {
      expect(() => downloadQr('data:image/png;base64,abc', 'qr.png')).not.toThrow()
    })

    it('creates an anchor element and clicks it', () => {
      const spyCreate = vi.spyOn(document, 'createElement')

      downloadQr('data:image/png;base64,abc', 'myqr.png')

      // An <a> element is created
      const anchorCalls = spyCreate.mock.calls.filter((c) => c[0] === 'a')
      expect(anchorCalls.length).toBe(1)
      spyCreate.mockRestore()
    })

    it('sets href and download on the anchor', () => {
      const created: HTMLElement[] = []
      const originalCreate = document.createElement.bind(document)
      const spyCreate = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreate(tag)
        if (tag === 'a') created.push(el)
        return el
      })

      downloadQr('data:image/png;base64,xyz', 'download.png')

      expect(created.length).toBe(1)
      const a = created[0] as HTMLAnchorElement
      expect(a.href).toBe('data:image/png;base64,xyz')
      expect(a.download).toBe('download.png')
      spyCreate.mockRestore()
    })
  })
})
