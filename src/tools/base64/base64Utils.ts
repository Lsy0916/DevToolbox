/**
 * Base64 编解码及字节转换工具集
 *
 * - 提供标准 Base64 与 URL 安全 Base64 的编解码
 * - 支持文本 ⇄ Hex 互转、ArrayBuffer ⇄ Base64、Base64 ⇄ Blob 转换
 * - 提供字节大小格式化与 Data URL MIME 类型解析
 */
export function encodeBase64(input: string): string {
  return btoa(unescape(encodeURIComponent(input)))
}

export function decodeBase64(input: string): string {
  return decodeURIComponent(escape(atob(input)))
}

// URL 安全 Base64：+ → -，/ → _，去掉 =
export function encodeBase64UrlSafe(input: string): string {
  return encodeBase64(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeBase64UrlSafe(input: string): string {
  let str = input.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return decodeBase64(str)
}

// 文本 ⇄ Hex 互转（UTF-8 字节）
export function textToHex(input: string): string {
  const bytes = new TextEncoder().encode(input)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function hexToText(input: string): string {
  const clean = input.replace(/\s+/g, '')
  if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error('Invalid hex string')
  }
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16)
  }
  return new TextDecoder().decode(bytes)
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, Array.from(chunk))
  }
  return btoa(binary)
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64)
  const byteArrays: BlobPart[] = []
  const chunkSize = 0x8000
  for (let offset = 0; offset < byteCharacters.length; offset += chunkSize) {
    const slice = byteCharacters.slice(offset, offset + chunkSize)
    const byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }
    byteArrays.push(new Uint8Array(byteNumbers))
  }
  return new Blob(byteArrays, { type: mimeType })
}

export function getMimeTypeFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);base64,/)
  return match ? match[1] ?? 'application/octet-stream' : 'application/octet-stream'
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
