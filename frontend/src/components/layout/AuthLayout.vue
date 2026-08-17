<template>
  <ImmersiveAuthLayout>
    <slot />
    <template #footer>
      <slot name="footer" />
    </template>
  </ImmersiveAuthLayout>
</template>

<script setup lang="ts">
import ImmersiveAuthLayout from './ImmersiveAuthLayout.vue'
</script>
