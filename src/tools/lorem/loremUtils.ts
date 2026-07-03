/**
 * Lorem Ipsum 占位文本生成工具集
 *
 * - 支持按段落、句子、单词生成随机占位文本
 * - 可选经典开头 "lorem ipsum dolor sit amet..."
 * - 内置词库与随机句段组装逻辑
 */
export type LoremUnit = 'paragraph' | 'sentence' | 'word'

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
]

const CLASSIC_OPENING = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomWord(): string {
  return LOREM_WORDS[randomInt(0, LOREM_WORDS.length - 1)]!
}

function generateSentence(): string {
  const len = randomInt(8, 15)
  const words: string[] = []
  for (let i = 0; i < len; i++) words.push(randomWord())
  let s = words.join(' ')
  // 首字母大写 + 句号
  return s.charAt(0).toUpperCase() + s.slice(1) + '.'
}

function generateParagraph(): string {
  const len = randomInt(4, 8)
  const sentences: string[] = []
  for (let i = 0; i < len; i++) sentences.push(generateSentence())
  return sentences.join(' ')
}

export function generateLorem(unit: LoremUnit, count: number, startWithClassic: boolean = false): string {
  const n = Math.max(1, Math.min(100, count))
  const parts: string[] = []

  if (unit === 'word') {
    if (startWithClassic) {
      const classicWords = CLASSIC_OPENING.split(' ').slice(0, n)
      return classicWords.join(' ')
    }
    for (let i = 0; i < n; i++) parts.push(randomWord())
    return parts.join(' ')
  }

  if (unit === 'sentence') {
    for (let i = 0; i < n; i++) parts.push(generateSentence())
    if (startWithClassic) {
      // 首句替换为经典开头
      const classic = CLASSIC_OPENING.split(' ').slice(0, 8).join(' ')
      parts[0] = classic.charAt(0).toUpperCase() + classic.slice(1) + '.'
    }
    return parts.join(' ')
  }

  // paragraph
  for (let i = 0; i < n; i++) parts.push(generateParagraph())
  if (startWithClassic) {
    parts[0] = generateParagraph()
  }
  return parts.join('\n\n')
}
