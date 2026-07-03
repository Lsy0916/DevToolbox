import { describe, it, expect } from 'vitest'
import { renderMarkdown, stripHtml, countWords } from './markdownUtils'

describe('renderMarkdown', () => {
  it('renders a heading to HTML', () => {
    const html = renderMarkdown('# Title')
    expect(html).toMatch(/<h1[^>]*>Title<\/h1>/)
  })

  it('renders bold and italic markdown', () => {
    const html = renderMarkdown('**bold** and *italic*')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
  })

  it('renders a list', () => {
    const html = renderMarkdown('- a\n- b\n- c')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>a</li>')
    expect(html).toContain('<li>b</li>')
    expect(html).toContain('<li>c</li>')
  })

  it('renders a fenced code block', () => {
    const html = renderMarkdown('```\nconst x = 1\n```')
    expect(html).toContain('<pre>')
    expect(html).toContain('const x = 1')
  })

  it('returns an empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('')
  })

  it('returns an empty string for null/undefined input', () => {
    // The function uses `if (!md) return ''` — falsy values yield ''.
    expect(renderMarkdown(null as unknown as string)).toBe('')
    expect(renderMarkdown(undefined as unknown as string)).toBe('')
  })
})

describe('stripHtml', () => {
  it('removes HTML tags and decodes common entities', () => {
    const out = stripHtml('<p>Hello <b>world</b>&nbsp;! &amp; &lt;tag&gt;</p>')
    expect(out).toBe('Hello world ! & <tag>')
  })

  it('removes <script> blocks entirely (no replacement text)', () => {
    // The function replaces <script>...</script> with '' (not a space),
    // so adjacent text gets joined.
    const out = stripHtml('a<script>alert("x")</script>b')
    expect(out).toBe('ab')
  })

  it('removes <style> blocks entirely (no replacement text)', () => {
    const out = stripHtml('a<style>body { color: red; }</style>b')
    expect(out).toBe('ab')
  })

  it('collapses repeated whitespace into a single space and trims', () => {
    const out = stripHtml('  <p>a   b</p>  ')
    expect(out).toBe('a b')
  })

  it('returns an empty string for empty input', () => {
    expect(stripHtml('')).toBe('')
  })
})

describe('countWords', () => {
  it('counts English words', () => {
    expect(countWords('hello world foo')).toBe(3)
  })

  it('counts CJK characters individually', () => {
    // Five CJK characters
    expect(countWords('你好世界好')).toBe(5)
  })

  it('counts a mix of CJK characters and English words', () => {
    // "Hello 世界 foo" -> 1 English (Hello) + 2 CJK (世, 界) + 1 English (foo) = 4
    expect(countWords('Hello 世界 foo')).toBe(4)
  })

  it('counts words in rendered markdown (ignores markup)', () => {
    // Bold text content counts, but the ** markers do not add words.
    expect(countWords('**hello** world')).toBe(2)
  })

  it('returns 0 for empty input', () => {
    expect(countWords('')).toBe(0)
  })

  it('returns 0 for null/undefined input', () => {
    expect(countWords(null as unknown as string)).toBe(0)
    expect(countWords(undefined as unknown as string)).toBe(0)
  })
})
