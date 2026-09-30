import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import ts from 'typescript'

// Execute the real Vue setup code with only its browser/component boundaries mocked.
const file = process.env.BOOKING_COMPONENT || 'src/components/sections/HotelsPreviewSection.vue'
const source = readFileSync(file, 'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
const code = ts.transpileModule(source.replaceAll('import.meta.env', '({})') + `
;globalThis.subject = { mountBookingSuedtirolWidget, loadBookingSuedtirolScript,
  bookingHotelId, bookingSuedtirolContainer, bookingSuedtirolStatus };
`, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText

function setup() {
  const scripts = []
  const watchers = []
  const disposers = []
  const calls = []
  let unmounts = 0
  const hotel = { id: 'chalet-zenit', bookingSuedtirol: {
    id: '46f72afb-7807-4d15-af6f-50bfe01de476', propertyId: 13459,
    promotion: ['affiliate', 'fursadolomiti.com', 'chalet_zenit_13459'],
  } }
  class Script extends EventTarget {
    remove() { scripts.splice(scripts.indexOf(this), 1) }
  }
  const window = { location: { origin: 'https://fursadolomiti.com', hostname: 'fursadolomiti.com' } }
  const vue = {
    ref: value => ({ value }), computed: get => ({ get value() { return get() } }),
    nextTick: () => Promise.resolve(), onMounted: () => {},
    onBeforeUnmount: fn => disposers.push(fn),
    watch: (source, callback, options) => watchers.push({ source, callback, options }),
  }
  const context = {
    exports: {}, defineProps: () => ({}), window, console,
    document: { querySelector: () => scripts[0], createElement: () => new Script(),
      body: { append: script => scripts.push(script), classList: { remove() {} } } },
    require: name => name === 'vue' ? vue : name === 'vue-i18n'
      ? { useI18n: () => ({ locale: { value: 'ru' }, t: x => x, tm: () => [] }) }
      : name.includes('homeSections') ? { bookableHotelPreviews: [hotel] } : {},
  }
  vm.runInNewContext(code, context)
  const subject = context.subject
  const activate = (nextHotel = hotel) => {
    subject.bookingHotelId.value = nextHotel.id
    subject.bookingSuedtirolContainer.value = { innerHTML: '', connected: true }
  }
  const provideAPI = () => {
    window.BookingSüdtirol = { Widgets: { Booking: (container, settings) => {
      calls.push({ container, settings })
      return { render() {}, unmount() { unmounts++; return true } }
    } } }
  }
  const close = () => {
    subject.bookingHotelId.value = null
    for (const watcher of watchers.filter(w => w.source === subject.bookingHotelId && w.options?.flush === 'sync')) {
      watcher.callback(null)
    }
    subject.bookingSuedtirolContainer.value = null
  }
  return { subject, hotel, scripts, calls, window, activate, provideAPI, close, disposers,
    get unmounts() { return unmounts } }
}

test('uses documented script and Chalet Zenit IDs, with supported language', async () => {
  const h = setup(); h.activate()
  const mounted = h.subject.mountBookingSuedtirolWidget(h.hotel)
  assert.equal(h.scripts[0].src, 'https://widget.bookingsuedtirol.com/v2/bundle.js')
  assert.equal(h.scripts[0].defer, true)
  assert.equal(h.window.BookingSüdtirolTrackingConsent, false)
  h.provideAPI(); h.scripts[0].dispatchEvent(new Event('load')); await mounted
  assert.equal(h.calls.length, 1)
  assert.equal(h.calls[0].settings.id, h.hotel.bookingSuedtirol.id)
  assert.equal(h.calls[0].settings.propertyId, 13459)
  assert.equal(h.calls[0].settings.lang, 'en')
})

test('unmounts before closing the modal and on component disposal', async () => {
  const h = setup(); h.provideAPI(); h.activate()
  await h.subject.mountBookingSuedtirolWidget(h.hotel)
  h.close(); assert.equal(h.unmounts, 1)
  h.activate(); await h.subject.mountBookingSuedtirolWidget(h.hotel)
  h.disposers.forEach(fn => fn()); assert.equal(h.unmounts, 2)
})

test('closing during script load does not mount into a removed container', async () => {
  const h = setup(); h.activate()
  const pending = h.subject.mountBookingSuedtirolWidget(h.hotel)
  h.close(); h.provideAPI(); h.scripts[0].dispatchEvent(new Event('load')); await pending
  assert.equal(h.calls.length, 0)
  assert.notEqual(h.subject.bookingSuedtirolStatus.value, 'error')
})

test('switching hotels while loading mounts only the current hotel', async () => {
  const h = setup(); h.activate()
  const first = h.subject.mountBookingSuedtirolWidget(h.hotel)
  h.close()
  const other = { id: 'other', bookingSuedtirol: { id: 'other-widget', propertyId: 11034 } }
  h.activate(other)
  const second = h.subject.mountBookingSuedtirolWidget(other)
  h.provideAPI(); h.scripts[0].dispatchEvent(new Event('load'))
  await Promise.all([first, second])
  assert.equal(h.calls.length, 1)
  assert.equal(h.calls[0].settings.propertyId, 11034)
})

test('failed script can be retried on the next open', async () => {
  const h = setup()
  const first = h.subject.loadBookingSuedtirolScript()
  h.scripts[0].dispatchEvent(new Event('error'))
  await assert.rejects(first)
  const second = h.subject.loadBookingSuedtirolScript()
  assert.equal(h.scripts.length, 1)
  h.provideAPI(); h.scripts[0].dispatchEvent(new Event('load'))
  await second
})
