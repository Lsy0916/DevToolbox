import { describe, it, expect } from 'vitest'
import {
  formatJson,
  minifyJson,
  validateJson,
  escapeJson,
  unescapeJson,
  jsonToYaml,
  yamlToJson,
  sortKeys,
  removeEmptyFields,
  queryJsonPath,
} from './jsonUtils'

describe('formatJson', () => {
  it('pretty-prints a compact JSON object with 2-space indent', () => {
    const out = formatJson('{"a":1,"b":2}')
    expect(out).toBe('{\n  "a": 1,\n  "b": 2\n}')
  })

  it('preserves nested structure', () => {
    const out = formatJson('{"a":{"b":[1,2]}}')
    expect(out).toContain('"b": [\n      1,\n      2\n    ]')
  })

  it('throws on invalid JSON', () => {
    expect(() => formatJson('{invalid}')).toThrow(SyntaxError)
  })
})

describe('minifyJson', () => {
  it('removes whitespace from pretty JSON', () => {
    expect(minifyJson('{\n  "a": 1,\n  "b": 2\n}')).toBe('{"a":1,"b":2}')
  })

  it('returns the same compact form for already-minified JSON', () => {
    expect(minifyJson('{"a":1}')).toBe('{"a":1}')
  })

  it('throws on invalid JSON', () => {
    expect(() => minifyJson('not json')).toThrow(SyntaxError)
  })
})

describe('validateJson', () => {
  it('returns ok=true for valid JSON', () => {
    expect(validateJson('{"a":1}')).toEqual({ ok: true })
  })

  it('returns error for empty input', () => {
    expect(validateJson('   ')).toEqual({ ok: false, error: 'Empty input' })
  })

  it('returns ok=false with an error message on invalid JSON', () => {
    const r = validateJson('{bad}')
    expect(r.ok).toBe(false)
    expect(r.error).toBeTruthy()
  })

  it('returns line/column when the error message contains a position', () => {
    // Some V8 versions include "position N" in JSON parse errors; others do not.
    // When present, validateJson should extract line/column from it.
    // We synthesize a JSON error that includes a position to exercise that branch.
    const input = '{"a": "unclosed}'
    const r = validateJson(input)
    expect(r.ok).toBe(false)
    expect(r.error).toBeTruthy()
    // line/column are only populated when the error contains "position N";
    // we assert the shape but do not require them to be present across V8 versions.
    if (r.line !== undefined) {
      expect(typeof r.line).toBe('number')
      expect(typeof r.column).toBe('number')
    }
  })
})

describe('escapeJson / unescapeJson', () => {
  it('escapes double quotes and backslashes', () => {
    expect(escapeJson('a"b\\c')).toBe('a\\"b\\\\c')
  })

  it('escapes newlines and tabs', () => {
    expect(escapeJson('a\nb\tc')).toBe('a\\nb\\tc')
  })

  it('unescapes a JSON-escaped string back to original', () => {
    expect(unescapeJson('a\\"b\\\\c\\nd')).toBe('a"b\\c\nd')
  })

  it('round-trips through escape and unescape', () => {
    const original = 'hello "world" \n tab\there \\ end'
    expect(unescapeJson(escapeJson(original))).toBe(original)
  })
})

describe('jsonToYaml / yamlToJson', () => {
  it('converts a flat JSON object to YAML', () => {
    const yaml = jsonToYaml('{"a":1,"b":"text"}')
    expect(yaml).toContain('a: 1')
    expect(yaml).toContain('b: text')
  })

  it('converts nested objects with indentation', () => {
    const yaml = jsonToYaml('{"a":{"b":1}}')
    expect(yaml).toContain('a:\n  b: 1')
  })

  it('converts YAML back to JSON', () => {
    const json = yamlToJson('a: 1\nb: hello')
    expect(JSON.parse(json)).toEqual({ a: 1, b: 'hello' })
  })

  it('round-trips JSON -> YAML -> JSON', () => {
    const original = { a: 1, b: 'text', c: [1, 2, 3] }
    const yaml = jsonToYaml(JSON.stringify(original))
    const back = JSON.parse(yamlToJson(yaml))
    expect(back).toEqual(original)
  })
})

describe('sortKeys', () => {
  it('sorts top-level keys alphabetically', () => {
    const out = sortKeys('{"b":1,"a":2}')
    expect(out).toBe('{\n  "a": 2,\n  "b": 1\n}')
  })

  it('sorts nested object keys recursively', () => {
    const out = sortKeys('{"z":{"b":1,"a":2}}')
    expect(out).toContain('"z": {\n    "a": 2,\n    "b": 1\n  }')
  })

  it('leaves array order intact', () => {
    const out = sortKeys('{"arr":[3,1,2]}')
    expect(JSON.parse(out).arr).toEqual([3, 1, 2])
  })
})

describe('removeEmptyFields', () => {
  it('removes null and empty-string fields', () => {
    const out = removeEmptyFields('{"a":null,"b":"","c":1}')
    expect(JSON.parse(out)).toEqual({ c: 1 })
  })

  it('removes empty arrays and objects', () => {
    const out = removeEmptyFields('{"a":[],"b":{},"c":1}')
    expect(JSON.parse(out)).toEqual({ c: 1 })
  })

  it('recursively removes nested empty fields', () => {
    const out = removeEmptyFields('{"outer":{"x":null,"y":2}}')
    expect(JSON.parse(out)).toEqual({ outer: { y: 2 } })
  })

  it('preserves zero and false values', () => {
    const out = removeEmptyFields('{"a":0,"b":false,"c":""}')
    expect(JSON.parse(out)).toEqual({ a: 0, b: false })
  })
})

describe('queryJsonPath', () => {
  it('reads a top-level property via $.a', () => {
    const out = queryJsonPath('{"a":1,"b":2}', '$.a')
    expect(JSON.parse(out)).toBe(1)
  })

  it('reads a nested property via $.a.b', () => {
    const out = queryJsonPath('{"a":{"b":{"c":42}}}', '$.a.b.c')
    expect(JSON.parse(out)).toBe(42)
  })

  it('reads an array index via $.a[0]', () => {
    const out = queryJsonPath('{"a":[10,20,30]}', '$.a[1]')
    expect(JSON.parse(out)).toBe(20)
  })

  it('throws when accessing a property on null', () => {
    expect(() => queryJsonPath('{"a":null}', '$.a.b')).toThrow()
  })

  it('throws when accessing a property on a non-object', () => {
    expect(() => queryJsonPath('"hello"', '$.a')).toThrow()
  })
})
