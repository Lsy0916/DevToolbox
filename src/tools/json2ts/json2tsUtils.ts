/**
 * JSON 转 TypeScript interface 生成器
 *
 * - 递归推断 JSON 值的 TS 类型并生成 interface 声明
 * - 支持可选字段、联合类型、数组单数化及 export 关键字选项
 * - 自动 PascalCase 接口命名与同名接口去重
 */

export interface Json2tsOptions {
  rootName: string
  optionalFields: boolean
  unionTypes: boolean
  singularArrayItems: boolean
  exportKeyword: boolean
}

interface FieldInfo {
  name: string
  type: string
  optional: boolean
}

interface InterfaceDecl {
  name: string
  fields: FieldInfo[]
}

// 简单单数化（去尾部 s）
function singularize(name: string): string {
  if (!name) return name
  if (name.endsWith('ies')) return name.slice(0, -3) + 'y'
  if (name.endsWith('ses')) return name.slice(0, -2)
  if (name.endsWith('s') && !name.endsWith('ss')) return name.slice(0, -1)
  return name
}

// 首字母大写
function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// 把字段名转为合法的 PascalCase 接口名
function toPascalCase(name: string): string {
  if (!name) return 'Item'
  const parts = name.split(/[-_\s]+/).filter(Boolean)
  if (parts.length === 0) return 'Item'
  return parts.map(capitalize).join('')
}

// 推断 JSON 值的 TS 类型字符串
function inferType(
  value: unknown,
  fieldName: string,
  interfaces: InterfaceDecl[],
  options: Json2tsOptions,
  depth: number = 0,
): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'

  const type = typeof value

  if (type === 'string') return 'string'
  if (type === 'number') return 'number'
  if (type === 'boolean') return 'boolean'

  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]'
    // 收集所有元素的类型
    const elementTypes = value.map((v) =>
      inferType(v, singularize(fieldName), interfaces, options, depth + 1),
    )
    if (options.unionTypes) {
      const unique = Array.from(new Set(elementTypes))
      if (unique.length === 1) return `${unique[0]}[]`
      return `(${unique.join(' | ')})[]`
    }
    // 不启用联合类型，取第一个元素类型
    return `${elementTypes[0]}[]`
  }

  if (type === 'object' && value !== null) {
    const interfaceName = depth === 0 && fieldName === options.rootName
      ? options.rootName
      : toPascalCase(fieldName)
    const decl = buildInterface(value as Record<string, unknown>, interfaceName, interfaces, options, depth)
    if (decl) interfaces.push(decl)
    return interfaceName
  }

  return 'unknown'
}

// 从对象构建 interface 声明
function buildInterface(
  obj: Record<string, unknown>,
  name: string,
  interfaces: InterfaceDecl[],
  options: Json2tsOptions,
  depth: number,
): InterfaceDecl | null {
  const fields: FieldInfo[] = []
  const keys = Object.keys(obj)

  for (const key of keys) {
    const value = obj[key]
    const type = inferType(value, key, interfaces, options, depth + 1)
    const isOptional = options.optionalFields && (value === null || value === undefined)
    fields.push({
      name: /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`,
      type,
      optional: isOptional,
    })
  }

  return { name, fields }
}

// 主入口：JSON 字符串 → TS 代码
export function json2ts(jsonStr: string, options: Json2tsOptions): string {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`)
  }

  const interfaces: InterfaceDecl[] = []
  const rootType = inferType(parsed, options.rootName, interfaces, options, 0)

  // 如果根是数组，外层包一层
  if (Array.isArray(parsed)) {
    const elementType = rootType
    const rootDecl: InterfaceDecl = {
      name: options.rootName,
      fields: [{
        name: 'items',
        type: elementType,
        optional: false,
      }],
    }
    interfaces.unshift(rootDecl)
  }

  // 序列化为 TS 代码
  const lines: string[] = []
  const exportKw = options.exportKeyword ? 'export ' : ''

  // 去重（同名接口只保留第一个）
  const seen = new Set<string>()
  const unique = interfaces.filter((i) => {
    if (seen.has(i.name)) return false
    seen.add(i.name)
    return true
  })

  for (const iface of unique) {
    lines.push(`${exportKw}interface ${iface.name} {`)
    for (const field of iface.fields) {
      const opt = field.optional ? '?' : ''
      lines.push(`  ${field.name}${opt}: ${field.type};`)
    }
    lines.push('}')
    lines.push('')
  }

  // 如果根是基本类型，添加 type 别名
  if (!Array.isArray(parsed) && typeof parsed !== 'object') {
    lines.unshift(`${exportKw}type ${options.rootName} = ${rootType};`)
    lines.push('')
  }

  return lines.join('\n').trimEnd()
}

// 默认选项
export const DEFAULT_OPTIONS: Json2tsOptions = {
  rootName: 'Root',
  optionalFields: true,
  unionTypes: true,
  singularArrayItems: true,
  exportKeyword: true,
}
