import { describe, it, expect } from 'vitest'
import {
  diffChars,
  diffLines,
  diffWords,
  getDiffStats,
  formatUnifiedDiff,
  areTextsEqual,
} from './diffUtils'
import type { DiffSegment } from '@/types'

describe('diffChars', () => {
  it('returns a single equal segment for identical texts', () => {
    expect(diffChars('hello', 'hello')).toEqual([{ type: 'equal', text: 'hello' }])
  })

  it('detects char-level changes between "hello world" and "hello there"', () => {
    const result = diffChars('hello world', 'hello there')
    const types = result.map((r) => r.type)
    expect(types).toContain('equal')
    expect(types).toContain('delete')
    expect(types).toContain('insert')
    const deleted = result.filter((r) => r.type === 'delete').map((r) => r.text).join('')
    const inserted = result.filter((r) => r.type === 'insert').map((r) => r.text).join('')
    expect(deleted).toBe('world')
    expect(inserted).toBe('there')
  })

  it('treats empty first text as all insertions', () => {
    const result = diffChars('', 'abc')
    const inserted = result.filter((r) => r.type === 'insert').map((r) => r.text).join('')
    expect(inserted).toBe('abc')
  })

  it('treats empty second text as all deletions', () => {
    const result = diffChars('abc', '')
    const deleted = result.filter((r) => r.type === 'delete').map((r) => r.text).join('')
    expect(deleted).toBe('abc')
  })

  it('returns equal segments for two empty texts', () => {
    const result = diffChars('', '')
    expect(result.every((r) => r.type === 'equal')).toBe(true)
  })
})

describe('diffLines', () => {
  it('returns equal segments for identical multi-line texts', () => {
    expect(diffLines('line1\nline2', 'line1\nline2')).toEqual([
      { type: 'equal', text: 'line1' },
      { type: 'equal', text: 'line2' },
    ])
  })

  it('detects a changed line', () => {
    expect(diffLines('hello\nworld', 'hello\nthere')).toEqual([
      { type: 'equal', text: 'hello' },
      { type: 'delete', text: 'world' },
      { type: 'insert', text: 'there' },
    ])
  })

  it('detects an added line', () => {
    expect(diffLines('line1', 'line1\nline2')).toEqual([
      { type: 'equal', text: 'line1' },
      { type: 'insert', text: 'line2' },
    ])
  })

  it('detects a removed line', () => {
    expect(diffLines('line1\nline2', 'line1')).toEqual([
      { type: 'equal', text: 'line1' },
      { type: 'delete', text: 'line2' },
    ])
  })

  it('handles empty first text as insertion of the other line', () => {
    // ''.split('\n') => ['']; 'a'.split('\n') => ['a']; '' !== 'a', l1='' not pushed, l2 pushed
    expect(diffLines('', 'a')).toEqual([{ type: 'insert', text: 'a' }])
  })

  it('handles empty second text as deletion of the first line', () => {
    expect(diffLines('a', '')).toEqual([{ type: 'delete', text: 'a' }])
  })

  it('handles both texts empty', () => {
    // ''.split('\n') => [''] for both, equal '' line
    expect(diffLines('', '')).toEqual([{ type: 'equal', text: '' }])
  })

  it('handles more lines in the second text', () => {
    expect(diffLines('a', 'a\nb\nc')).toEqual([
      { type: 'equal', text: 'a' },
      { type: 'insert', text: 'b' },
      { type: 'insert', text: 'c' },
    ])
  })
})

describe('diffWords', () => {
  it('returns all equal segments for identical texts', () => {
    const result = diffWords('hello world', 'hello world')
    expect(result.every((r) => r.type === 'equal')).toBe(true)
    const text = result.map((r) => r.text).join('')
    expect(text).toBe('hello world')
  })

  it('detects word changes between "hello world" and "hello there"', () => {
    const result = diffWords('hello world', 'hello there')
    const deleted = result.filter((r) => r.type === 'delete').map((r) => r.text).join('')
    const inserted = result.filter((r) => r.type === 'insert').map((r) => r.text).join('')
    expect(deleted).toBe('world')
    expect(inserted).toBe('there')
  })

  it('keeps whitespace as separate segments', () => {
    const result = diffWords('a b', 'a b')
    // split(/(\s+)/) => ['a', ' ', 'b']
    expect(result.map((r) => r.text)).toEqual(['a', ' ', 'b'])
  })

  it('detects an added word', () => {
    const result = diffWords('hello', 'hello world')
    const inserted = result.filter((r) => r.type === 'insert').map((r) => r.text).join('')
    // The whitespace between words is its own insert segment, so the joined
    // inserted text is ' world' (leading space from the separator).
    expect(inserted).toBe(' world')
    expect(result.some((r) => r.type === 'insert' && r.text === 'world')).toBe(true)
  })

  it('detects a removed word', () => {
    const result = diffWords('hello world', 'hello')
    const deleted = result.filter((r) => r.type === 'delete').map((r) => r.text).join('')
    expect(deleted).toBe(' world')
    expect(result.some((r) => r.type === 'delete' && r.text === 'world')).toBe(true)
  })
})

describe('getDiffStats', () => {
  it('counts additions, deletions and unchanged segments', () => {
    const segments: DiffSegment[] = [
      { type: 'equal', text: 'a' },
      { type: 'insert', text: 'b' },
      { type: 'insert', text: 'c' },
      { type: 'delete', text: 'd' },
      { type: 'equal', text: 'e' },
    ]
    expect(getDiffStats(segments)).toEqual({ additions: 2, deletions: 1, unchanged: 2 })
  })

  it('returns zeros for an empty segment list', () => {
    expect(getDiffStats([])).toEqual({ additions: 0, deletions: 0, unchanged: 0 })
  })

  it('counts only inserts', () => {
    const segments: DiffSegment[] = [
      { type: 'insert', text: 'a' },
      { type: 'insert', text: 'b' },
    ]
    expect(getDiffStats(segments)).toEqual({ additions: 2, deletions: 0, unchanged: 0 })
  })
})

describe('formatUnifiedDiff', () => {
  it('prefixes equal/insert/delete segments with space/plus/minus', () => {
    const segments: DiffSegment[] = [
      { type: 'equal', text: 'line1' },
      { type: 'insert', text: 'line2' },
      { type: 'delete', text: 'line3' },
    ]
    expect(formatUnifiedDiff(segments)).toBe(' line1\n+line2\n-line3')
  })

  it('splits multi-line segment text across multiple prefixed lines', () => {
    const segments: DiffSegment[] = [{ type: 'equal', text: 'a\nb' }]
    expect(formatUnifiedDiff(segments)).toBe(' a\n b')
  })

  it('returns an empty string for an empty segment list', () => {
    expect(formatUnifiedDiff([])).toBe('')
  })

  it('handles a segment list with only inserts', () => {
    const segments: DiffSegment[] = [{ type: 'insert', text: 'added' }]
    expect(formatUnifiedDiff(segments)).toBe('+added')
  })
})

describe('areTextsEqual', () => {
  it('returns true for identical texts', () => {
    expect(areTextsEqual('hello', 'hello')).toBe(true)
  })

  it('returns false for different texts', () => {
    expect(areTextsEqual('hello', 'world')).toBe(false)
  })

  it('ignores extra whitespace when ignoreWhitespace is true', () => {
    expect(areTextsEqual('hello   world', 'hello world', true)).toBe(true)
  })

  it('ignores leading/trailing whitespace when ignoreWhitespace is true', () => {
    expect(areTextsEqual('  hello world  ', 'hello world', true)).toBe(true)
  })

  it('treats newlines like spaces when ignoreWhitespace is true', () => {
    expect(areTextsEqual('hello\nworld', 'hello world', true)).toBe(true)
  })

  it('does not ignore whitespace by default', () => {
    expect(areTextsEqual('hello  world', 'hello world')).toBe(false)
  })

  it('treats two empty strings as equal', () => {
    expect(areTextsEqual('', '')).toBe(true)
    expect(areTextsEqual('', '', true)).toBe(true)
  })

  it('returns false when only one side is empty (with ignoreWhitespace)', () => {
    expect(areTextsEqual('hello', '', true)).toBe(false)
  })
})
