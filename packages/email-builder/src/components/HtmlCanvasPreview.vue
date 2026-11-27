<template>
  <iframe
    ref="frame"
    :title="title"
    :srcdoc="source"
    sandbox="allow-same-origin"
    referrerpolicy="no-referrer"
    tabindex="-1"
    :style="{ display: 'block', width: '100%', height: `${height}px`, border: 0, pointerEvents: 'none' }"
    @load="observeContent"
  />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { isolatePreviewHtml } from '../editor/previewHtml'

const props = defineProps<{ html: string; title: string; dark: boolean }>()
const frame = ref<HTMLIFrameElement | null>(null)
const mounted = ref(false)
const height = ref(24)
let observer: ResizeObserver | undefined

const source = computed(() => {
  if (!mounted.value) return undefined
  const color = props.dark ? '#eef2ff' : '#18181b'
  return isolatePreviewHtml(`<!doctype html><html><head><style>
    body { margin: 0; display: flow-root; font: 14px system-ui, sans-serif; color: ${color}; }
    img { max-width: 100%; }
  </style></head><body>${props.html}</body></html>`)
})

function observeContent() {
  observer?.disconnect()
  const body = frame.value?.contentDocument?.body
  if (!body) return

  const measure = () => { height.value = Math.max(24, Math.ceil(body.getBoundingClientRect().height)) }
  measure()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    observer.observe(body)
  }
}

onMounted(() => { mounted.value = true })
onBeforeUnmount(() => observer?.disconnect())
</script>
