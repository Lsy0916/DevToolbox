/**
 * 二维码生成工具集
 *
 * - 基于 qrcode 库生成可配置的二维码 Data URL
 * - 支持容错等级、边距、尺寸及前景/背景颜色设置
 * - 提供二维码 PNG 下载功能
 */
import QRCode from 'qrcode'
import type { QrOptions } from '@/types'

// 生成二维码 Data URL；文本为空时抛错由 UI 捕获
export async function generateQrDataUrl(text: string, opts: QrOptions): Promise<string> {
  if (!text) throw new Error('empty')
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: opts.level,
    margin: opts.margin,
    width: opts.size,
    color: {
      dark: opts.dark,
      light: opts.light,
    },
  })
}

// 下载二维码为 PNG
export function downloadQr(dataUrl: string, name: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
