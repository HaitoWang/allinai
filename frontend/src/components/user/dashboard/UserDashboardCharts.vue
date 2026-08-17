<template>
  <section class="dashboard-analytics card">
    <div class="dashboard-analytics-toolbar">
      <h2 class="dashboard-section-title">{{ t('dashboard.usageOverview') }}</h2>

      <div class="dashboard-analytics-controls">
        <span class="sr-only">{{ t('dashboard.timeRange') }}</span>
        <DateRangePicker
          :start-date="startDate"
          :end-date="endDate"
          @update:startDate="$emit('update:startDate', $event)"
          @update:endDate="$emit('update:endDate', $event)"
          @change="$emit('dateRangeChange', $event)"
        />
        <div class="w-28">
          <span class="sr-only">{{ t('dashboard.granularity') }}</span>
          <Select
            :model-value="granularity"
            :options="[{value:'day', label:t('dashboard.day')}, {value:'hour', label:t('dashboard.hour')}]"
            @update:model-value="$emit('update:granularity', $event)"
            @change="$emit('granularityChange')"
          />
        </div>
        <button
          type="button"
          class="btn btn-secondary btn-icon"
          :disabled="loading"
          :aria-label="t('common.refresh')"
          :title="t('common.refresh')"
          @click="$emit('refresh')"
        >
          <Icon name="refresh" size="sm" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <div class="dashboard-analytics-grid">
      <div class="dashboard-analytics-panel relative overflow-hidden">
        <div v-if="loading" class="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm dark:bg-dark-800/50">
          <LoadingSpinner size="md" />
        </div>
        <h3 class="dashboard-panel-title">{{ t('dashboard.modelDistribution') }}</h3>
        <div v-if="modelData" class="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
          <div class="h-44 w-44 shrink-0">
            <Doughnut :data="modelData" :options="doughnutOptions" />
          </div>
          <div class="max-h-48 w-full min-w-0 flex-1 overflow-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-gray-500 dark:text-gray-400">
                  <th class="pb-2 text-left">{{ t('dashboard.model') }}</th>
                  <th class="pb-2 text-right">{{ t('dashboard.requests') }}</th>
                  <th class="pb-2 text-right">{{ t('dashboard.tokens') }}</th>
                  <th class="pb-2 text-right">{{ t('dashboard.actual') }}</th>
                  <th class="pb-2 text-right">{{ t('dashboard.standard') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="model in models" :key="model.model" class="border-t border-gray-100 dark:border-dark-700">
                  <td class="max-w-[100px] truncate py-1.5 font-medium text-gray-900 dark:text-white" :title="model.model">{{ model.model }}</td>
                  <td class="py-1.5 text-right text-gray-600 dark:text-gray-400">{{ formatNumber(model.requests) }}</td>
                  <td class="py-1.5 text-right text-gray-600 dark:text-gray-400">{{ formatTokens(model.total_tokens) }}</td>
                  <td class="py-1.5 text-right text-green-600 dark:text-green-400">${{ formatCost(model.actual_cost) }}</td>
                  <td class="py-1.5 text-right text-gray-400 dark:text-gray-500">${{ formatCost(model.cost) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="dashboard-chart-empty">{{ t('dashboard.noDataAvailable') }}</div>
      </div>

      <TokenUsageTrend embedded :trend-data="trend" :loading="loading" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import Select from '@/components/common/Select.vue'
import Icon from '@/components/icons/Icon.vue'
import { Doughnut } from 'vue-chartjs'
import TokenUsageTrend from '@/components/charts/TokenUsageTrend.vue'
import type { TrendDataPoint, ModelStat } from '@/types'
import { formatCostFixed as formatCost, formatNumberLocaleString as formatNumber, formatTokensK as formatTokens } from '@/utils/format'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler)

const props = defineProps<{ loading: boolean, startDate: string, endDate: string, granularity: string, trend: TrendDataPoint[], models: ModelStat[] }>()
defineEmits(['update:startDate', 'update:endDate', 'update:granularity', 'dateRangeChange', 'granularityChange', 'refresh'])
const { t } = useI18n()

const modelData = computed(() => !props.models?.length ? null : {
  labels: props.models.map((m: ModelStat) => m.model),
  datasets: [{
    data: props.models.map((m: ModelStat) => m.total_tokens),
    backgroundColor: ['#ef3f68', '#4f8cff', '#40b892', '#e8b45d', '#a97ad8', '#5fb5c9', '#cf6f5f', '#8da45c'],
    borderWidth: 0,
    hoverOffset: 3
  }]
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context: any) => `${context.label}: ${formatTokens(context.parsed)} tokens`
      }
    }
  }
}
</script>

<style scoped>
.dashboard-analytics {
  overflow: hidden;
}

.dashboard-analytics-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 64px;
  padding: 0.75rem 1rem 0.75rem 1.25rem;
  border-bottom: 1px solid var(--app-border);
}

.dashboard-section-title,
.dashboard-panel-title {
  color: var(--app-text);
  font-size: 0.875rem;
  font-weight: 650;
}

.dashboard-analytics-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dashboard-analytics-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
}

.dashboard-analytics-panel {
  min-width: 0;
  min-height: 268px;
  padding: 1.25rem;
}

.dashboard-analytics-panel + :deep(.dashboard-analytics-panel) {
  border-left: 1px solid var(--app-border);
}

.dashboard-panel-title {
  margin-bottom: 1.25rem;
}

.dashboard-chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 192px;
  color: var(--app-muted);
  font-size: 0.8125rem;
}

@media (max-width: 1023px) {
  .dashboard-analytics-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .dashboard-analytics-panel + :deep(.dashboard-analytics-panel) {
    border-top: 1px solid var(--app-border);
    border-left: 0;
  }
}

@media (max-width: 639px) {
  .dashboard-analytics-toolbar {
    align-items: flex-start;
    flex-direction: column;
    padding: 1rem;
  }

  .dashboard-analytics-controls {
    width: 100%;
    flex-wrap: wrap;
  }

  .dashboard-analytics-controls > :first-of-type {
    flex: 1 1 auto;
  }

  .dashboard-analytics-panel {
    padding: 1rem;
  }
}
</style>
