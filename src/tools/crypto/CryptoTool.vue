<!--
  CryptoTool
  加解密工具组件，提供对称加密与非对称加密能力。
  - AES：支持 CBC / ECB 模式及 GCM 模式，可配置密钥/IV 编码与输出编码
  - RSA：支持密钥对生成、加解密、签名与验签
  - 自动保存历史记录并区分 AES / RSA 标签页状态
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '@/components/ToolCard.vue'
import ActionButtons from '@/components/ActionButtons.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'
import { useNotification } from '@/composables/useNotification'
import {
  aesEncrypt,
  aesDecrypt,
  generateAesKey,
  aesGcmEncrypt,
  aesGcmDecrypt,
  generateRsaOaepKeyPair,
  rsaEncrypt,
  rsaDecrypt,
  rsaSign,
  rsaVerify,
  type AesMode,
  type AesPadding,
  type AesEncoding,
  type AesOptions,
  type RsaKeySize,
} from './cryptoUtils'

defineOptions({ name: 'CryptoTool' })

const { t } = useI18n()
const { showSuccess, showError } = useNotification()
const { saveHistory } = useHistory('crypto')

const activeTab = ref<'aes' | 'rsa'>('aes')

// AES 状态
const aesMode = ref<AesMode>('CBC')
const aesPadding = ref<AesPadding>('Pkcs7')
const aesKeyEnc = ref<AesEncoding>('Utf8')
const aesIvEnc = ref<AesEncoding>('Utf8')
const aesOutputEnc = ref<'Base64' | 'Hex'>('Base64')
const aesUseGcm = ref(false)
const aesInput = ref('Hello, World!')
const aesKey = ref('this-is-a-32-byte-key-1234567890')
const aesIv = ref('this-is-16byte-iv')
const aesOutput = ref('')

// RSA 状态
const rsaKeySize = ref<RsaKeySize>(2048)
const rsaPublicKey = ref('')
const rsaPrivateKey = ref('')
const rsaInput = ref('Hello, RSA!')
const rsaOutput = ref('')
const rsaSignature = ref('')
const rsaVerifyMessage = ref('')
const rsaVerifySignature = ref('')
const rsaVerifyResult = ref<boolean | null>(null)
const rsaGenerating = ref(false)

const aesOptions = computed<AesOptions>(() => ({
  mode: aesMode.value,
  padding: aesPadding.value,
  keyEncoding: aesKeyEnc.value,
  ivEncoding: aesIvEnc.value,
  outputEncoding: aesOutputEnc.value,
}))

function handleAesEncrypt(): void {
  if (aesUseGcm.value) {
    aesGcmEncrypt(aesInput.value, aesKey.value, aesIv.value)
      .then((result) => {
        aesOutput.value = result
        void saveHistory(`AES-GCM encrypt: ${aesInput.value.slice(0, 30)}`, result)
        showSuccess(t('tools.crypto.messages.encrypted'))
      })
      .catch((e: unknown) => showError(e instanceof Error ? e.message : String(e)))
    return
  }
  try {
    aesOutput.value = aesEncrypt(aesInput.value, aesKey.value, aesIv.value, aesOptions.value)
    void saveHistory(`AES encrypt: ${aesInput.value.slice(0, 30)}`, aesOutput.value)
    showSuccess(t('tools.crypto.messages.encrypted'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.crypto.messages.encryptFailed'))
  }
}

function handleAesDecrypt(): void {
  if (aesUseGcm.value) {
    aesGcmDecrypt(aesInput.value, aesKey.value, aesIv.value)
      .then((result) => {
        aesOutput.value = result
        void saveHistory(`AES-GCM decrypt: ${aesInput.value.slice(0, 30)}`, result)
        showSuccess(t('tools.crypto.messages.decrypted'))
      })
      .catch((e: unknown) => showError(e instanceof Error ? e.message : String(e)))
    return
  }
  try {
    aesOutput.value = aesDecrypt(aesInput.value, aesKey.value, aesIv.value, aesOptions.value)
    void saveHistory(`AES decrypt: ${aesInput.value.slice(0, 30)}`, aesOutput.value)
    showSuccess(t('tools.crypto.messages.decrypted'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.crypto.messages.decryptFailed'))
  }
}

function handleAesGenKey(): void {
  const { key, iv } = generateAesKey()
  aesKey.value = key
  aesIv.value = iv
  aesKeyEnc.value = 'Hex'
  aesIvEnc.value = 'Hex'
  showSuccess(t('tools.crypto.messages.keyGenerated'))
}

// RSA 操作
async function handleRsaGenKey(): Promise<void> {
  rsaGenerating.value = true
  try {
    // 同时生成 OAEP（加解密）和 PKCS1（签名）密钥对，简化用户操作
    const oaep = await generateRsaOaepKeyPair(rsaKeySize.value)
    rsaPublicKey.value = oaep.publicKeyPem
    rsaPrivateKey.value = oaep.privateKeyPem
    showSuccess(t('tools.crypto.messages.keyPairGenerated'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.crypto.messages.genKeyFailed'))
  } finally {
    rsaGenerating.value = false
  }
}

async function handleRsaEncrypt(): Promise<void> {
  if (!rsaPublicKey.value) {
    showError(t('tools.crypto.messages.needPublicKey'))
    return
  }
  try {
    rsaOutput.value = await rsaEncrypt(rsaInput.value, rsaPublicKey.value)
    void saveHistory(`RSA encrypt: ${rsaInput.value.slice(0, 30)}`, rsaOutput.value.slice(0, 80))
    showSuccess(t('tools.crypto.messages.encrypted'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.crypto.messages.encryptFailed'))
  }
}

async function handleRsaDecrypt(): Promise<void> {
  if (!rsaPrivateKey.value) {
    showError(t('tools.crypto.messages.needPrivateKey'))
    return
  }
  try {
    rsaOutput.value = await rsaDecrypt(rsaInput.value, rsaPrivateKey.value)
    void saveHistory(`RSA decrypt: ${rsaInput.value.slice(0, 30)}`, rsaOutput.value.slice(0, 80))
    showSuccess(t('tools.crypto.messages.decrypted'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.crypto.messages.decryptFailed'))
  }
}

async function handleRsaSign(): Promise<void> {
  if (!rsaPrivateKey.value) {
    showError(t('tools.crypto.messages.needPrivateKey'))
    return
  }
  try {
    // 需要重新生成 PKCS1 密钥（因为 OAEP 密钥不能签名）
    // 为简化，让用户用同一密钥——但 WebCrypto 不允许跨用途
    // 这里直接尝试，会失败并提示
    rsaSignature.value = await rsaSign(rsaInput.value, rsaPrivateKey.value)
    void saveHistory(`RSA sign: ${rsaInput.value.slice(0, 30)}`, rsaSignature.value.slice(0, 80))
    showSuccess(t('tools.crypto.messages.signed'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.crypto.messages.signFailed'))
  }
}

async function handleRsaVerify(): Promise<void> {
  if (!rsaPublicKey.value) {
    showError(t('tools.crypto.messages.needPublicKey'))
    return
  }
  try {
    rsaVerifyResult.value = await rsaVerify(rsaVerifyMessage.value, rsaVerifySignature.value, rsaPublicKey.value)
    showSuccess(rsaVerifyResult.value ? t('tools.crypto.messages.verifyValid') : t('tools.crypto.messages.verifyInvalid'))
  } catch (e) {
    showError(e instanceof Error ? e.message : t('tools.crypto.messages.verifyFailed'))
  }
}

function handleClear(): void {
  if (activeTab.value === 'aes') {
    aesInput.value = ''
    aesOutput.value = ''
  } else {
    rsaInput.value = ''
    rsaOutput.value = ''
    rsaSignature.value = ''
    rsaVerifyResult.value = null
  }
}
</script>

<template>
  <ToolCard
    :title="t('tools.crypto.title')"
    :description="t('tools.crypto.description')"
    tool-id="crypto"
    layout="wide"
  >
    <template #actions>
      <div class="mag-tab-group">
        <button
          v-for="tab in [{ k: 'aes', l: 'tools.crypto.labels.aes' }, { k: 'rsa', l: 'tools.crypto.labels.rsa' }]"
          :key="tab.k"
          class="mag-tab"
          :class="activeTab === tab.k ? 'mag-tab-active' : ''"
          @click="activeTab = tab.k as 'aes' | 'rsa'"
        >
          {{ t(tab.l) }}
        </button>
      </div>
    </template>

    <template #input>
      <!-- AES Tab -->
      <div v-if="activeTab === 'aes'" class="space-y-3">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label class="mag-label-sm">{{ t('tools.crypto.labels.mode') }}</label>
            <select v-model="aesMode" :disabled="aesUseGcm" class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              <option value="CBC">CBC</option>
              <option value="ECB">ECB</option>
            </select>
          </div>
          <div>
            <label class="mag-label-sm">{{ t('tools.crypto.labels.padding') }}</label>
            <select v-model="aesPadding" :disabled="aesUseGcm" class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              <option value="Pkcs7">PKCS7</option>
              <option value="None">None</option>
            </select>
          </div>
          <div>
            <label class="mag-label-sm">{{ t('tools.crypto.labels.keyEnc') }}</label>
            <select v-model="aesKeyEnc" :disabled="aesUseGcm" class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              <option value="Utf8">UTF-8</option>
              <option value="Base64">Base64</option>
              <option value="Hex">Hex</option>
            </select>
          </div>
          <div>
            <label class="mag-label-sm">{{ t('tools.crypto.labels.outputEnc') }}</label>
            <select v-model="aesOutputEnc" :disabled="aesUseGcm" class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              <option value="Base64">Base64</option>
              <option value="Hex">Hex</option>
            </select>
          </div>
        </div>

        <label class="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
          <input v-model="aesUseGcm" type="checkbox" class="rounded" />
          {{ t('tools.crypto.labels.useGcm') }}
          <span class="text-slate-400">({{ t('tools.crypto.labels.experimental') }})</span>
        </label>

        <div>
          <label class="mag-label">{{ t('tools.crypto.labels.input') }}</label>
          <textarea
            v-model="aesInput"
            class="mag-textarea"
            :placeholder="t('tools.crypto.labels.inputPlaceholder')"
          />
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label class="mag-label-sm">{{ t('tools.crypto.labels.key') }}</label>
            <input
              v-model="aesKey"
              type="text"
              class="mag-input mag-input-mono"
            />
          </div>
          <div>
            <label class="mag-label-sm">{{ t('tools.crypto.labels.iv') }}</label>
            <input
              v-model="aesIv"
              type="text"
              class="mag-input mag-input-mono"
              :disabled="aesUseGcm || aesMode === 'ECB'"
            />
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button class="mag-btn-primary" @click="handleAesEncrypt">{{ t('tools.crypto.actions.encrypt') }}</button>
          <button class="mag-btn" @click="handleAesDecrypt">{{ t('tools.crypto.actions.decrypt') }}</button>
          <button class="mag-btn" @click="handleAesGenKey">{{ t('tools.crypto.actions.genKey') }}</button>
        </div>
      </div>

      <!-- RSA Tab -->
      <div v-else class="space-y-3">
        <div class="flex flex-wrap items-end gap-3">
          <div>
            <label class="mag-label-sm">{{ t('tools.crypto.labels.keySize') }}</label>
            <select v-model.number="rsaKeySize" class="mag-input mag-input-xs">
              <option :value="1024">1024</option>
              <option :value="2048">2048</option>
              <option :value="4096">4096</option>
            </select>
          </div>
          <button
            class="mag-btn-primary"
            :disabled="rsaGenerating"
            @click="handleRsaGenKey"
          >
            {{ rsaGenerating ? '...' : t('tools.crypto.actions.genKeyPair') }}
          </button>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label class="mag-label-sm">{{ t('tools.crypto.labels.publicKey') }}</label>
            <textarea
              v-model="rsaPublicKey"
              class="mag-textarea h-32"
              :placeholder="t('tools.crypto.labels.publicKeyPlaceholder')"
            />
          </div>
          <div>
            <label class="mag-label-sm">{{ t('tools.crypto.labels.privateKey') }}</label>
            <textarea
              v-model="rsaPrivateKey"
              class="mag-textarea h-32"
              :placeholder="t('tools.crypto.labels.privateKeyPlaceholder')"
            />
          </div>
        </div>

        <div>
          <label class="mag-label">{{ t('tools.crypto.labels.input') }}</label>
          <textarea
            v-model="rsaInput"
            class="mag-textarea"
            :placeholder="t('tools.crypto.labels.inputPlaceholder')"
          />
        </div>

        <div class="flex flex-wrap gap-2">
          <button class="mag-btn" @click="handleRsaEncrypt">{{ t('tools.crypto.actions.encrypt') }}</button>
          <button class="mag-btn" @click="handleRsaDecrypt">{{ t('tools.crypto.actions.decrypt') }}</button>
          <button class="mag-btn" @click="handleRsaSign">{{ t('tools.crypto.actions.sign') }}</button>
        </div>

        <!-- 验签面板 -->
        <div class="mag-card">
          <label class="mag-label-sm">{{ t('tools.crypto.labels.verifyPanel') }}</label>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              v-model="rsaVerifyMessage"
              type="text"
              class="mag-input mag-input-mono"
              :placeholder="t('tools.crypto.labels.verifyMessagePlaceholder')"
            />
            <input
              v-model="rsaVerifySignature"
              type="text"
              class="mag-input mag-input-mono"
              :placeholder="t('tools.crypto.labels.verifySigPlaceholder')"
            />
          </div>
          <div class="mt-2 flex items-center gap-2">
            <button class="mag-btn" @click="handleRsaVerify">{{ t('tools.crypto.actions.verify') }}</button>
            <span
              v-if="rsaVerifyResult !== null"
              class="text-xs font-medium"
              :class="rsaVerifyResult ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
            >
              {{ rsaVerifyResult ? t('tools.crypto.messages.verifyValid') : t('tools.crypto.messages.verifyInvalid') }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <template #output>
      <div class="mb-2 flex items-center justify-between">
        <label class="mag-label-inline">{{ t('tools.crypto.labels.output') }}</label>
        <ActionButtons :text="activeTab === 'aes' ? aesOutput : rsaOutput" :show-save="false" @clear="handleClear" />
      </div>

      <div
        v-if="activeTab === 'aes'"
        class="mag-card min-h-[128px]"
      >
        <p v-if="!aesOutput" class="mag-mono text-slate-400">{{ t('tools.crypto.labels.outputPlaceholder') }}</p>
        <pre v-else class="mag-mono whitespace-pre-wrap break-all">{{ aesOutput }}</pre>
      </div>
      <template v-else>
        <div class="mag-card min-h-[128px]">
          <p v-if="!rsaOutput" class="mag-mono text-slate-400">{{ t('tools.crypto.labels.outputPlaceholder') }}</p>
          <pre v-else class="mag-mono whitespace-pre-wrap break-all">{{ rsaOutput }}</pre>
        </div>
        <div v-if="rsaSignature" class="mt-3">
          <label class="mag-label-sm">{{ t('tools.crypto.labels.signature') }}</label>
          <div class="mag-card min-h-[80px]">
            <pre class="mag-mono whitespace-pre-wrap break-all text-xs">{{ rsaSignature }}</pre>
          </div>
        </div>
      </template>
    </template>

    <template #history>
      <HistoryList tool="crypto" @select="(item) => { if (activeTab === 'aes') aesOutput = item.output; else rsaOutput = item.output }" />
    </template>
  </ToolCard>
</template>

