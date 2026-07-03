/**
 * SQL 格式化与校验工具集
 *
 * - 提供多方言 SQL 的格式化与压缩
 * - 内置常用 SQL 方言列表（MySQL、PostgreSQL、SQLite、TSQL 等）
 * - 支持基于 sql-formatter 的语法校验
 */
import { format, type SqlLanguage, type KeywordCase } from 'sql-formatter'

export type SqlDialect = SqlLanguage

export interface SqlFormatOptions {
  language: SqlDialect
  keywordCase: KeywordCase
  tabWidth: number
  useTabs: boolean
}

// 常用方言
export const SQL_DIALECTS: { value: SqlDialect; labelKey: string }[] = [
  { value: 'sql', labelKey: 'tools.sql.labels.dialectStandard' },
  { value: 'mysql', labelKey: 'tools.sql.labels.dialectMysql' },
  { value: 'postgresql', labelKey: 'tools.sql.labels.dialectPostgresql' },
  { value: 'sqlite', labelKey: 'tools.sql.labels.dialectSqlite' },
  { value: 'mariadb', labelKey: 'tools.sql.labels.dialectMariadb' },
  { value: 'transactsql', labelKey: 'tools.sql.labels.dialectTsql' },
  { value: 'bigquery', labelKey: 'tools.sql.labels.dialectBigquery' },
  { value: 'redshift', labelKey: 'tools.sql.labels.dialectRedshift' },
  { value: 'snowflake', labelKey: 'tools.sql.labels.dialectSnowflake' },
  { value: 'db2', labelKey: 'tools.sql.labels.dialectDb2' },
]

export function formatSql(code: string, options: SqlFormatOptions): string {
  if (!code.trim()) return ''
  return format(code, {
    language: options.language,
    keywordCase: options.keywordCase,
    tabWidth: options.tabWidth,
    useTabs: options.useTabs,
  })
}

export function minifySql(code: string): string {
  if (!code.trim()) return ''
  // 压缩：去注释 + 合并多余空白
  return code
    .replace(/--[^\n]*\n/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*([(),;])\s*/g, '$1')
    .trim()
}

export function validateSql(code: string, options: SqlFormatOptions): { ok: boolean; error?: string } {
  if (!code.trim()) return { ok: false, error: 'empty' }
  try {
    format(code, {
      language: options.language,
      keywordCase: options.keywordCase,
      tabWidth: options.tabWidth,
      useTabs: options.useTabs,
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid SQL' }
  }
}
