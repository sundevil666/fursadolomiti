<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{ locale: string; title: string }>()
const emit = defineEmits<{ status: [value: 'loading' | 'ready' | 'error'] }>()
const frame = ref<HTMLIFrameElement | null>(null)
let poll: ReturnType<typeof setInterval> | undefined
const language = computed(() => ['en', 'it', 'ru'].includes(props.locale.split('-')[0] ?? '') ? props.locale.split('-')[0] : 'en')
// Each modal opening gets a fresh document: the provider binds global handlers and IDs.
const documentHtml = computed(() => `<!doctype html><html lang="${language.value}"><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://data.krossbooking.com/widget/v6/villacarolina/3.css">
<style>html,body{margin:0;padding:0;background:transparent}body{padding:16px;box-sizing:border-box}</style>
</head><body><div class="kross-container" data-lang="${language.value}" data-new-window="true"></div>
<script src="https://ajax.aspnetcdn.com/ajax/jQuery/jquery-3.4.1.min.js"><\/script>
<script src="https://data.krossbooking.com/widget/v6/villacarolina/3.js"><\/script>
</body></html>`)
watch(documentHtml, () => {
  clearInterval(poll)
  emit('status', 'loading')
  const deadline = Date.now() + 30000
  poll = setInterval(() => {
    const doc = frame.value?.contentDocument
    if (doc?.querySelector('.form-kross-booking')) {
      emit('status', 'ready')
      clearInterval(poll)
    } else if (Date.now() >= deadline) {
      emit('status', 'error')
      clearInterval(poll)
    }
  }, 250)
}, { immediate: true })
onBeforeUnmount(() => clearInterval(poll))
</script>

<template>
  <iframe ref="frame" :title="title" :srcdoc="documentHtml" class="kross-booking-frame"></iframe>
</template>

<style scoped>
.kross-booking-frame { display: block; width: 100%; height: 620px; border: 0; }
</style>
