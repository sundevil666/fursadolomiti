import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import ts from 'typescript'

const source = readFileSync('src/components/sections/HotelsPreviewSection.vue', 'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
const transpile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const data = { exports: {}, URL }
vm.runInNewContext(transpile(readFileSync('src/data/homeSections.ts', 'utf8')), data)
const hotels = data.exports.bookableHotelPreviews
const code = transpile(source.replaceAll('import.meta.env', '({})') + `
;globalThis.subject = { openBookingModal, closeBookingModal, submitBookingRequest, bookingStep,
 firstName, lastName, email, preferredDates, guests, formStatus, formError, showWidget, isRequestHotel };
`)
function setup(ok = true) {
  const requests = [], redirects = []
  const context = {
    exports: {}, defineProps: () => ({}), console, URL, Intl, Date,
    window: { location: { hostname: 'localhost', assign: url => redirects.push(url) }, setTimeout: fn => fn() },
    fetch: async (_url, options) => {
      requests.push(JSON.parse(options.body))
      return { ok, text: async () => 'Simulated error', json: async () => ({ promoCode: requests.at(-1).promoCode, customerEmailSent: true }) }
    },
    require: name => name === 'vue' ? {
      ref: value => ({ value }), computed: get => ({ get value() { return get() } }),
      nextTick: async () => {}, onMounted() {}, onBeforeUnmount() {}, watch() {},
    } : name === 'vue-i18n' ? { useI18n: () => ({ locale: { value: 'ru' }, t: key => key, tm: () => [] }) }
      : name.includes('homeSections') ? { bookableHotelPreviews: hotels } : {},
  }
  vm.runInNewContext(code, context)
  const s = context.subject
  const fill = () => { s.firstName.value = 'Test'; s.lastName.value = 'Guest'; s.email.value = 'guest@example.com' }
  return { s, requests, redirects, fill }
}

test('every configured widget begins with personal details and opens only after successful submission', async () => {
  for (const hotel of hotels.filter(h => h.bookingSuedtirol || h.bookingExpert || h.bookingKross)) {
    const { s, requests, redirects, fill } = setup()
    s.openBookingModal(hotel.id)
    assert.equal(s.showWidget.value, false)
    assert.equal(s.isRequestHotel.value, false)
    await s.submitBookingRequest()
    assert.equal(requests.length, 0)
    fill(); await s.submitBookingRequest()
    assert.equal(requests.length, 1)
    assert.equal(requests[0].bookingMode, 'widget')
    assert.equal(requests[0].locale, 'ru')
    assert.equal(s.showWidget.value, true)
    assert.equal(redirects.length, 0)
    s.closeBookingModal(); s.openBookingModal(hotel.id)
    assert.equal(s.showWidget.value, false)
    assert.equal(s.email.value, '')
  }
})

test('request-only hotels require dates and guests, then stay on confirmation', async () => {
  for (const id of ['chalet-zenit', 'villa-carolina']) {
    const { s, requests, redirects, fill } = setup()
    s.openBookingModal(id); fill()
    await s.submitBookingRequest(); assert.equal(requests.length, 0)
    s.preferredDates.value = 'Flexible January dates'; s.guests.value = '2'
    await s.submitBookingRequest()
    assert.equal(requests[0].bookingMode, 'request')
    assert.equal(s.formStatus.value, 'redirecting')
    assert.equal(redirects.length, 0)
  }
})

test('link-only hotel collects request details before redirecting with attribution', async () => {
  const { s, requests, redirects, fill } = setup()
  s.openBookingModal('luna-mondschein'); fill()
  assert.equal(s.isRequestHotel.value, true)
  await s.submitBookingRequest(); assert.equal(requests.length, 0)
  s.preferredDates.value = 'January'; s.guests.value = '2'
  await s.submitBookingRequest()
  assert.equal(requests[0].bookingMode, 'redirect')
  const target = new URL(redirects[0])
  assert.equal(target.hostname, 'booking.hotel-luna.com')
  assert.equal(target.searchParams.get('canale'), 'FURSADOLOMITI')
})

test('mail failure keeps the personal form and does not open a widget', async () => {
  const { s, fill, redirects } = setup(false)
  s.openBookingModal('continental'); fill(); await s.submitBookingRequest()
  assert.equal(s.showWidget.value, false)
  assert.equal(s.formStatus.value, 'idle')
  assert.match(s.formError.value, /errors.send/)
  assert.equal(redirects.length, 0)
})
