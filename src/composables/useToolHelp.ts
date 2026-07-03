/**
 * useToolHelp — 工具帮助内容加载组合式函数
 *
 * 从 i18n locale 文件中读取指定工具的帮助内容，包括：
 * - overview: 工具简介
 * - steps: 使用步骤数组（每项含 title + detail）
 * - tips: 小贴士字符串数组
 * - notes: 注意事项数组（每项含 type + text，type 区分 info/warning/tip）
 *
 * i18n key 规则：`tools.{normalizedToolId}.help.{字段}`
 * 其中 normalizedToolId 会去掉连字符（如 'data-manager' → 'datamanager'），
 * 与 locale 文件中的 key 命名保持一致。
 *
 * 使用 vue-i18n 的 tm（取原始消息）/ rt（渲染翻译）/ te（判断存在）API，
 * 因为 steps/tips/notes 是数组结构，需要 tm 取原始值再手动遍历渲染。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { HelpStep, HelpNote, HelpNoteType } from '@/types'

export function useToolHelp(toolId: string) {
  const { t, tm, rt, te } = useI18n()
  // 去掉连字符以匹配 locale key（如 'data-manager' → 'datamanager'）
  const normalizedId = toolId.replace(/-/g, '')
  const base = `tools.${normalizedId}.help`

  // tm 的类型签名较宽，转为接受 string 返回 unknown 的形式便于数组判断
  const tmRaw = tm as (key: string) => unknown

  /** 该工具是否存在帮助内容（用于控制帮助图标显示） */
  const hasHelp = computed(() => te(base))

  /** 工具简介文本，无帮助内容时返回空字符串 */
  const overview = computed(() => (hasHelp.value ? t(`${base}.overview`) : ''))

  /**
   * 使用步骤列表。每步含标题与详情，通过 rt 渲染可能的嵌套 i18n 链接。
   * locale 中不存在或格式非数组时返回空数组。
   */
  const steps = computed<HelpStep[]>(() => {
    const raw = tmRaw(`${base}.steps`)
    if (!Array.isArray(raw)) return []
    return (raw as unknown[]).map((s) => {
      const o = s as { title: string; detail: string }
      return { title: rt(o.title), detail: rt(o.detail) }
    })
  })

  /** 小贴士字符串数组，每条已通过 rt 渲染 */
  const tips = computed<string[]>(() => {
    const raw = tmRaw(`${base}.tips`)
    if (!Array.isArray(raw)) return []
    return (raw as unknown[]).map((s) => rt(s as string))
  })

  /**
   * 注意事项列表。每项含 type（info/warning/tip）与 text，
   * 用于 HelpTooltip 中按类型着色显示。
   */
  const notes = computed<HelpNote[]>(() => {
    const raw = tmRaw(`${base}.notes`)
    if (!Array.isArray(raw)) return []
    return (raw as unknown[]).map((n) => {
      const o = n as { type: HelpNoteType; text: string }
      return { type: o.type, text: rt(o.text) }
    })
  })

  return { hasHelp, overview, steps, tips, notes }
}
