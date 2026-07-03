<!--
  JwtTool
  JWT 令牌处理工具组件，提供令牌的解码、验证与生成能力。
  - 支持解码查看 Header/Payload/Signature 并显示过期状态
  - 支持 HS256 签名验证、按 Payload 生成新令牌
  - 提供 Claims 字段含义解释表格
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import ActionButtons from '@/components/ActionButtons.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import { parseJwt, getJwtStatus, formatRemainingTime, verifyHs256, generateJwt, explainClaims } from './jwtUtils'
import type { JwtPayload } from '@/types'

defineOptions({ name: 'JwtTool' })

const { t, te } = useI18n()

const token = ref('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRldlRvb2xib3giLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.signature')
const secret = ref('')
const payloadText = ref('{\n  "sub": "1234567890",\n  "name": "DevToolbox",\n  "iat": 1700000000\n}')
const parsed = ref<JwtPayload | null>(null)
const error = ref<string | null>(null)
const generatedToken = ref('')
const claimsList = ref<Array<{ key: string; value: string; desc: string }>>([])
const view = ref<'decoded' | 'generated' | 'claims'>('decoded')

const { saveHistory } = useHistory('jwt')
const { showSuccess, showError } = useNotification()

const status = computed(() => (parsed.value ? getJwtStatus(parsed.value) : null))

const headerJson = computed(() =>
  parsed.value ? JSON.stringify(parsed.value.header, null, 2) : '',
)
const payloadJson = computed(() =>
  parsed.value ? JSON.stringify(parsed.value.payload, null, 2) : '',
)

function handleDecode(): void {
  if (!token.value.trim()) {
    error.value = t('tools.jwt.messages.enterToken')
    parsed.value = null
    showError(error.value)
    return
  }
  try {
    parsed.value = parseJwt(token.value)
    error.value = null
    view.value = 'decoded'
    void saveHistory(token.value, payloadJson.value)
    showSuccess(t('tools.jwt.messages.decoded'))
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('tools.jwt.messages.verifyFailed')
    parsed.value = null
    showError(error.value)
  }
}

function handleVerify(): void {
  if (!token.value.trim()) {
    showError(t('tools.jwt.messages.enterToken'))
    return
  }
  if (!secret.value) {
    showError(t('tools.jwt.messages.noSecret'))
    return
  }
  try {
    const ok = verifyHs256(token.value, secret.value)
    if (ok) {
      showSuccess(t('tools.jwt.messages.valid'))
    } else {
      showError(t('tools.jwt.messages.invalidSig'))
    }
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.jwt.messages.verifyFailed'))
  }
}

function handleGenerate(): void {
  if (!secret.value) {
    showError(t('tools.jwt.messages.noSecret'))
    return
  }
  try {
    const payload = JSON.parse(payloadText.value)
    generatedToken.value = generateJwt(payload, secret.value)
    view.value = 'generated'
    void saveHistory(payloadText.value.slice(0, 100), generatedToken.value)
    showSuccess(t('tools.jwt.messages.generated'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.json.messages.invalid'))
  }
}

function handleExplain(): void {
  if (!parsed.value) {
    handleDecode()
    if (!parsed.value) return
  }
  claimsList.value = explainClaims(parsed.value)
  view.value = 'claims'
  showSuccess(t('tools.jwt.actions.explain'))
}

function handleClear(): void {
  token.value = ''
  parsed.value = null
  error.value = null
  generatedToken.value = ''
  claimsList.value = []
}

function formatTimestamp(ts?: number): string {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleString()
}

// 映射 claim key 到 i18n 文案，缺失则回退到 utils 的 desc
function claimMeaning(row: { key: string; desc: string }): string {
  const key = `tools.jwt.claims.${row.key}`
  return te(key) ? t(key) : row.desc
}
</script>

<template>
  <ToolCard
    :title="t('tools.jwt.title')"
    :description="t('tools.jwt.description')"
    tool-id="jwt"
    layout="split"
  >
    <template #actions>
      <div class="flex flex-wrap items-center gap-2">
        <button class="mag-btn" @click="handleDecode">{{ t('tools.jwt.actions.decode') }}</button>
        <button class="mag-btn" @click="handleVerify">{{ t('tools.jwt.actions.verify') }}</button>
        <button class="mag-btn-primary" @click="handleGenerate">{{ t('tools.jwt.actions.generate') }}</button>
        <button class="mag-btn" @click="handleExplain">{{ t('tools.jwt.actions.explain') }}</button>
      </div>
    </template>

    <template #input>
      <label class="mag-label">{{ t('tools.jwt.labels.token') }}</label>
      <textarea
        v-model="token"
        class="mag-textarea mag-input-mono h-28 mag-textarea-xs"
        :placeholder="t('tools.jwt.labels.tokenPlaceholder')"
        aria-label="JWT token input"
      />

      <!-- 密钥 + Payload 双列 -->
      <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label class="mag-label-sm">{{ t('tools.jwt.labels.secret') }}</label>
          <input
            v-model="secret"
            type="text"
            class="mag-input mag-input-mono mag-input-xs"
            placeholder="your-256-bit-secret"
            aria-label="JWT secret"
          />
        </div>
        <div>
          <label class="mag-label-sm">{{ t('tools.jwt.labels.payload') }}</label>
          <textarea
            v-model="payloadText"
            class="mag-textarea mag-input-mono h-20 mag-textarea-xs"
            aria-label="JWT payload for generate"
          />
        </div>
      </div>

      <div v-if="error" class="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
        {{ error }}
      </div>
    </template>

    <template #output>
      <!-- 解码视图 -->
      <div v-if="view === 'decoded' && parsed" class="space-y-4">
        <!-- 过期状态 -->
        <div v-if="status" class="flex flex-wrap items-center gap-3 rounded-lg p-3" :class="status.isExpired ? 'bg-red-50 dark:bg-red-900/20' : status.willExpireSoon ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'">
          <span class="text-sm font-medium" :class="status.isExpired ? 'text-red-700 dark:text-red-400' : status.willExpireSoon ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'">
            {{ status.isExpired ? t('tools.jwt.status.expired') : status.willExpireSoon ? t('tools.jwt.status.expiresSoon') : t('tools.jwt.status.active') }}
          </span>
          <span v-if="status.expiryDate" class="text-xs text-slate-500 dark:text-slate-400">
            {{ t('tools.jwt.status.expires') }}{{ status.isExpired ? t('tools.jwt.status.expiredLabel') : '' }}: {{ status.expiryDate.toLocaleString() }}
            <span v-if="!status.isExpired && status.remainingSeconds !== null">
              ({{ formatRemainingTime(status.remainingSeconds) }} {{ t('tools.jwt.status.inTime') }})
            </span>
          </span>
        </div>

        <!-- 三栏：Header / Payload / Signature -->
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
            <div class="mb-2 flex items-center justify-between">
              <h3 class="mag-section-title-sm">{{ t('tools.jwt.labels.header') }}</h3>
              <ActionButtons :text="headerJson" :show-save="false" :show-clear="false" :show-export="false" />
            </div>
            <pre class="mag-cell h-48 overflow-auto font-mono !text-xs">{{ headerJson }}</pre>
          </div>

          <div>
            <div class="mb-2 flex items-center justify-between">
              <h3 class="mag-section-title-sm">{{ t('tools.jwt.labels.payload') }}</h3>
              <ActionButtons :text="payloadJson" :show-save="false" :show-clear="false" :show-export="false" />
            </div>
            <pre class="mag-cell h-48 overflow-auto font-mono !text-xs">{{ payloadJson }}</pre>
          </div>

          <div>
            <h3 class="mag-section-title-sm">{{ t('tools.jwt.labels.signature') }}</h3>
            <div class="rounded-lg border border-slate-200/60 bg-amber-50 p-3 dark:border-slate-700/60 dark:bg-amber-900/10">
              <p class="break-all font-mono text-xs text-slate-600 dark:text-slate-400">{{ parsed.signature }}</p>
              <p class="mt-2 text-xs text-amber-600 dark:text-amber-400">
                {{ t('tools.jwt.claims.cannotVerify') }}
              </p>
            </div>
          </div>
        </div>

        <!-- 时间字段 -->
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="mag-cell">
            <dt class="mag-cell-label">{{ t('tools.jwt.claims.issued') }}</dt>
            <dd class="mag-cell-value">{{ formatTimestamp(parsed.iat) }}</dd>
          </div>
          <div class="mag-cell">
            <dt class="mag-cell-label">{{ t('tools.jwt.claims.notBefore') }}</dt>
            <dd class="mag-cell-value">{{ formatTimestamp(parsed.nbf) }}</dd>
          </div>
          <div class="mag-cell">
            <dt class="mag-cell-label">{{ t('tools.jwt.claims.issuer') }}</dt>
            <dd class="mag-cell-value break-all">{{ parsed.iss ?? '—' }}</dd>
          </div>
          <div class="mag-cell">
            <dt class="mag-cell-label">{{ t('tools.jwt.claims.audience') }}</dt>
            <dd class="mag-cell-value break-all">{{ Array.isArray(parsed.aud) ? parsed.aud.join(', ') : parsed.aud ?? '—' }}</dd>
          </div>
        </div>

        <ActionButtons :text="payloadJson" :show-save="false" file-prefix="jwt-payload" extension="json" @clear="handleClear" />
      </div>

      <!-- 生成视图 -->
      <div v-else-if="view === 'generated' && generatedToken" class="space-y-3">
        <div class="mb-2 flex items-center justify-between">
          <label class="mag-label-inline">{{ t('tools.jwt.actions.generate') }}</label>
          <ActionButtons :text="generatedToken" :show-clear="false" file-prefix="jwt-token" extension="txt" />
        </div>
        <pre class="mag-cell overflow-auto font-mono !text-xs break-all">{{ generatedToken }}</pre>
      </div>

      <!-- Claims 解释视图 -->
      <div v-else-if="view === 'claims' && claimsList.length" class="space-y-3">
        <div class="mb-2 flex items-center justify-between">
          <label class="mag-label-inline">{{ t('tools.jwt.labels.claims') }}</label>
          <ActionButtons :text="payloadJson" :show-save="false" :show-clear="false" :show-export="false" />
        </div>
        <div class="overflow-hidden rounded-lg border border-slate-200/60 dark:border-slate-700/60">
          <table class="w-full text-sm">
            <thead class="bg-slate-50/60 dark:bg-slate-800/40">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('tools.jwt.claims.claim') }}</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('tools.jwt.claims.value') }}</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('tools.jwt.claims.meaning') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700/40">
              <tr v-for="row in claimsList" :key="row.key" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td class="px-3 py-2 font-mono text-primary">{{ row.key }}</td>
                <td class="px-3 py-2 font-mono text-slate-700 dark:text-slate-300 break-all">{{ row.value }}</td>
                <td class="px-3 py-2 text-slate-600 dark:text-slate-400">{{ claimMeaning(row) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="py-12 text-center text-sm text-slate-400">
        {{ t('tools.jwt.messages.enterToken') }}
      </div>
    </template>

    <template #history>
      <HistoryList tool="jwt" @select="(item) => { token = item.input; handleDecode() }" />
    </template>
  </ToolCard>
</template>

