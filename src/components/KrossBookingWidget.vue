<script lang="ts">
// Krossbooking initializes once and installs global handlers. Keep its DOM alive
// between modal openings instead of loading the script and binding events again.
let widget: HTMLDivElement | undefined
let loading: Promise<void> | undefined

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => {
      script.remove()
      reject(new Error(`Failed to load ${src}`))
    }
    document.head.append(script)
  })
}

function initialize() {
  if (loading) return loading
  loading = (async () => {
    if (!document.querySelector('link[data-kross-style]')) {
      const style = document.createElement('link')
      style.rel = 'stylesheet'
      style.href = 'https://data.krossbooking.com/widget/v6/villacarolina/3.css'
      style.dataset.krossStyle = ''
      document.head.append(style)
    }
    if (!(window as Window & { jQuery?: unknown }).jQuery) {
      await loadScript('https://ajax.aspnetcdn.com/ajax/jQuery/jquery-3.4.1.min.js')
    }
    await loadScript('https://data.krossbooking.com/widget/v6/villacarolina/3.js')
  })().catch((error) => {
    loading = undefined
    throw error
  })
  return loading
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{ locale: string; title: string }>()
const emit = defineEmits<{ status: [value: 'loading' | 'ready' | 'error'] }>()
const host = ref<HTMLDivElement | null>(null)
let disposed = false
let poll: ReturnType<typeof setInterval> | undefined

onMounted(async () => {
  emit('status', 'loading')
  if (!widget) {
    widget = document.createElement('div')
    widget.className = 'kross-container'
    widget.dataset.lang = ['en', 'it', 'ru'].includes(props.locale.split('-')[0] ?? '')
      ? props.locale.split('-')[0]
      : 'en'
    widget.dataset.newWindow = 'true'
    widget.dataset.dropup = 'false'
  }
  host.value?.append(widget)
  widget.hidden = false
  document.body.classList.add('is-kross-modal-open')
  try {
    await initialize()
    if (disposed) return
    const deadline = Date.now() + 30000
    poll = setInterval(() => {
      if (widget?.querySelector('.form-kross-booking')) {
        emit('status', 'ready')
        clearInterval(poll)
      } else if (Date.now() >= deadline) {
        emit('status', 'error')
        clearInterval(poll)
      }
    }, 100)
  } catch (error) {
    if (!disposed) emit('status', 'error')
    console.error('Krossbooking widget failed', error)
  }
})
onBeforeUnmount(() => {
  disposed = true
  clearInterval(poll)
  ;(window as Window & { kbFullHideAll?: () => void }).kbFullHideAll?.()
  document.body.classList.remove('is-kross-modal-open', 'kb-widget-open')
  // Hide open popovers before parking the initialized widget for reuse.
  document
    .querySelectorAll<HTMLElement>(
      '#kb-widget-container .daterangepicker, #kb-widget-container .kb-select, #kb-widget-container .kb-sharebuttonPopup',
    )
    .forEach((element) => {
      element.style.display = 'none'
    })
  if (widget) {
    widget.hidden = true
    document.body.append(widget)
  }
})
</script>

<template>
  <div ref="host" class="kross-booking-widget" :aria-label="title"></div>
</template>

<style>
.kross-booking-widget {
  width: 100%;
  padding: 16px;
}
/* Provider popovers are attached to body, outside the modal's scrolling panel. */
body.is-kross-modal-open #kb-widget-container {
  position: static;
}
body.is-kross-modal-open #kb-widget-container > div {
  z-index: 10001;
}
body:not(.is-kross-modal-open) #kb-widget-container {
  display: none !important;
}
body.is-kross-modal-open #kb-widget-container .daterangepicker,
body.is-kross-modal-open #kb-widget-container .kb-select,
body.is-kross-modal-open #kb-widget-container .kb-sharebuttonPopup {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  right: auto !important;
  transform: translate(-50%, -50%);
  margin: 0 !important;
  max-width: calc(100vw - 24px);
  max-height: calc(100dvh - 24px);
  overflow: auto;
  box-sizing: border-box;
  z-index: 10001 !important;
}
.kross-booking-widget .form-kross-booking {
  flex-wrap: wrap;
}
.kross-booking-widget .kross-container,
body.is-kross-modal-open #kb-widget-container {
  font-family: Arial, sans-serif;
}
.kross-container[hidden] {
  display: none !important;
}
@media (min-width: 1024px) {
  .kross-booking-widget .form-kross-booking .kb-date {
    width: auto;
    flex: 1;
    min-width: 300px;
  }
  .kross-booking-widget .form-kross-booking .kb-adults {
    width: 100px;
    flex: 0 0 100px;
  }
}
@media (max-width: 700px) {
  body.is-kross-modal-open #kb-widget-container .drp-calendar-container {
    flex-direction: column;
  }
  body.is-kross-modal-open #kb-widget-container .daterangepicker {
    width: calc(100vw - 24px) !important;
  }
  body.is-kross-modal-open #kb-widget-container .drp-calendar {
    float: none !important;
    width: 100% !important;
    max-width: none;
    padding: 8px !important;
    box-sizing: border-box;
  }
  body.is-kross-modal-open #kb-widget-container .calendar-table {
    padding: 0 !important;
  }
  body.is-kross-modal-open #kb-widget-container .calendar-table table {
    width: 100% !important;
    min-width: 0;
  }
}
</style>
