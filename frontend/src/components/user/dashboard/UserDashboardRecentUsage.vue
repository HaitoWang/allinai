<template>
  <div class="card flex h-full flex-col overflow-hidden">
    <div class="flex min-h-[64px] items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-dark-700">
      <h2 class="text-sm font-semibold text-gray-900 dark:text-white">{{ t('dashboard.recentUsage') }}</h2>
      <span class="dashboard-period-badge">{{ t('dashboard.last7Days') }}</span>
    </div>
    <div class="flex flex-1 flex-col">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
      <div v-else-if="data.length === 0" class="flex min-h-[220px] flex-1 flex-col items-center justify-center px-6 text-center">
        <div class="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 dark:border-dark-700 dark:text-dark-400">
          <Icon name="inbox" size="sm" />
        </div>
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">{{ t('dashboard.noUsageRecords') }}</h3>
        <p class="mt-1 max-w-sm text-xs leading-5 text-gray-500 dark:text-dark-400">{{ t('dashboard.startUsingApi') }}</p>
      </div>
      <div v-else class="divide-y divide-gray-100 dark:divide-dark-700">
        <div v-for="log in data" :key="log.id" class="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-dark-800/40">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-500 dark:border-dark-700 dark:text-dark-300">
              <Icon name="beaker" size="sm" />
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ log.model }}</p>
              <p class="text-xs text-gray-500 dark:text-dark-400">{{ formatDateTime(log.created_at) }}</p>
            </div>
          </div>
          <div class="flex-shrink-0 text-right">
            <p class="font-mono text-xs font-semibold">
              <span class="text-gray-900 dark:text-white" :title="t('dashboard.actual')">${{ formatCost(log.actual_cost) }}</span>
              <span class="font-normal text-gray-400 dark:text-gray-500" :title="t('dashboard.standard')"> / ${{ formatCost(log.total_cost) }}</span>
            </p>
            <p class="text-xs text-gray-500 dark:text-dark-400">{{ (log.input_tokens + log.output_tokens).toLocaleString() }} tokens</p>
          </div>
        </div>
      </div>
      <router-link to="/usage" class="mt-auto flex items-center justify-center gap-2 border-t border-gray-100 py-3 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-dark-700 dark:text-dark-300 dark:hover:bg-dark-800/40 dark:hover:text-white">
        {{ t('dashboard.viewAllUsage') }}
        <Icon name="arrowRight" size="xs" />
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Icon from '@/components/icons/Icon.vue'
import { formatDateTime } from '@/utils/format'
import type { UsageLog } from '@/types'

defineProps<{
  data: UsageLog[]
  loading: boolean
}>()
const { t } = useI18n()
const formatCost = (c: number) => c.toFixed(4)
</script>

<style scoped>
.dashboard-period-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 0.5rem;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  color: var(--app-muted);
  background: var(--app-surface-raised);
  font-size: 0.6875rem;
  font-weight: 600;
}
</style>
