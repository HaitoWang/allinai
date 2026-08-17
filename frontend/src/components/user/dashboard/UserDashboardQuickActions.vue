<template>
  <div class="card h-full overflow-hidden">
    <div class="flex min-h-[64px] items-center border-b border-gray-100 px-5 py-3 dark:border-dark-700">
      <h2 class="text-sm font-semibold text-gray-900 dark:text-white">{{ t('dashboard.quickActions') }}</h2>
    </div>
    <div class="divide-y divide-gray-100 dark:divide-dark-700">
      <button @click="router.push('/keys')" class="dashboard-action-row group">
        <div class="dashboard-action-icon">
          <Icon name="key" size="sm" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ t('dashboard.createApiKey') }}</p>
          <p class="text-xs text-gray-500 dark:text-dark-400">{{ t('dashboard.generateNewKey') }}</p>
        </div>
        <Icon
          name="chevronRight"
          size="sm"
          class="text-gray-400 transition-colors group-hover:text-gray-700 dark:text-dark-500 dark:group-hover:text-white"
        />
      </button>

      <button @click="router.push('/usage')" class="dashboard-action-row group">
        <div class="dashboard-action-icon">
          <Icon name="chart" size="sm" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ t('dashboard.viewUsage') }}</p>
          <p class="text-xs text-gray-500 dark:text-dark-400">{{ t('dashboard.checkDetailedLogs') }}</p>
        </div>
        <Icon
          name="chevronRight"
          size="sm"
          class="text-gray-400 transition-colors group-hover:text-gray-700 dark:text-dark-500 dark:group-hover:text-white"
        />
      </button>

      <button v-if="canUseBatchImage" @click="router.push('/batch-image')" class="dashboard-action-row group">
        <div class="dashboard-action-icon">
          <Icon name="sparkles" size="sm" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ t('dashboard.batchImageAgent') }}</p>
          <p class="text-xs text-gray-500 dark:text-dark-400">{{ t('dashboard.batchImageAgentDesc') }}</p>
        </div>
        <Icon
          name="chevronRight"
          size="sm"
          class="text-gray-400 transition-colors group-hover:text-gray-700 dark:text-dark-500 dark:group-hover:text-white"
        />
      </button>

      <button @click="router.push('/redeem')" class="dashboard-action-row group">
        <div class="dashboard-action-icon">
          <Icon name="gift" size="sm" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ t('dashboard.redeemCode') }}</p>
          <p class="text-xs text-gray-500 dark:text-dark-400">{{ t('dashboard.addBalanceWithCode') }}</p>
        </div>
        <Icon
          name="chevronRight"
          size="sm"
          class="text-gray-400 transition-colors group-hover:text-gray-700 dark:text-dark-500 dark:group-hover:text-white"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import { useBatchImageAccess } from '@/composables/useBatchImageAccess'
const router = useRouter()
const { t } = useI18n()
const { canUseBatchImage, refreshBatchImageAccess } = useBatchImageAccess()

onMounted(() => {
  void refreshBatchImageAccess()
})
</script>

<style scoped>
.dashboard-action-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 68px;
  padding: 0.75rem 1.25rem;
  text-align: left;
  transition: background-color 150ms ease, color 150ms ease;
}

.dashboard-action-row:hover {
  background: var(--app-surface-raised);
}

.dashboard-action-icon {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  color: var(--app-muted);
  background: var(--app-surface-raised);
}

.dashboard-action-row:hover .dashboard-action-icon {
  color: var(--app-accent);
  border-color: var(--app-border-strong);
}
</style>
