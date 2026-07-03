/**
 * useFileUpload — 文件上传读取组合式函数
 *
 * 封装 FileReader，提供带进度、错误处理、类型/大小校验的文件读取能力。
 * 支持两种读取模式：
 * - readAsDataURL: 返回 base64 Data URL（用于图片预览、Base64 工具）
 * - readAsArrayBuffer: 返回 ArrayBuffer（用于哈希计算、二进制处理）
 *
 * 错误处理：所有失败统一抛出 UploadError，附带 code 便于 UI 分类提示。
 * 支持的校验：
 * - 文件大小上限（默认 10MB）
 * - MIME 类型白名单（支持通配符如 'image/*'）
 */
import { ref, type Ref } from 'vue'

/** 文件上传错误码，用于区分错误类型并做 i18n 提示 */
export type UploadErrorCode = 'FILE_TOO_LARGE' | 'UNSUPPORTED_TYPE' | 'READ_ERROR'

/**
 * 文件上传错误。继承 Error 并附加 code 字段，
 * 便于调用方按错误码展示不同的用户提示。
 */
export class UploadError extends Error {
  code: UploadErrorCode
  constructor(code: UploadErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = 'UploadError'
  }
}

/** useFileUpload 配置项 */
export interface UseFileUploadOptions {
  /** 文件大小上限（字节），默认 10MB */
  maxSize?: number
  /** 允许的 MIME 类型列表，支持通配符（如 'image/*'）。空数组或未设置表示不限制 */
  acceptTypes?: string[]
}

/** useFileUpload 返回值 */
export interface UseFileUploadReturn {
  /** 读取进度 0-100 */
  progress: Ref<number>
  /** 最近一次错误，null 表示无错误 */
  error: Ref<UploadError | null>
  /** 是否正在读取中 */
  loading: Ref<boolean>
  /** 以 Data URL（base64）形式读取文件 */
  readAsDataURL: (file: File) => Promise<string>
  /** 以 ArrayBuffer 形式读取文件 */
  readAsArrayBuffer: (file: File) => Promise<ArrayBuffer>
  /** 重置状态（进度、错误、loading） */
  reset: () => void
}

/** 默认文件大小上限：10MB */
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024

/**
 * 检查文件 MIME 类型是否匹配白名单。
 * @param fileType - 文件的实际 MIME 类型（如 'image/png'）
 * @param acceptTypes - 允许的类型列表，支持通配符（如 'image/*'）
 * @returns 至少一个 pattern 匹配返回 true
 */
function matchesAcceptType(fileType: string, acceptTypes: string[]): boolean {
  if (acceptTypes.length === 0) return true
  return acceptTypes.some((pattern) => {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -1)
      return fileType.startsWith(prefix)
    }
    return fileType === pattern
  })
}

/**
 * 使用 FileReader 读取文件的通用实现。
 * @param file - 待读取的 File 对象
 * @param readerMethod - FileReader 方法名：'readAsDataURL' 或 'readAsArrayBuffer'
 * @param options - 大小/类型校验配置
 * @param progressRef - 进度响应式 ref，由调用方传入以便共享
 * @param loadingRef - loading 响应式 ref，由调用方传入以便共享
 */
function readFileAs<T extends string | ArrayBuffer>(
  file: File,
  readerMethod: 'readAsDataURL' | 'readAsArrayBuffer',
  options: UseFileUploadOptions,
  progressRef: Ref<number>,
  loadingRef: Ref<boolean>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // 大小校验
    const maxSize = options.maxSize ?? DEFAULT_MAX_SIZE
    if (file.size > maxSize) {
      reject(new UploadError('FILE_TOO_LARGE', `File exceeds ${maxSize} bytes`))
      return
    }
    // 类型校验
    if (options.acceptTypes && !matchesAcceptType(file.type, options.acceptTypes)) {
      reject(new UploadError('UNSUPPORTED_TYPE', `File type ${file.type} not allowed`))
      return
    }

    loadingRef.value = true
    progressRef.value = 0

    const reader = new FileReader()
    // 进度回调：仅当 lengthComputable 时更新（小文件可能不触发）
    reader.onprogress = (e: ProgressEvent<FileReader>) => {
      if (e.lengthComputable) {
        progressRef.value = Math.round((e.loaded / e.total) * 100)
      }
    }
    reader.onerror = () => {
      loadingRef.value = false
      progressRef.value = 0
      reject(new UploadError('READ_ERROR', reader.error?.message ?? 'Read failed'))
    }
    reader.onload = () => {
      loadingRef.value = false
      progressRef.value = 100
      const result = reader.result
      // 类型守卫：ArrayBuffer 模式下结果不能是 string
      if (result === null || (readerMethod === 'readAsArrayBuffer' && typeof result === 'string')) {
        reject(new UploadError('READ_ERROR', 'Unexpected result type'))
        return
      }
      resolve(result as T)
    }
    reader[readerMethod](file)
  })
}

/**
 * 创建文件上传读取实例。
 * @param options - 大小/类型校验配置，可选
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const progress = ref(0)
  const error = ref<UploadError | null>(null)
  const loading = ref(false)

  /**
   * 以 Data URL 形式读取文件，返回 base64 字符串。
   * 错误会写入 error ref 并重新抛出，便于调用方 try/catch。
   */
  function readAsDataURL(file: File): Promise<string> {
    error.value = null
    return readFileAs<string>(file, 'readAsDataURL', options, progress, loading).catch((e) => {
      error.value = e instanceof UploadError ? e : new UploadError('READ_ERROR', String(e))
      throw e
    })
  }

  /**
   * 以 ArrayBuffer 形式读取文件，返回二进制缓冲区。
   * 错误会写入 error ref 并重新抛出，便于调用方 try/catch。
   */
  function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    error.value = null
    return readFileAs<ArrayBuffer>(file, 'readAsArrayBuffer', options, progress, loading).catch((e) => {
      error.value = e instanceof UploadError ? e : new UploadError('READ_ERROR', String(e))
      throw e
    })
  }

  /** 重置所有状态到初始值 */
  function reset(): void {
    progress.value = 0
    error.value = null
    loading.value = false
  }

  return { progress, error, loading, readAsDataURL, readAsArrayBuffer, reset }
}
