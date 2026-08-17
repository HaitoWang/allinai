<template>
  <ImmersiveAuthLayout>
    <div class="codium-login-content">
      <div class="codium-login-heading">
        <h2>{{ t('auth.welcomeBack') }}</h2>
        <p>{{ t('auth.signInToAccount') }}</p>
      </div>

      <form class="codium-auth-form" @submit.prevent="handleLogin">
        <label class="codium-field" for="email">
          <span>{{ t('auth.emailLabel') }}</span>
          <span class="codium-input-shell" :class="{ 'has-error': errors.email }">
            <Icon name="mail" size="sm" />
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              autofocus
              autocomplete="email"
              :disabled="credentialFieldsDisabled"
              :placeholder="t('auth.emailPlaceholder')"
            />
          </span>
        </label>

        <label class="codium-field" for="password">
          <span class="codium-field-heading">
            <span>{{ t('auth.passwordLabel') }}</span>
            <router-link
              v-if="passwordResetEnabled && !backendModeEnabled"
              to="/forgot-password"
            >
              {{ t('auth.forgotPassword') }}
            </router-link>
          </span>
          <span class="codium-input-shell" :class="{ 'has-error': errors.password }">
            <Icon name="lock" size="sm" />
            <input
              id="password"
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
              :disabled="credentialFieldsDisabled"
              :placeholder="t('auth.passwordPlaceholder')"
            />
            <button
              type="button"
              class="codium-password-toggle"
              :disabled="credentialFieldsDisabled"
              :aria-label="showPassword ? t('auth.hidePassword') : t('auth.showPassword')"
              @click="showPassword = !showPassword"
            >
              <Icon :name="showPassword ? 'eyeOff' : 'eye'" size="sm" />
            </button>
          </span>
        </label>

        <div v-if="captchaEnabled" class="codium-captcha">
          <TurnstileWidget
            ref="turnstileRef"
            :turnstile-enabled="turnstileEnabled"
            :turnstile-site-key="turnstileSiteKey"
            :tencent-enabled="tencentCaptchaEnabled"
            :tencent-app-id="tencentCaptchaAppId"
            :tencent-region="tencentCaptchaRegion"
            :aliyun-enabled="aliyunCaptchaEnabled"
            :aliyun-scene-id="aliyunCaptchaSceneId"
            :aliyun-prefix="aliyunCaptchaPrefix"
            :aliyun-region="aliyunCaptchaRegion"
            @verify="onTurnstileVerify"
            @expire="onTurnstileExpire"
            @error="onTurnstileError"
          />
        </div>

        <LoginAgreementPrompt
          v-if="loginAgreementEnabled"
          class="codium-agreement"
          :accepted="agreementAccepted"
          :documents="loginAgreementDocuments"
          :mode="loginAgreementMode"
          :updated-at="loginAgreementUpdatedAt"
          :visible="showAgreementModal"
          @accept="acceptLoginAgreement"
          @reject="rejectLoginAgreement"
          @open="showAgreementModal = true"
        />

        <button
          type="submit"
          class="codium-submit"
          :disabled="authActionDisabled || (turnstileEnabled && !turnstileToken)"
        >
          <span>{{ isLoading ? t('auth.signingIn') : t('auth.signIn') }}</span>
          <svg v-if="isLoading" class="codium-spinner" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" />
            <path fill="currentColor" d="M21 12a9 9 0 00-9-9v3a6 6 0 016 6h3z" />
          </svg>
          <Icon v-else name="arrowRight" size="sm" />
        </button>

        <div v-if="showPasskeyLogin || showOAuthLogin" class="codium-alternatives">
          <div class="codium-divider">
            <span></span>
            <small>{{ t('auth.oauthOrContinue') }}</small>
            <span></span>
          </div>

          <button
            v-if="showPasskeyLogin"
            type="button"
            class="codium-secondary-button btn-secondary w-full"
            :disabled="authActionDisabled"
            @click="handlePasskeyLogin"
          >
            <Icon name="key" size="sm" />
            {{ passkeyLoading ? t('auth.passkeySigningIn') : t('auth.passkeySignIn') }}
          </button>

          <div class="codium-oauth-providers">
            <EmailOAuthButtons
              :disabled="authActionDisabled"
              :github-enabled="githubOAuthEnabled"
              :google-enabled="googleOAuthEnabled"
              :show-divider="false"
              @start="handleOAuthStart"
            />
            <LinuxDoOAuthSection
              v-if="linuxdoOAuthEnabled"
              :disabled="authActionDisabled"
              :show-divider="false"
              @start="handleOAuthStart"
            />
            <DingTalkOAuthSection
              v-if="dingtalkOAuthEnabled"
              :disabled="authActionDisabled"
              :show-divider="false"
              @start="handleOAuthStart"
            />
            <WechatOAuthSection
              v-if="wechatOAuthEnabled"
              :disabled="authActionDisabled"
              :show-divider="false"
              @start="handleOAuthStart"
            />
            <OidcOAuthSection
              v-if="oidcOAuthEnabled"
              :disabled="authActionDisabled"
              :provider-name="oidcOAuthProviderName"
              :show-divider="false"
              @start="handleOAuthStart"
            />
          </div>
        </div>
      </form>
    </div>

    <template v-if="!backendModeEnabled" #footer>
      <p>
        {{ t('auth.dontHaveAccount') }}
        <router-link to="/register">{{ t('auth.signUp') }}</router-link>
      </p>
    </template>
  </ImmersiveAuthLayout>

  <!-- 2FA Modal -->
  <TotpLoginModal
    v-if="show2FAModal"
    ref="totpModalRef"
    :temp-token="totpTempToken"
    :user-email-masked="totpUserEmailMasked"
    @verify="handle2FAVerify"
    @cancel="handle2FACancel"
  />
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ImmersiveAuthLayout } from '@/components/layout'
import LinuxDoOAuthSection from '@/components/auth/LinuxDoOAuthSection.vue'
import DingTalkOAuthSection from '@/components/auth/DingTalkOAuthSection.vue'
import OidcOAuthSection from '@/components/auth/OidcOAuthSection.vue'
import WechatOAuthSection from '@/components/auth/WechatOAuthSection.vue'
import EmailOAuthButtons from '@/components/auth/EmailOAuthButtons.vue'
import LoginAgreementPrompt from '@/components/auth/LoginAgreementPrompt.vue'
import TotpLoginModal from '@/components/auth/TotpLoginModal.vue'
import Icon from '@/components/icons/Icon.vue'
import TurnstileWidget from '@/components/CaptchaChallenge.vue'
import { useAuthStore, useAppStore } from '@/stores'
import {
  buildOAuthLoginStartURL,
  getPublicSettings,
  isTotp2FARequired,
  isWeChatWebOAuthEnabled,
  startOAuthLogin,
  type OAuthLoginStart
} from '@/api/auth'
import type {
  ActionCaptchaRequestProof,
  LoginAgreementDocument,
  TotpLoginResponse
} from '@/types'
import { extractI18nErrorMessage } from '@/utils/apiError'
import { clearAllAffiliateReferralCodes } from '@/utils/oauthAffiliate'

const { t } = useI18n()
const LOGIN_AGREEMENT_STORAGE_KEY = 'sub2api_login_agreement_consent'

// ==================== Router & Stores ====================

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// ==================== State ====================

const isLoading = ref<boolean>(false)
const passkeyLoading = ref<boolean>(false)
const errorMessage = ref<string>('')
const showPassword = ref<boolean>(false)
const publicSettingsLoaded = ref<boolean>(false)

// Public settings
const turnstileEnabled = ref<boolean>(false)
const turnstileSiteKey = ref<string>('')
const tencentCaptchaEnabled = ref<boolean>(false)
const tencentCaptchaAppId = ref<string>('')
const tencentCaptchaRegion = ref<string>('cn')
const aliyunCaptchaEnabled = ref<boolean>(false)
const aliyunCaptchaSceneId = ref<string>('')
const aliyunCaptchaPrefix = ref<string>('')
const aliyunCaptchaRegion = ref<string>('cn')
const linuxdoOAuthEnabled = ref<boolean>(false)
const dingtalkOAuthEnabled = ref<boolean>(false)
const wechatOAuthEnabled = ref<boolean>(false)
const backendModeEnabled = ref<boolean>(false)
const oidcOAuthEnabled = ref<boolean>(false)
const oidcOAuthProviderName = ref<string>('OIDC')
const githubOAuthEnabled = ref<boolean>(false)
const googleOAuthEnabled = ref<boolean>(false)
const passwordResetEnabled = ref<boolean>(false)
const passkeyEnabled = ref<boolean>(false)
const loginAgreementEnabled = ref<boolean>(false)
const loginAgreementMode = ref<'modal' | 'checkbox' | string>('modal')
const loginAgreementUpdatedAt = ref<string>('')
const loginAgreementRevision = ref<string>('')
const loginAgreementDocuments = ref<LoginAgreementDocument[]>([])
const agreementAccepted = ref<boolean>(false)
const showAgreementModal = ref<boolean>(false)

// Turnstile
const turnstileRef = ref<InstanceType<typeof TurnstileWidget> | null>(null)
const turnstileToken = ref<string>('')
const tencentCaptchaRandstr = ref<string>('')
const aliyunCaptchaReady = computed(
  () =>
    aliyunCaptchaEnabled.value &&
    Boolean(aliyunCaptchaSceneId.value) &&
    Boolean(aliyunCaptchaPrefix.value)
)
// 动作触发式验证码（腾讯/阿里云）：提交、OAuth 启动、passkey 时弹窗验证
const actionCaptchaEnabled = computed(
  () =>
    (tencentCaptchaEnabled.value && Boolean(tencentCaptchaAppId.value)) ||
    aliyunCaptchaReady.value
)
const captchaEnabled = computed(
  () =>
    (turnstileEnabled.value && Boolean(turnstileSiteKey.value)) || actionCaptchaEnabled.value
)

// 2FA state
const show2FAModal = ref<boolean>(false)
const totpTempToken = ref<string>('')
const totpUserEmailMasked = ref<string>('')
const totpModalRef = ref<InstanceType<typeof TotpLoginModal> | null>(null)

const formData = reactive({
  email: '',
  password: ''
})

const errors = reactive({
  email: '',
  password: '',
  turnstile: ''
})

const validationToastMessage = computed(
  () => errors.email || errors.password || errors.turnstile || ''
)

const agreementGateActive = computed(
  () => loginAgreementEnabled.value && !agreementAccepted.value
)

const authActionDisabled = computed(
  () => isLoading.value || passkeyLoading.value || !publicSettingsLoaded.value || agreementGateActive.value
)

const credentialFieldsDisabled = computed(
  () =>
    isLoading.value ||
    passkeyLoading.value ||
    !publicSettingsLoaded.value ||
    (agreementGateActive.value && loginAgreementMode.value !== 'checkbox')
)

const showPasskeyLogin = computed(
  () => passkeyEnabled.value && typeof window.PublicKeyCredential !== 'undefined'
)

const showOAuthLogin = computed(
  () =>
    !backendModeEnabled.value &&
    (linuxdoOAuthEnabled.value ||
      dingtalkOAuthEnabled.value ||
      wechatOAuthEnabled.value ||
      oidcOAuthEnabled.value ||
      githubOAuthEnabled.value ||
      googleOAuthEnabled.value)
)

watch(validationToastMessage, (value, previousValue) => {
  if (value && value !== previousValue) {
    appStore.showError(value)
  }
})

// ==================== Lifecycle ====================

onMounted(async () => {
  const expiredFlag = sessionStorage.getItem('auth_expired')
  if (expiredFlag) {
    sessionStorage.removeItem('auth_expired')
    const message = t('auth.reloginRequired')
    errorMessage.value = message
    appStore.showWarning(message)
  }

  try {
    const settings = await getPublicSettings()
    turnstileEnabled.value = settings.turnstile_enabled
    turnstileSiteKey.value = settings.turnstile_site_key || ''
    tencentCaptchaEnabled.value = settings.tencent_captcha_enabled === true
    tencentCaptchaAppId.value = settings.tencent_captcha_app_id || ''
    tencentCaptchaRegion.value = settings.tencent_captcha_region || 'cn'
    aliyunCaptchaEnabled.value = settings.aliyun_captcha_enabled === true
    aliyunCaptchaSceneId.value = settings.aliyun_captcha_scene_id || ''
    aliyunCaptchaPrefix.value = settings.aliyun_captcha_prefix || ''
    aliyunCaptchaRegion.value = settings.aliyun_captcha_region || 'cn'
    linuxdoOAuthEnabled.value = settings.linuxdo_oauth_enabled
    dingtalkOAuthEnabled.value = settings.dingtalk_oauth_enabled ?? false
    wechatOAuthEnabled.value = isWeChatWebOAuthEnabled(settings)
    backendModeEnabled.value = settings.backend_mode_enabled
    oidcOAuthEnabled.value = settings.oidc_oauth_enabled
    oidcOAuthProviderName.value = settings.oidc_oauth_provider_name || 'OIDC'
    githubOAuthEnabled.value = settings.github_oauth_enabled
    googleOAuthEnabled.value = settings.google_oauth_enabled
    backendModeEnabled.value = settings.backend_mode_enabled
    passwordResetEnabled.value = settings.password_reset_enabled
    passkeyEnabled.value = settings.passkey_enabled === true
    applyLoginAgreementSettings(settings)
  } catch (error) {
    console.error('Failed to load public settings:', error)
    loginAgreementEnabled.value = false
    agreementAccepted.value = true
  } finally {
    publicSettingsLoaded.value = true
  }
})

// ==================== Login Agreement ====================

function applyLoginAgreementSettings(settings: {
  login_agreement_enabled?: boolean
  login_agreement_mode?: string
  login_agreement_updated_at?: string
  login_agreement_revision?: string
  login_agreement_documents?: LoginAgreementDocument[]
}): void {
  const documents = Array.isArray(settings.login_agreement_documents)
    ? settings.login_agreement_documents.filter((doc) => doc.title?.trim())
    : []
  loginAgreementDocuments.value = documents
  loginAgreementEnabled.value = settings.login_agreement_enabled === true && documents.length > 0
  loginAgreementMode.value = settings.login_agreement_mode === 'checkbox' ? 'checkbox' : 'modal'
  loginAgreementUpdatedAt.value = settings.login_agreement_updated_at || ''
  loginAgreementRevision.value =
    settings.login_agreement_revision ||
    `${loginAgreementUpdatedAt.value}:${documents.map((doc) => `${doc.id}:${doc.title}`).join('|')}`

  agreementAccepted.value = !loginAgreementEnabled.value || hasAcceptedLoginAgreement(loginAgreementRevision.value)
  showAgreementModal.value =
    loginAgreementEnabled.value && !agreementAccepted.value && loginAgreementMode.value !== 'checkbox'
}

function hasAcceptedLoginAgreement(revision: string): boolean {
  if (!revision) {
    return false
  }
  try {
    const raw = localStorage.getItem(LOGIN_AGREEMENT_STORAGE_KEY)
    if (!raw) {
      return false
    }
    const parsed = JSON.parse(raw) as { revision?: string }
    return parsed.revision === revision
  } catch {
    return false
  }
}

function acceptLoginAgreement(): void {
  if (loginAgreementRevision.value) {
    localStorage.setItem(
      LOGIN_AGREEMENT_STORAGE_KEY,
      JSON.stringify({
        revision: loginAgreementRevision.value,
        accepted_at: new Date().toISOString()
      })
    )
  }
  agreementAccepted.value = true
  showAgreementModal.value = false
}

function rejectLoginAgreement(): void {
  localStorage.removeItem(LOGIN_AGREEMENT_STORAGE_KEY)
  agreementAccepted.value = false
  showAgreementModal.value = false
  appStore.showWarning(t('legal.loginAgreementPrompt.loginRejectedWarning'))
}

// ==================== Turnstile Handlers ====================

function onTurnstileVerify(token: string, randstr = ''): void {
  turnstileToken.value = token
  tencentCaptchaRandstr.value = randstr
  errors.turnstile = ''
}

function onTurnstileExpire(): void {
  turnstileToken.value = ''
  tencentCaptchaRandstr.value = ''
  errors.turnstile = t('auth.turnstileExpired')
}

function onTurnstileError(): void {
  turnstileToken.value = ''
  tencentCaptchaRandstr.value = ''
  errors.turnstile = t('auth.turnstileFailed')
}

function resetCaptchaProof(): void {
  turnstileRef.value?.reset()
  turnstileToken.value = ''
  tencentCaptchaRandstr.value = ''
  errors.turnstile = ''
}

async function acquireActionProof(): Promise<boolean> {
  if (!actionCaptchaEnabled.value) return true

  const proof = await turnstileRef.value?.verifyAction()
  if (!proof) return false

  turnstileToken.value = proof.token
  tencentCaptchaRandstr.value = proof.randstr
  return true
}

// ==================== Validation ====================

function validateForm(): boolean {
  // Reset errors
  errors.email = ''
  errors.password = ''
  errors.turnstile = ''

  let isValid = true

  if (agreementGateActive.value) {
    appStore.showWarning(t('legal.loginAgreementPrompt.loginRequiredWarning'))
    if (loginAgreementMode.value !== 'checkbox') {
      showAgreementModal.value = true
    }
    return false
  }

  // Email validation
  if (!formData.email.trim()) {
    errors.email = t('auth.emailRequired')
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = t('auth.invalidEmail')
    isValid = false
  }

  // Password validation
  if (!formData.password) {
    errors.password = t('auth.passwordRequired')
    isValid = false
  } else if (formData.password.length < 6) {
    errors.password = t('auth.passwordMinLength')
    isValid = false
  }

  // Turnstile validation
  if (turnstileEnabled.value && !turnstileToken.value) {
    errors.turnstile = t('auth.completeVerification')
    isValid = false
  }

  return isValid
}

// ==================== Form Handlers ====================

async function handleLogin(): Promise<void> {
  // Clear previous error
  errorMessage.value = ''

  // Validate form
  if (!validateForm()) {
    return
  }

  if (!(await acquireActionProof())) {
    return
  }

  isLoading.value = true

  try {
    // Call auth store login（阿里云 captchaVerifyParam 复用 turnstile_token 字段）
    const response = await authStore.login({
      email: formData.email,
      password: formData.password,
      turnstile_token:
        turnstileEnabled.value || aliyunCaptchaEnabled.value ? turnstileToken.value : undefined,
      tencent_captcha_ticket: tencentCaptchaEnabled.value ? turnstileToken.value : undefined,
      tencent_captcha_randstr: tencentCaptchaEnabled.value
        ? tencentCaptchaRandstr.value
        : undefined
    })

    // Check if 2FA is required
    if (isTotp2FARequired(response)) {
      const totpResponse = response as TotpLoginResponse
      totpTempToken.value = totpResponse.temp_token || ''
      totpUserEmailMasked.value = totpResponse.user_email_masked || ''
      show2FAModal.value = true
      isLoading.value = false
      return
    }

    // Show success toast
    clearAllAffiliateReferralCodes()
    appStore.showSuccess(t('auth.loginSuccess'))

    // Redirect to dashboard or intended route
    const redirectTo = (router.currentRoute.value.query.redirect as string) || '/dashboard'
    await router.push(redirectTo)
  } catch (error: unknown) {
    errorMessage.value = extractI18nErrorMessage(error, t, 'auth.errors', t('auth.loginFailed'))

    // Also show error toast
    appStore.showError(errorMessage.value)
  } finally {
    if (captchaEnabled.value) {
      resetCaptchaProof()
    }
    isLoading.value = false
  }
}

async function handlePasskeyLogin(): Promise<void> {
  if (agreementGateActive.value) {
    appStore.showWarning(t('legal.loginAgreementPrompt.loginRequiredWarning'))
    if (loginAgreementMode.value !== 'checkbox') {
      showAgreementModal.value = true
    }
    return
  }

  passkeyLoading.value = true
  try {
    let proof: ActionCaptchaRequestProof | undefined
    if (actionCaptchaEnabled.value) {
      const result = await turnstileRef.value?.verifyAction()
      if (!result) return
      proof = tencentCaptchaEnabled.value
        ? {
            tencent_captcha_ticket: result.token,
            tencent_captcha_randstr: result.randstr
          }
        : { turnstile_token: result.token }
    }

    await authStore.loginWithPasskey(proof)
    clearAllAffiliateReferralCodes()
    appStore.showSuccess(t('auth.loginSuccess'))
    const redirectTo = (router.currentRoute.value.query.redirect as string) || '/dashboard'
    await router.push(redirectTo)
  } catch (error: unknown) {
    const fallback = error instanceof DOMException && error.name === 'NotAllowedError'
      ? t('auth.passkeyCancelled')
      : t('auth.passkeyFailed')
    errorMessage.value = extractI18nErrorMessage(error, t, 'auth.errors', fallback)
    appStore.showError(errorMessage.value)
  } finally {
    if (actionCaptchaEnabled.value) {
      resetCaptchaProof()
    }
    passkeyLoading.value = false
  }
}

async function handleOAuthStart(request: OAuthLoginStart): Promise<void> {
  if (authActionDisabled.value) return

  if (!actionCaptchaEnabled.value) {
    window.location.href = buildOAuthLoginStartURL(request)
    return
  }

  isLoading.value = true
  try {
    const proof = await turnstileRef.value?.verifyAction()
    if (!proof) return

    const result = await startOAuthLogin(
      request,
      tencentCaptchaEnabled.value
        ? {
            tencent_captcha_ticket: proof.token,
            tencent_captcha_randstr: proof.randstr
          }
        : { turnstile_token: proof.token }
    )
    window.location.href = result.authorize_url
  } catch (error: unknown) {
    errorMessage.value = extractI18nErrorMessage(
      error,
      t,
      'auth.errors',
      t('auth.turnstileFailed')
    )
    appStore.showError(errorMessage.value)
  } finally {
    resetCaptchaProof()
    isLoading.value = false
  }
}

// ==================== 2FA Handlers ====================

async function handle2FAVerify(code: string): Promise<void> {
  if (totpModalRef.value) {
    totpModalRef.value.setVerifying(true)
  }

  try {
    await authStore.login2FA(totpTempToken.value, code)

    // Close modal and show success
    show2FAModal.value = false
    clearAllAffiliateReferralCodes()
    appStore.showSuccess(t('auth.loginSuccess'))

    // Redirect to dashboard or intended route
    const redirectTo = (router.currentRoute.value.query.redirect as string) || '/dashboard'
    await router.push(redirectTo)
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { data?: { message?: string } } }
    const message = err.response?.data?.message || err.message || t('profile.totp.loginFailed')

    if (totpModalRef.value) {
      totpModalRef.value.setError(message)
      totpModalRef.value.setVerifying(false)
    }
  }
}

function handle2FACancel(): void {
  show2FAModal.value = false
  totpTempToken.value = ''
  totpUserEmailMasked.value = ''
}
</script>

<style scoped>
.codium-login-content {
  width: 100%;
}

.codium-login-heading h2 {
  margin: 0;
  color: var(--auth-text);
  font-size: 2.55rem;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.08;
}

.codium-login-heading p {
  margin: 0.65rem 0 0;
  color: var(--auth-muted);
  font-size: 0.95rem;
}

.codium-auth-form {
  display: grid;
  gap: 1rem;
  margin-top: 2rem;
}

.codium-field {
  display: grid;
  gap: 0.55rem;
  color: var(--auth-label);
  font-size: 0.82rem;
  font-weight: 650;
}

.codium-field-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.codium-field-heading a {
  color: var(--auth-link);
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s ease;
}

.codium-field-heading a:hover {
  color: #ff6b8f;
}

.codium-input-shell {
  display: flex;
  min-height: 3.35rem;
  align-items: center;
  gap: 0.8rem;
  padding: 0 0.95rem;
  color: var(--auth-muted);
  background: var(--auth-control-bg);
  border: 1px solid var(--auth-border);
  border-radius: 8px;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.codium-input-shell:focus-within {
  background: var(--auth-control-bg-active);
  border-color: var(--auth-border-strong);
}

.codium-input-shell.has-error {
  border-color: rgba(255, 81, 119, 0.72);
}

.codium-input-shell input {
  width: 100%;
  min-width: 0;
  height: 3.2rem;
  padding: 0;
  color: var(--auth-input-text);
  caret-color: var(--auth-input-text);
  background: transparent;
  border: 0;
  outline: 0;
}

.codium-input-shell input::placeholder {
  color: var(--auth-input-placeholder);
}

.codium-input-shell input:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.codium-input-shell input:-webkit-autofill,
.codium-input-shell input:-webkit-autofill:hover,
.codium-input-shell input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--auth-input-text);
  caret-color: var(--auth-input-text);
  transition: background-color 9999s ease-in-out 0s;
  box-shadow: 0 0 0 1000px var(--auth-autofill-bg) inset;
}

.codium-password-toggle {
  display: grid;
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  place-items: center;
  color: var(--auth-link);
  background: transparent;
  border: 0;
  border-radius: 6px;
  transition: color 0.2s ease, background 0.2s ease;
}

.codium-password-toggle:hover {
  color: var(--auth-text);
  background: var(--auth-hover-bg);
}

.codium-captcha {
  overflow: hidden;
  border-radius: 8px;
}

.codium-submit,
.codium-secondary-button {
  display: inline-flex;
  width: 100%;
  min-height: 3.35rem;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 750;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.codium-submit {
  min-height: 3.65rem;
  color: #fff;
  background: linear-gradient(135deg, #ff4f79 0%, #ef3f68 56%, #e82f5b 100%);
  border: 0;
  border-radius: 999px;
  box-shadow: 0 1rem 2.4rem rgba(239, 63, 104, 0.26), 0 0 1.8rem rgba(239, 63, 104, 0.12);
  font-size: 1rem;
  font-weight: 800;
}

.codium-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff6389 0%, #f54870 56%, #ef3f68 100%);
  box-shadow: 0 1.15rem 2.8rem rgba(239, 63, 104, 0.32), 0 0 2rem rgba(239, 63, 104, 0.16);
  transform: translateY(-1px);
}

.codium-submit:disabled {
  cursor: not-allowed;
  color: rgba(255, 255, 255, 0.58);
  background: rgba(239, 63, 104, 0.3);
  border: 0;
  box-shadow: 0 0.75rem 1.8rem rgba(239, 63, 104, 0.1);
}

.codium-secondary-button:disabled {
  cursor: not-allowed;
  color: var(--auth-disabled-text);
  background: var(--auth-disabled-bg);
  border-color: var(--auth-border);
  box-shadow: none;
}

.codium-spinner {
  width: 1rem;
  height: 1rem;
  animation: spin 0.8s linear infinite;
}

.codium-spinner circle {
  opacity: 0.25;
}

.codium-alternatives {
  display: grid;
  gap: 0.85rem;
  margin-top: 0.1rem;
}

.codium-divider {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 0.8rem;
  align-items: center;
}

.codium-divider span {
  height: 1px;
  background: var(--auth-border);
}

.codium-divider small {
  color: var(--auth-subtle);
  font-size: 0.72rem;
}

.codium-secondary-button {
  color: var(--auth-secondary-text);
  background: var(--auth-control-bg);
  border: 1px solid var(--auth-border);
}

.codium-secondary-button:hover:not(:disabled) {
  color: var(--auth-text);
  background: var(--auth-control-bg-active);
  border-color: var(--auth-border-strong);
}

.codium-oauth-providers {
  display: grid;
  gap: 0.75rem;
}

.codium-oauth-providers :deep(.btn-secondary) {
  min-height: 3rem;
  color: var(--auth-secondary-text);
  background: var(--auth-control-bg);
  border-color: var(--auth-border);
  border-radius: 8px;
  box-shadow: none;
}

.codium-oauth-providers :deep(.btn-secondary:hover:not(:disabled)) {
  color: var(--auth-text);
  background: var(--auth-control-bg-active);
  border-color: var(--auth-border-strong);
}

.codium-oauth-providers :deep(.btn-secondary svg) {
  color: currentColor;
}

.codium-agreement :deep(p),
.codium-agreement :deep(label) {
  color: var(--auth-muted) !important;
}

.codium-agreement :deep(a) {
  color: var(--auth-text) !important;
  font-weight: 600;
  text-decoration: none;
}

.codium-agreement :deep(a:hover) {
  color: #ff6b8f !important;
  text-decoration: underline;
}

:deep(.immersive-auth-footer a) {
  margin-left: 0.25rem;
  color: var(--auth-secondary-text);
  font-weight: 650;
  text-decoration: none;
  transition: color 0.2s ease;
}

:deep(.immersive-auth-footer a:hover) {
  color: #ff6b8f;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 620px) {
  .codium-login-heading h2 {
    font-size: 2.1rem;
  }

  .codium-auth-form {
    margin-top: 1.5rem;
  }
}
</style>
