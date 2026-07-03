/**
 * 文本统计分析工具集
 *
 * - 统计字符数、词数、行数、句子数、段落数
 * - 兼容中英文混合计数（CJK 按字、英文按词）
 * - 提供基于阅读速度的预计阅读时间
 */
export interface TextStats {
  characters: number
  charactersNoSpaces: number
  words: number
  lines: number
  sentences: number
  paragraphs: number
  readingTimeMin: number
}

export function analyzeText(text: string): TextStats {
  if (!text) {
    return {
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      lines: 0,
      sentences: 0,
      paragraphs: 0,
      readingTimeMin: 0,
    }
  }

  const characters = text.length
  const charactersNoSpaces = text.replace(/\s/g, '').length
  const lines = text.split(/\r\n|\r|\n/).length

  // 词数：英文按空白分词 + CJK 按字符计
  const cjkCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const enWords = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[a-zA-Z0-9]+/g) || []).length
  const words = cjkCount + enWords

  // 句子：按中英文句末标点分割
  const sentences = (text.match(/[^。！？.!?]+[。！？.!?]+/g) || []).length
    || (text.trim() ? 1 : 0)

  // 段落：按空行分割
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length

  // 阅读时间：英文 200 词/分，中文 300 字/分；混合估算
  const enTime = enWords / 200
  const cjkTime = cjkCount / 300
  const readingTimeMin = Math.max(1, Math.ceil(enTime + cjkTime))

  return {
    characters,
    charactersNoSpaces,
    words,
    lines,
    sentences,
    paragraphs,
    readingTimeMin,
  }
}
