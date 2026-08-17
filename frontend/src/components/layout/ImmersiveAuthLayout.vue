<template>
  <div class="immersive-auth-shell" :class="{ 'is-dark': isDark }">
    <header class="immersive-auth-header">
      <router-link to="/" class="immersive-brand" :aria-label="siteName">
        <span class="immersive-brand-mark">
          <img :src="siteLogo || defaultLogo" alt="" />
        </span>
        <strong>{{ siteName }}</strong>
      </router-link>

      <div class="immersive-auth-actions">
        <button
          type="button"
          class="immersive-theme-toggle"
          :title="isDark ? t('home.switchToLight') : t('home.switchToDark')"
          :aria-label="isDark ? t('home.switchToLight') : t('home.switchToDark')"
          @click="toggleTheme"
        >
          <Icon :name="isDark ? 'sun' : 'moon'" size="md" />
        </button>
        <LocaleSwitcher />
      </div>
    </header>

    <main class="immersive-auth-main">
      <section class="immersive-auth-form-pane">
        <div class="immersive-auth-form-wrap">
          <slot />
          <div v-if="$slots.footer" class="immersive-auth-footer">
            <slot name="footer" />
          </div>
        </div>
      </section>

      <section class="immersive-auth-visual" aria-hidden="true">
        <AuthRobotScene :dark="isDark" />
      </section>
    </main>

    <p class="immersive-auth-caption">{{ siteSubtitle }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import Icon from '@/components/icons/Icon.vue'
import { useAppStore } from '@/stores'
import { sanitizeUrl } from '@/utils/url'
import AuthRobotScene from './AuthRobotScene.vue'

const appStore = useAppStore()
const { t } = useI18n()
const isDark = ref(
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
)

const siteName = computed(() => appStore.siteName || 'allinai')
const siteLogo = computed(() =>
  sanitizeUrl(appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true })
)
const defaultLogo = computed(() =>
  isDark.value ? '/brand/allinai-logo-dark.png' : '/brand/allinai-logo-light.png'
)
const siteSubtitle = computed(
  () =>
    appStore.cachedPublicSettings?.site_subtitle ||
    'AI infrastructure, unified.'
)

function toggleTheme(): void {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => appStore.fetchPublicSettings?.())
</script>

<style scoped>
.immersive-auth-shell {
  --auth-bg: #f3f4f6;
  --auth-text: #17191d;
  --auth-muted: #68707b;
  --auth-subtle: #8a919c;
  --auth-label: #4f5661;
  --auth-link: #727985;
  --auth-input-text: #17191d;
  --auth-input-placeholder: rgba(23, 25, 29, 0.34);
  --auth-secondary-text: #59616d;
  --auth-autofill-bg: #f7f8fa;
  --auth-border: rgba(23, 25, 29, 0.14);
  --auth-border-strong: rgba(23, 25, 29, 0.34);
  --auth-control-bg: rgba(255, 255, 255, 0.7);
  --auth-control-bg-active: rgba(255, 255, 255, 0.94);
  --auth-hover-bg: rgba(23, 25, 29, 0.055);
  --auth-disabled-bg: rgba(23, 25, 29, 0.055);
  --auth-disabled-text: rgba(23, 25, 29, 0.34);
  --auth-overlay: linear-gradient(90deg, #f3f4f6 0%, rgba(243, 244, 246, 0.97) 35%, rgba(243, 244, 246, 0.52) 57%, rgba(243, 244, 246, 0.06) 78%);
  --auth-sheen: linear-gradient(180deg, rgba(255, 255, 255, 0.22), transparent 32%);
  --auth-visual-fade: linear-gradient(180deg, transparent, rgba(225, 228, 233, 0.7));
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  color: var(--auth-text);
  background: var(--auth-bg);
  isolation: isolate;
  transition: color 0.25s ease, background-color 0.25s ease;
}

.immersive-auth-shell.is-dark {
  --auth-bg: #0f1012;
  --auth-text: #f6f7f8;
  --auth-muted: rgba(246, 247, 248, 0.52);
  --auth-subtle: rgba(255, 255, 255, 0.34);
  --auth-label: rgba(255, 255, 255, 0.72);
  --auth-link: rgba(255, 255, 255, 0.48);
  --auth-input-text: #fff;
  --auth-input-placeholder: rgba(255, 255, 255, 0.28);
  --auth-secondary-text: rgba(255, 255, 255, 0.68);
  --auth-autofill-bg: #101113;
  --auth-border: rgba(255, 255, 255, 0.16);
  --auth-border-strong: rgba(255, 255, 255, 0.42);
  --auth-control-bg: rgba(5, 6, 7, 0.18);
  --auth-control-bg-active: rgba(5, 6, 7, 0.32);
  --auth-hover-bg: rgba(255, 255, 255, 0.06);
  --auth-disabled-bg: rgba(255, 255, 255, 0.055);
  --auth-disabled-text: rgba(255, 255, 255, 0.3);
  --auth-overlay: linear-gradient(90deg, rgba(15, 16, 18, 1) 0%, rgba(15, 16, 18, 0.97) 35%, rgba(15, 16, 18, 0.48) 57%, rgba(15, 16, 18, 0.05) 78%);
  --auth-sheen: linear-gradient(180deg, rgba(255, 255, 255, 0.018), transparent 32%);
  --auth-visual-fade: linear-gradient(180deg, transparent, rgba(5, 6, 7, 0.66));
}

.immersive-auth-shell::before {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  content: '';
  background: var(--auth-overlay), var(--auth-sheen);
  transition: background 0.25s ease;
}

.immersive-auth-header {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 2rem clamp(1.25rem, 3vw, 3rem);
}

.immersive-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  color: var(--auth-text);
  text-decoration: none;
}

.immersive-auth-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.immersive-theme-toggle {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  color: var(--auth-muted);
  background: transparent;
  border: 0;
  border-radius: 8px;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.immersive-theme-toggle:hover {
  color: var(--auth-text);
  background: var(--auth-hover-bg);
}

.immersive-brand-mark {
  display: grid;
  width: 3.35rem;
  height: 3.35rem;
  place-items: center;
  overflow: hidden;
  border-radius: 1rem;
}

.immersive-brand-mark img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.immersive-brand strong {
  max-width: min(18rem, 40vw);
  overflow: hidden;
  font-size: 1.15rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.immersive-auth-main {
  position: relative;
  display: grid;
  grid-template-columns: minmax(31rem, 44%) minmax(0, 56%);
  min-height: 100vh;
  min-height: 100dvh;
}

.immersive-auth-form-pane {
  position: relative;
  z-index: 4;
  display: flex;
  align-items: center;
  padding: 8rem 2rem 4rem clamp(2rem, 7vw, 5.6rem);
}

.immersive-auth-form-wrap {
  width: min(100%, 29.25rem);
}

.immersive-auth-visual {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.immersive-auth-visual::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 24%;
  pointer-events: none;
  content: '';
  background: var(--auth-visual-fade);
}

.immersive-auth-footer {
  margin-top: 1.15rem;
  color: var(--auth-muted);
  font-size: 0.875rem;
  text-align: center;
}

.immersive-auth-caption {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  z-index: 6;
  max-width: 24rem;
  overflow: hidden;
  color: var(--auth-subtle);
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  transform: translateX(-50%);
}

@media (max-width: 980px) {
  .immersive-auth-shell {
    overflow-y: auto;
  }

  .immersive-auth-shell::before {
    background: var(--auth-bg);
    opacity: 0.94;
  }

  .immersive-auth-main {
    display: block;
  }

  .immersive-auth-form-pane {
    min-height: 100vh;
    min-height: 100dvh;
    padding: 8.5rem 1.5rem 4.5rem;
  }

  .immersive-auth-form-wrap {
    width: min(100%, 31rem);
    margin: auto;
  }

  .immersive-auth-visual {
    position: fixed;
    inset: 0;
    min-height: 100vh;
    opacity: 0.14;
    pointer-events: none;
    transform: translateX(22vw) scale(1.08);
  }
}

@media (max-width: 620px) {
  .immersive-auth-header {
    padding: 1rem;
  }

  .immersive-brand-mark {
    width: 3rem;
    height: 3rem;
    border-radius: 0.8rem;
  }

  .immersive-brand strong {
    max-width: 45vw;
  }

  .immersive-auth-form-pane {
    align-items: flex-start;
    padding: 7.2rem 1.15rem 4rem;
  }

  .immersive-auth-caption {
    display: none;
  }
}
</style>
