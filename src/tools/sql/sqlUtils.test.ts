import { describe, it, expect } from 'vitest'
import { formatSql, minifySql, validateSql, SQL_DIALECTS, type SqlFormatOptions } from './sqlUtils'

const defaultOptions: SqlFormatOptions = {
  language: 'sql',
  keywordCase: 'preserve',
  tabWidth: 2,
  useTabs: false,
}

describe('SQL_DIALECTS', () => {
  it('exposes the standard set of dialects', () => {
    const values = SQL_DIALECTS.map((d) => d.value)
    expect(values).toContain('sql')
    expect(values).toContain('mysql')
    expect(values).toContain('postgresql')
    expect(values).toContain('sqlite')
  })

  it('every dialect has a non-empty labelKey', () => {
    for (const d of SQL_DIALECTS) {
      expect(d.labelKey).toBeTruthy()
    }
  })
})

describe('formatSql', () => {
  it('formats a simple SELECT statement (preserves keyword case by default)', () => {
    const out = formatSql('select a,b from t where a=1', defaultOptions)
    // With keywordCase 'preserve', keywords stay lowercase but get placed on their own lines.
    expect(out).toContain('select')
    expect(out).toContain('from')
    expect(out).not.toBe('select a,b from t where a=1')
  })

  it('uppercases keywords when keywordCase is "upper"', () => {
    const out = formatSql('select * from t', { ...defaultOptions, keywordCase: 'upper' })
    expect(out).toContain('SELECT')
    expect(out).toContain('FROM')
  })

  it('returns an empty string for whitespace-only input', () => {
    expect(formatSql('   ', defaultOptions)).toBe('')
  })

  it('returns an empty string for an empty input', () => {
    expect(formatSql('', defaultOptions)).toBe('')
  })
})

describe('minifySql', () => {
  it('collapses whitespace and trims', () => {
    const out = minifySql('  SELECT   a ,  b   FROM   t  ')
    expect(out).toBe('SELECT a,b FROM t')
  })

  it('removes single-line comments', () => {
    const out = minifySql('SELECT a -- comment\nFROM t')
    expect(out).not.toContain('--')
    expect(out).not.toContain('comment')
    expect(out).toContain('SELECT')
    expect(out).toContain('FROM')
  })

  it('removes block comments', () => {
    const out = minifySql('SELECT a /* block comment */ FROM t')
    expect(out).not.toContain('/*')
    expect(out).not.toContain('block comment')
  })

  it('removes spaces around parentheses, commas and semicolons', () => {
    // The regex /\s*([(),;])\s*/g removes whitespace on BOTH sides of punctuation,
    // so the space between SELECT and ( is also removed.
    const out = minifySql('SELECT ( a , b ) ;')
    expect(out).toBe('SELECT(a,b);')
  })

  it('returns an empty string for empty input', () => {
    expect(minifySql('')).toBe('')
    expect(minifySql('   ')).toBe('')
  })
})

describe('validateSql', () => {
  it('returns ok=true for valid SQL', () => {
    const r = validateSql('SELECT a FROM t', defaultOptions)
    expect(r.ok).toBe(true)
    expect(r.error).toBeUndefined()
  })

  it('returns ok=false with "empty" for whitespace-only input', () => {
    expect(validateSql('   ', defaultOptions)).toEqual({ ok: false, error: 'empty' })
  })

  it('returns ok=false with an error message when sql-formatter throws', () => {
    // sql-formatter is permissive; an unterminated string literal typically raises.
    const r = validateSql("SELECT 'unterminated", defaultOptions)
    expect(r.ok).toBe(false)
    expect(typeof r.error).toBe('string')
    expect(r.error!.length).toBeGreaterThan(0)
  })
})
