<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { sendRequestForm } from '@/services/api/forms'

const props = defineProps<{
  pageId: string
}>()

const { locale, t } = useI18n()

const form = reactive({
  name: '',
  phone: '',
  message: '',
})

const isSending = ref(false)
const status = ref<'idle' | 'success' | 'error'>('idle')

const submitForm = async () => {
  isSending.value = true
  status.value = 'idle'

  try {
    await sendRequestForm({
      ...form,
      page: props.pageId,
      locale: locale.value,
    })

    status.value = 'success'
  } catch {
    status.value = 'error'
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <q-form class="request-form" @submit.prevent="submitForm">
    <h2 class="request-form__title">{{ t('form.title') }}</h2>

    <div class="request-form__grid">
      <q-input v-model="form.name" outlined :label="t('form.name')" />
      <q-input v-model="form.phone" outlined :label="t('form.phone')" />
    </div>

    <q-input v-model="form.message" outlined type="textarea" :label="t('form.message')" />

    <div class="request-form__footer">
      <q-btn type="submit" color="primary" :loading="isSending" :label="t('form.send')" />

      <p v-if="status === 'success'" class="request-form__status request-form__status--success">
        {{ t('form.success') }}
      </p>
      <p v-if="status === 'error'" class="request-form__status request-form__status--error">
        {{ t('form.error') }}
      </p>
    </div>
  </q-form>
</template>
