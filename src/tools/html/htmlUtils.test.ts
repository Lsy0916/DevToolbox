import { describe, it, expect } from 'vitest'
import {
  encodeHtml,
  decodeHtml,
  HTML_ENTITIES,
  stripHtmlTags,
  encodeFullEntities,
  countEntities,
} from './htmlUtils'

describe('htmlUtils', () => {
  describe('encodeHtml', () => {
    it('encodes < to &lt;', () => {
      expect(encodeHtml('<div>')).toBe('&lt;div&gt;')
    })

    it('encodes > to &gt;', () => {
      expect(encodeHtml('>')).toBe('&gt;')
    })

    it('encodes & to &amp;', () => {
      expect(encodeHtml('a & b')).toBe('a &amp; b')
    })

    it('encodes double quotes', () => {
      expect(encodeHtml('"hello"')).toBe('&quot;hello&quot;')
    })

    it('encodes single quotes', () => {
      expect(encodeHtml("it's")).toBe('it&#x27;s')
    })

    it('encodes all special chars in a complex string', () => {
      expect(encodeHtml('<a href="x" title=\'y\'>A & B</a>')).toBe(
        '&lt;a href=&quot;x&quot; title=&#x27;y&#x27;&gt;A &amp; B&lt;/a&gt;',
      )
    })

    it('preserves & encoding first to avoid double-encoding', () => {
      // & must be encoded first so we don't double-encode the & in &lt;
      expect(encodeHtml('&lt;')).toBe('&amp;lt;')
    })

    it('handles empty string', () => {
      expect(encodeHtml('')).toBe('')
    })

    it('leaves plain text unchanged', () => {
      expect(encodeHtml('hello world')).toBe('hello world')
    })

    it('preserves non-ASCII characters (only escapes the 5 special chars)', () => {
      expect(encodeHtml('café < tea')).toBe('café &lt; tea')
    })
  })

  describe('decodeHtml', () => {
    it('decodes &lt; back to <', () => {
      expect(decodeHtml('&lt;div&gt;')).toBe('<div>')
    })

    it('decodes &amp; back to &', () => {
      expect(decodeHtml('a &amp; b')).toBe('a & b')
    })

    it('decodes &quot; back to "', () => {
      expect(decodeHtml('&quot;hi&quot;')).toBe('"hi"')
    })

    it('decodes &#x27; back to single quote', () => {
      expect(decodeHtml('it&#x27;s')).toBe("it's")
    })

    it('decodes decimal entities', () => {
      expect(decodeHtml('&#60;tag&#62;')).toBe('<tag>')
    })

    it('decodes named entities like &copy;', () => {
      expect(decodeHtml('&copy; 2024')).toBe('© 2024')
    })

    it('decodes &nbsp;', () => {
      // jsdom decodes &nbsp; to U+00A0
      expect(decodeHtml('a&nbsp;b')).toBe('a\u00A0b')
    })

    it('decodes a complex encoded string', () => {
      const encoded = '&lt;a href=&quot;x&quot;&gt;A &amp; B&lt;/a&gt;'
      expect(decodeHtml(encoded)).toBe('<a href="x">A & B</a>')
    })

    it('handles empty string', () => {
      expect(decodeHtml('')).toBe('')
    })

    it('returns plain text unchanged', () => {
      expect(decodeHtml('hello world')).toBe('hello world')
    })
  })

  describe('HTML_ENTITIES', () => {
    it('is a non-empty array', () => {
      expect(Array.isArray(HTML_ENTITIES)).toBe(true)
      expect(HTML_ENTITIES.length).toBeGreaterThan(0)
    })

    it('contains the & entity with name, decimal, hex forms', () => {
      const amp = HTML_ENTITIES.find((e) => e.char === '&')
      expect(amp).toBeDefined()
      expect(amp?.name).toBe('&amp;')
      expect(amp?.decimal).toBe('&#38;')
      expect(amp?.hex).toBe('&#x26;')
    })

    it('each entry has char, name, decimal, hex fields', () => {
      for (const e of HTML_ENTITIES) {
        expect(typeof e.char).toBe('string')
        expect(typeof e.name).toBe('string')
        expect(typeof e.decimal).toBe('string')
        expect(typeof e.hex).toBe('string')
      }
    })

    it('contains expected core entities', () => {
      const chars = HTML_ENTITIES.map((e) => e.char)
      expect(chars).toEqual(
        expect.arrayContaining(['&', '<', '>', '"', "'"]),
      )
    })
  })

  describe('stripHtmlTags', () => {
    it('removes simple tags', () => {
      expect(stripHtmlTags('<p>hello</p>')).toBe('hello')
    })

    it('removes nested tags', () => {
      expect(stripHtmlTags('<div><p>hello <b>world</b></p></div>')).toBe(
        'hello world',
      )
    })

    it('removes tags with attributes', () => {
      expect(
        stripHtmlTags('<a href="http://x.com" class="link">click</a>'),
      ).toBe('click')
    })

    it('removes self-closing tags', () => {
      expect(stripHtmlTags('a<br/>b<hr>c')).toBe('abc')
    })

    it('removes void tags without closing slash', () => {
      expect(stripHtmlTags('line1<br>line2')).toBe('line1line2')
    })

    it('returns plain text unchanged', () => {
      expect(stripHtmlTags('no tags here')).toBe('no tags here')
    })

    it('handles empty string', () => {
      expect(stripHtmlTags('')).toBe('')
    })

    it('handles string with only tags', () => {
      expect(stripHtmlTags('<div></div>')).toBe('')
    })

    it('preserves text between multiple tags', () => {
      expect(stripHtmlTags('<h1>Title</h1><p>Body</p>')).toBe('TitleBody')
    })
  })

  describe('encodeFullEntities', () => {
    it('encodes non-ASCII chars to hex entities', () => {
      expect(encodeFullEntities('café')).toBe('caf&#xE9;')
    })

    it('encodes Chinese characters', () => {
      // '中' U+4E2D, '文' U+6587
      expect(encodeFullEntities('中文')).toBe('&#x4E2D;&#x6587;')
    })

    it('encodes emoji as its surrogate-pair code units', () => {
      // The function operates on UTF-16 code units via /[^\x00-\x7F]/g,
      // so an astral-plane char (🚀 = U+1F680, surrogate pair D83D DE80)
      // is encoded as two separate surrogate entities.
      expect(encodeFullEntities('🚀')).toBe('&#xD83D;&#xDE80;')
    })

    it('leaves ASCII characters unchanged', () => {
      expect(encodeFullEntities('hello < world >')).toBe('hello < world >')
    })

    it('handles empty string', () => {
      expect(encodeFullEntities('')).toBe('')
    })

    it('round-trips via decodeHtml (named/hex)', () => {
      const original = 'café 中文'
      const encoded = encodeFullEntities(original)
      expect(decodeHtml(encoded)).toBe(original)
    })
  })

  describe('countEntities', () => {
    it('counts named entities', () => {
      expect(countEntities('&lt;div&gt;')).toBe(2)
    })

    it('counts &amp;', () => {
      expect(countEntities('a &amp; b')).toBe(1)
    })

    it('counts decimal entities', () => {
      expect(countEntities('&#60;&#62;')).toBe(2)
    })

    it('counts hex entities', () => {
      expect(countEntities('&#x26; &#xA9;')).toBe(2)
    })

    it('returns 0 for plain text', () => {
      expect(countEntities('hello world')).toBe(0)
    })

    it('returns 0 for empty string', () => {
      expect(countEntities('')).toBe(0)
    })

    it('does not count a bare ampersand without semicolon', () => {
      expect(countEntities('a & b')).toBe(0)
    })

    it('counts mixed entities', () => {
      expect(countEntities('&amp; &#60; &#x26; &copy;')).toBe(4)
    })
  })
})
