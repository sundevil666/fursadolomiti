<script setup lang="ts">
defineProps<{ id: string; message?: string }>()
</script>

<template>
  <span class="ski-rental-error" aria-live="polite">
    <Transition name="booking-error">
      <span v-if="message" :id="id" class="booking-modal__field-error">
        <q-icon name="error_outline" aria-hidden="true" />
        {{ message }}
      </span>
    </Transition>
  </span>
</template>

<style scoped>
.ski-rental-error {
  display: grid;
  min-height: 16px;
  margin-top: 3px;
}

.ski-rental-error > span {
  grid-area: 1 / 1;
}
</style>
