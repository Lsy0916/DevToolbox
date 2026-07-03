<!--
  RegexTool 正则表达式工具
  用于编写、测试和替换正则表达式的交互式工具。
  - 支持全局、忽略大小写、多行等多种标志位组合
  - 实时展示匹配结果、捕获组、替换文本及匹配数量
  - 内置常用正则预设可一键应用
-->
<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import ActionButtons from '@/components/ActionButtons.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import { useClipboard } from '@/composables/useClipboard'
import { buildRegex, matchAll, replaceAll, splitByMatches, extractGroups, countMatches } from './regexUtils'
import { REGEX_PRESETS } from '@/utils/constants'
import type { RegexMatch } from '@/types'

defineOptions({ name: 'RegexTool' })

const { t } = useI18n()

type FlagKey = 'g' | 'i' | 'm' | 's' | 'u' | 'y'
const flagList: FlagKey[] = ['g', 'i', 'm', 's', 'u', 'y']

const flags = reactive<Record<FlagKey, boolean>>({
  g: true,
  i: false,
  m: false,
  s: false,
  u: false,
  y: false,
})

const pattern = ref('\\d+')
const testText = ref('abc123def456ghi789')
const replacePattern = ref('#')
const selectedPreset = ref('')

const { saveHistory } = useHistory('regex')
const { showSuccess } = useNotification()
const { copy } = useClipboard()

const flagsString = computed(() => flagList.filter((f) => flags[f]).join(''))

const buildResult = computed(() => buildRegex(pattern.value, flagsString.value))

const matches = computed<RegexMatch[]>(() => {
  if (!buildResult.value.regex) return []
  return matchAll(testText.value, buildResult.value.regex)
})

const segments = computed(() => splitByMatches(testText.value, matches.value))

const replacedText = computed(() => {
  if (!buildResult.value.regex) return testText.value
  return replaceAll(testText.value, buildResult.value.regex, replacePattern.value)
})

const matchCount = computed(() => {
  if (!buildResult.value.regex) return 0
  return countMatches(testText.value, buildResult.value.regex)
})

const extractedGroups = computed(() => {
  if (!buildResult.value.regex) return []
  return extractGroups(testText.value, buildResult.value.regex)
})

function applyPreset(name: string): void {
  const preset = REGEX_PRESETS.find((p) => p.name === name)
  if (!preset) return
  pattern.value = preset.pattern
  for (const f of flagList) {
    flags[f] = preset.flags.includes(f)
  }
}

function handleClear(): void {
  pattern.value = ''
  testText.value = ''
  replacePattern.value = ''
  selectedPreset.value = ''
}

function handleSave(): void {
  if (!pattern.value) return
  void saveHistory(`/${pattern.value}/${flagsString.value}`, replacedText.value)
  showSuccess(t('tools.regex.messages.saved'))
}

async function copyReplaced(): Promise<void> {
  const ok = await copy(replacedText.value)
  if (ok) showSuccess(t('common.copySuccess'))
}
</script>

<template>
  <ToolCard
    :title="t('tools.regex.title')"
    :description="t('tools.regex.description')"
    tool-id="regex"
    layout="wide"
  >
    <template #actions>
      <div class="flex flex-wrap items-center gap-3">
        <select
          v-model="selectedPreset"
          class="mag-input w-auto"
          :aria-label="t('tools.regex.labels.presets')"
          @change="applyPreset(selectedPreset)"
        >
          <option value="">{{ t('tools.regex.labels.presets') }}...</option>
          <option v-for="preset in REGEX_PRESETS" :key="preset.name" :value="preset.name">
            {{ preset.name }}
          </option>
        </select>
      </div>
    </template>

    <template #input>
      <div class="space-y-3">
        <div>
          <label class="mag-label">{{ t('tools.regex.labels.pattern') }}</label>
          <div class="flex items-center gap-2">
            <span class="font-mono text-slate-400">/</span>
            <input
              v-model="pattern"
              type="text"
              class="mag-input mag-input-mono flex-1"
              :placeholder="t('tools.regex.labels.pattern') + '...'"
              aria-label="Regex pattern"
            />
            <span class="font-mono text-slate-400">/{{ flagsString }}</span>
          </div>
        </div>

        <div>
          <label class="mag-label-sm">{{ t('tools.regex.labels.flags') }}</label>
          <div class="flex flex-wrap gap-3">
            <label
              v-for="flag in flagList"
              :key="flag"
              class="flex cursor-pointer items-center gap-1 text-sm text-slate-600 dark:text-slate-300"
            >
              <input
                v-model="flags[flag]"
                type="checkbox"
                class="rounded"
              />
              <span class="font-mono">{{ flag }}</span>
            </label>
          </div>
        </div>

        <div>
          <label class="mag-label">{{ t('tools.regex.labels.testText') }}</label>
          <textarea
            v-model="testText"
            class="mag-textarea mag-input-mono h-40"
            :placeholder="t('tools.regex.labels.testText') + '...'"
            aria-label="Test text"
          />
        </div>

        <p v-if="buildResult.error" class="text-sm text-red-600 dark:text-red-400">
          {{ buildResult.error }}
        </p>
      </div>
    </template>

    <template #output>
      <div class="space-y-4">
        <div>
          <div class="mb-2 flex items-center justify-between">
            <label class="mag-label-inline">
              {{ t('tools.regex.labels.matches') }}
              <span v-if="matches.length" class="ml-1 text-slate-400">({{ matchCount }})</span>
            </label>
            <ActionButtons :text="replacedText" :show-save="false" @clear="handleClear" />
          </div>
          <div class="mag-cell max-h-40 overflow-y-auto font-mono text-sm">
            <p v-if="!testText" class="text-slate-400">{{ t('tools.regex.labels.noTestText') }}</p>
            <p v-else-if="!matches.length" class="text-slate-500 dark:text-slate-400">{{ testText }}</p>
            <div v-else class="whitespace-pre-wrap break-words leading-relaxed">
              <span
                v-for="(seg, i) in segments"
                :key="i"
                :class="seg.matched
                  ? 'rounded bg-yellow-200 px-0.5 text-slate-900 dark:bg-yellow-500/40 dark:text-yellow-100'
                  : 'text-slate-600 dark:text-slate-400'"
              >{{ seg.text }}</span>
            </div>
          </div>
        </div>

        <div v-if="matches.length">
          <label class="mag-label">{{ t('tools.regex.labels.matchDetails') }}</label>
          <div class="overflow-hidden rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50/60 text-xs uppercase text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
                <tr>
                  <th class="px-3 py-2">#</th>
                  <th class="px-3 py-2">{{ t('common.result') }}</th>
                  <th class="px-3 py-2">{{ t('tools.regex.labels.index') }}</th>
                  <th class="px-3 py-2">{{ t('tools.regex.labels.groups') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700/40">
                <tr
                  v-for="(match, i) in matches"
                  :key="i"
                  class="text-slate-600 dark:text-slate-300"
                >
                  <td class="px-3 py-2 text-slate-400">{{ i + 1 }}</td>
                  <td class="px-3 py-2 font-mono">{{ match.text }}</td>
                  <td class="px-3 py-2 text-slate-400">{{ match.index }}</td>
                  <td class="px-3 py-2 font-mono text-xs">
                    {{ match.groups.length ? match.groups.join(', ') : '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 提取的捕获组 -->
        <div v-if="extractedGroups.length">
          <label class="mag-label">{{ t('tools.regex.labels.groupsExtracted') }}</label>
          <div class="space-y-2">
            <div
              v-for="(group, i) in extractedGroups"
              :key="i"
              class="mag-cell font-mono !text-xs"
            >
              <span class="text-slate-400">#{{ i + 1 }}</span> {{ group.join(' | ') }}
            </div>
          </div>
        </div>

        <div>
          <label class="mag-label">{{ t('tools.regex.actions.replace') }}</label>
          <input
            v-model="replacePattern"
            type="text"
            class="mag-input mag-input-mono mb-2"
            :placeholder="t('tools.regex.actions.replace') + '... ($1, $2)'"
            aria-label="Replacement text"
          />
          <div class="mag-cell font-mono text-sm">
            <p v-if="!testText" class="text-slate-400">{{ t('tools.regex.labels.noTestText') }}</p>
            <p v-else class="whitespace-pre-wrap break-words text-slate-600 dark:text-slate-300">{{ replacedText }}</p>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <button
            class="mag-btn"
            @click="copyReplaced"
          >
            {{ t('common.copy') }}
          </button>
          <button
            class="mag-btn-primary"
            @click="handleSave"
          >
            {{ t('tools.regex.actions.save') }}
          </button>
        </div>
      </div>
    </template>

    <template #history>
      <HistoryList tool="regex" @select="(item) => { pattern = item.input; testText = item.output }" />
    </template>
  </ToolCard>
</template>
