export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  CORS_ERROR = 'CORS_ERROR',
  TIMEOUT = 'TIMEOUT',
  INVALID_INPUT = 'INVALID_INPUT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_TYPE = 'UNSUPPORTED_TYPE',
  PARSE_ERROR = 'PARSE_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/** 错误码 → i18n key 映射表 */
export const errorCodeI18nKey: Record<ErrorCode, string> = {
  [ErrorCode.NETWORK_ERROR]: 'common.errors.networkError',
  [ErrorCode.CORS_ERROR]: 'common.errors.corsError',
  [ErrorCode.TIMEOUT]: 'common.errors.timeout',
  [ErrorCode.INVALID_INPUT]: 'common.errors.invalidInput',
  [ErrorCode.FILE_TOO_LARGE]: 'common.errors.fileTooLarge',
  [ErrorCode.UNSUPPORTED_TYPE]: 'common.errors.unsupportedType',
  [ErrorCode.PARSE_ERROR]: 'common.errors.parseError',
  [ErrorCode.UNKNOWN]: 'common.errors.unknown',
}
