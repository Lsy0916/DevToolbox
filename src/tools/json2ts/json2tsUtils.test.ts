import { describe, it, expect } from 'vitest'
import { json2ts, DEFAULT_OPTIONS } from './json2tsUtils'

describe('json2tsUtils', () => {
  describe('json2ts', () => {
    it('converts a simple flat object', () => {
      expect(json2ts('{"name":"John","age":30}', DEFAULT_OPTIONS)).toBe(
        'export interface Root {\n  name: string;\n  age: number;\n}',
      )
    })

    it('converts a nested object into multiple interfaces', () => {
      expect(json2ts('{"user":{"name":"John"}}', DEFAULT_OPTIONS)).toBe(
        'export interface User {\n  name: string;\n}\n\nexport interface Root {\n  user: User;\n}',
      )
    })

    it('converts a deeply nested object', () => {
      expect(json2ts('{"a":{"b":{"c":1}}}', DEFAULT_OPTIONS)).toBe(
        'export interface B {\n  c: number;\n}\n\nexport interface A {\n  b: B;\n}\n\nexport interface Root {\n  a: A;\n}',
      )
    })

    it('converts an array of primitives', () => {
      expect(json2ts('[1,2,3]', DEFAULT_OPTIONS)).toBe(
        'export interface Root {\n  items: number[];\n}',
      )
    })

    it('handles empty arrays as unknown[]', () => {
      expect(json2ts('{"items":[]}', DEFAULT_OPTIONS)).toBe(
        'export interface Root {\n  items: unknown[];\n}',
      )
    })

    it('handles null values as optional fields', () => {
      expect(json2ts('{"name":null}', DEFAULT_OPTIONS)).toBe(
        'export interface Root {\n  name?: null;\n}',
      )
    })

    it('keeps null fields required when optionalFields is false', () => {
      expect(json2ts('{"name":null}', { ...DEFAULT_OPTIONS, optionalFields: false })).toBe(
        'export interface Root {\n  name: null;\n}',
      )
    })

    it('produces a union type for mixed arrays when unionTypes is true', () => {
      const result = json2ts('[1,"two",true]', DEFAULT_OPTIONS)
      expect(result).toContain('items: (number | string | boolean)[];')
    })

    it('uses the first element type when unionTypes is false', () => {
      const result = json2ts('[1,"two"]', { ...DEFAULT_OPTIONS, unionTypes: false })
      expect(result).toContain('items: number[];')
    })

    it('omits the export keyword when exportKeyword is false', () => {
      expect(json2ts('{"name":"John"}', { ...DEFAULT_OPTIONS, exportKeyword: false })).toBe(
        'interface Root {\n  name: string;\n}',
      )
    })

    it('uses a custom rootName', () => {
      expect(json2ts('{"name":"John"}', { ...DEFAULT_OPTIONS, rootName: 'MyType' })).toBe(
        'export interface MyType {\n  name: string;\n}',
      )
    })

    it('produces a type alias for a primitive string root', () => {
      expect(json2ts('"hello"', DEFAULT_OPTIONS)).toBe('export type Root = string;')
    })

    it('produces a type alias for a boolean root', () => {
      expect(json2ts('true', DEFAULT_OPTIONS)).toBe('export type Root = boolean;')
    })

    it('quotes field names that are not valid identifiers', () => {
      const result = json2ts('{"with-dash":1}', DEFAULT_OPTIONS)
      expect(result).toContain(`'with-dash': number;`)
    })

    it('throws on invalid JSON', () => {
      expect(() => json2ts('{invalid}', DEFAULT_OPTIONS)).toThrow(/Invalid JSON/)
    })
  })

  describe('DEFAULT_OPTIONS', () => {
    it('uses "Root" as the root name', () => {
      expect(DEFAULT_OPTIONS.rootName).toBe('Root')
    })

    it('enables optionalFields, unionTypes, and exportKeyword by default', () => {
      expect(DEFAULT_OPTIONS.optionalFields).toBe(true)
      expect(DEFAULT_OPTIONS.unionTypes).toBe(true)
      expect(DEFAULT_OPTIONS.exportKeyword).toBe(true)
    })
  })
})
