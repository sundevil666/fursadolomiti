<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SkiRentalFieldError from './SkiRentalFieldError.vue'

const { t } = useI18n()
const submitted = ref(false)
const locations = ['ortisei', 'santaCristina', 'selva']

const fields = ['firstName', 'email', 'location', 'privacyConsent'] as const
type RentalField = (typeof fields)[number]
type ErrorCode = 'required' | 'email' | 'consent'

const fieldErrors = ref<Partial<Record<RentalField, ErrorCode>>>({})
const submitting = ref(false)
const submitFailed = ref(false)
const localPreview = import.meta.env.DEV
const rentalEndpoint = localPreview
  ? '/api/validate-ski-rental'
  : import.meta.env.VITE_BOOKING_EMAIL_ENDPOINT ||
    (__SKI_RENTAL_VERCEL__ || window.location.hostname.endsWith('.vercel.app')
      ? '/api/send-email'
      : '/php/send-email.php')

const fieldMessage = (field: RentalField) => {
  const code = fieldErrors.value[field]
  if (!code) return undefined
  if (field === 'location') return t('skiRental.location')
  return t(`home.hotels.bookingModal.errors.${code === 'required' ? 'fieldRequired' : code}`)
}

const errorAttributes = (field: RentalField) => ({
  'aria-invalid': Boolean(fieldErrors.value[field]),
  'aria-describedby': fieldErrors.value[field] ? `ski-rental-error-${field}` : undefined,
})

const clearError = (field: RentalField) => {
  delete fieldErrors.value[field]
  submitFailed.value = false
}

const submitForm = async (event: SubmitEvent) => {
  if (submitting.value) return
  const form = event.currentTarget as HTMLFormElement
  const values = new FormData(form)
  fieldErrors.value = {}
  submitFailed.value = false
  submitted.value = false
  submitting.value = true

  try {
    const response = await fetch(rentalEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'ski_rental_request',
        firstName: values.get('firstName'),
        lastName: values.get('lastName'),
        email: values.get('email'),
        location: values.get('location'),
        arrival: values.get('arrival'),
        quantity: values.get('quantity'),
        privacyConsent: values.has('consent'),
      }),
    })
    const result = await response.json()
    if (response.status === 400 && result?.fieldErrors) {
      for (const field of fields) {
        const code = result.fieldErrors[field]
        if (code === 'required' || code === 'email' || code === 'consent') {
          fieldErrors.value[field] = code
        }
      }
      if (Object.keys(fieldErrors.value).length) return
    }
    if (!response.ok || result?.ok !== true) throw new Error('Rental validation failed')
    if (!localPreview) form.reset()
    submitted.value = true
  } catch {
    submitFailed.value = true
  } finally {
    submitting.value = false
    await nextTick()
    form.querySelector<HTMLElement>('input[aria-invalid="true"]')?.focus()
  }
}
</script>

<template>
  <section id="ski-rental" class="ski-rental" aria-labelledby="ski-rental-title">
    <div class="ski-rental__layout">
      <div class="ski-rental__intro">
        <h2 id="ski-rental-title">{{ t('skiRental.title') }}</h2>
        <p class="ski-rental__lead">{{ t('skiRental.intro') }}</p>
        <div class="ski-rental__details">
          <img src="/ski-rental/equipment.webp" alt="" width="312" height="570" />
          <div>
            <h3>{{ t('skiRental.howTitle') }}</h3>
            <p>{{ t('skiRental.howText') }}</p>
          </div>
        </div>
      </div>

      <form class="ski-rental__form" novalidate @submit.prevent="submitForm">
        <fieldset class="ski-rental__fields" :disabled="submitting">
          <h3>{{ t('skiRental.formTitle') }}</h3>
          <div class="ski-rental__row">
            <label>
              <span>{{ t('skiRental.firstName') }}</span>
              <input
                name="firstName"
                autocomplete="given-name"
                :placeholder="t('skiRental.firstExample')"
                v-bind="errorAttributes('firstName')"
                @input="clearError('firstName')"
                required
              />
              <SkiRentalFieldError
                id="ski-rental-error-firstName"
                :message="fieldMessage('firstName')"
              />
            </label>
            <label>
              <span>{{ t('skiRental.lastName') }}</span>
              <input
                name="lastName"
                autocomplete="family-name"
                :placeholder="t('skiRental.lastExample')"
              />
            </label>
          </div>
          <label
            >Email
            <input
              name="email"
              type="email"
              autocomplete="email"
              placeholder="your&#64;email.com"
              v-bind="errorAttributes('email')"
              @input="clearError('email')"
              required
            />
            <SkiRentalFieldError id="ski-rental-error-email" :message="fieldMessage('email')" />
          </label>
          <div class="ski-rental__row">
            <label>
              <span>{{ t('skiRental.arrival') }}</span>
              <input name="arrival" type="date" />
            </label>
            <label>
              <span>{{ t('skiRental.quantity') }}</span>
              <input name="quantity" type="number" min="1" value="1" />
            </label>
          </div>
          <fieldset>
            <legend>{{ t('skiRental.location') }}</legend>
            <div
              class="ski-rental__options"
              :class="{ 'ski-rental__options--invalid': fieldErrors.location }"
            >
              <label v-for="option in locations" :key="option">
                <input
                  type="radio"
                  name="location"
                  :value="option"
                  v-bind="errorAttributes('location')"
                  required
                  @change="clearError('location')"
                />
                {{ t(`skiRental.${option}`) }}
              </label>
            </div>
            <SkiRentalFieldError
              id="ski-rental-error-location"
              :message="fieldMessage('location')"
            />
          </fieldset>
          <p class="ski-rental__required">{{ t('skiRental.required') }}</p>
          <button type="submit">
            {{ t(submitting ? 'home.hotels.bookingModal.sending' : 'skiRental.submit') }}
          </button>
          <div class="ski-rental__privacy">
            <label>
              <input
                type="checkbox"
                name="consent"
                v-bind="errorAttributes('privacyConsent')"
                required
                @change="clearError('privacyConsent')"
              />
              <span>{{ t('skiRental.consent') }}</span>
            </label>
            <p>
              {{ t('skiRental.privacyIntro') }}
              <RouterLink :to="{ name: 'privacy-policy' }">{{
                t('skiRental.privacyLink')
              }}</RouterLink
              >.
            </p>
            <SkiRentalFieldError
              id="ski-rental-error-privacyConsent"
              :message="fieldMessage('privacyConsent')"
            />
          </div>
        </fieldset>
        <p v-if="submitFailed" role="alert" class="booking-modal__field-error">
          {{ t('home.hotels.bookingModal.errors.send') }}
        </p>
        <p v-if="submitted" role="status">
          {{ t(localPreview ? 'skiRental.preview' : 'skiRental.sent') }}
        </p>
      </form>
    </div>
  </section>
</template>

<style scoped>
.ski-rental {
  background: #fdf4df;
  color: var(--green-deep);
  font:
    400 17px/1.29 Manrope,
    sans-serif;
  padding-block: 100px 100px;
  scroll-margin-top: 80px;
}

.ski-rental__layout {
  width: var(--container-safe);
  margin-inline: auto;
  display: grid;
  grid-template-columns: minmax(0, 600fr) minmax(0, 564fr);
  gap: clamp(24px, 3.5vw, 44px);
  overflow-wrap: anywhere;
}

h2,
h3,
p {
  margin: 0;
}

.ski-rental__intro h2,
.ski-rental__form h3 {
  font:
    700 clamp(30px, 3.5vw, 44px)/1.05 'Playfair Display',
    serif;
}

.ski-rental__lead {
  margin-top: 20px;
  font-weight: 800;
}
.ski-rental__intro {
  display: flex;
  flex-direction: column;
}
.ski-rental__details {
  display: grid;
  grid-template-columns: minmax(0, 312fr) minmax(0, 264fr);
  gap: 24px;
  align-items: end;
  margin-top: auto;
  margin-bottom: 16px;
}

.ski-rental__details img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 312 / 570;
  object-fit: cover;
  border-radius: 8px;
}

.ski-rental__details h3 {
  margin-bottom: 20px;
  font:
    500 24px/1.1 Manrope,
    sans-serif;
}

.ski-rental__fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ski-rental__form h3 {
  max-width: 490px;
  font-size: clamp(26px, 2.7vw, 32px);
  line-height: 1.08;
  margin-bottom: 5px;
}

.ski-rental__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 24px;
}

@media (width > 600px) {
  .ski-rental__row label {
    display: grid;
    grid-row: span 3;
    grid-template-rows: subgrid;
    min-width: 0;
  }
}

.ski-rental__form label,
legend {
  font-weight: 800;
}

.ski-rental__form input:not([type='radio'], [type='checkbox']),
.ski-rental__options {
  width: 100%;
  border: 1px solid var(--sand-line);
  border-radius: 8px;
  background: transparent;
  color: inherit;
}

.ski-rental__form input:not([type='radio'], [type='checkbox']) {
  display: block;
  min-height: 50px;
  margin-top: 12px;
  padding-inline: 19px;
  font:
    400 17px Manrope,
    sans-serif;
}

.ski-rental__fields:not(:disabled) button:hover {
  background: #174136;
}

.ski-rental__fields:disabled button {
  opacity: 0.65;
  cursor: wait;
}

.ski-rental__form input[aria-invalid='true']:not([type='radio'], [type='checkbox']),
.ski-rental__options--invalid {
  border-color: #a43b31;
  background-color: rgb(164 59 49 / 4%);
}

.ski-rental__form input[aria-invalid='true']:focus {
  outline-color: #a43b31;
  box-shadow: 0 0 0 3px rgb(164 59 49 / 12%);
}

.ski-rental__privacy .ski-rental-error {
  margin-left: 36px;
}

.ski-rental__form input::placeholder {
  color: #a5a5a5;
}

fieldset {
  border: 0;
  margin: 0;
  min-width: 0;
  padding: 0;
}

legend {
  padding: 0 0 12px;
}

.ski-rental__options {
  display: grid;
  gap: 16px;
  padding: 14px 21px 16px;
}

.ski-rental__options label,
.ski-rental__privacy label {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-weight: 400;
}

.ski-rental__options input,
.ski-rental__privacy input {
  accent-color: var(--green);
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  margin: 0;
}

.ski-rental__required {
  border-bottom: 1px solid var(--sand-line);
  padding-bottom: 12px;
  color: var(--brown);
  font-size: 15px;
}

button {
  align-self: flex-start;
  background: var(--green);
  border: 0;
  border-radius: 999px;
  color: var(--page-warm);
  cursor: pointer;
  font:
    800 17px Manrope,
    sans-serif;
  margin-top: 4px;
  min-height: 50px;
  padding: 10px 28px;
}

.ski-rental__privacy {
  font-size: 15px;
  margin-top: -8px;
}

.ski-rental__privacy label {
  gap: 13px;
  padding-left: 3px;
}

.ski-rental__privacy p {
  margin: 12px 0 0 36px;
}

.ski-rental__privacy a {
  color: var(--green);
  font-weight: 800;
}

@media (max-width: 1000px) {
  .ski-rental__layout {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 40px;
  }

  .ski-rental__details {
    grid-template-columns: minmax(0, 312px) minmax(0, 1fr);
    align-items: center;
  }
}

@media (max-width: 600px) {
  .ski-rental {
    padding-block: 32px 40px;
  }

  .ski-rental__details,
  .ski-rental__row {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }

  .ski-rental__details {
    margin-top: 24px;
  }

  .ski-rental__details img {
    max-width: 312px;
  }
}
</style>
