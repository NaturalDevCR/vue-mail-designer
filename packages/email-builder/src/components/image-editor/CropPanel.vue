<!-- packages/email-builder/src/components/image-editor/CropPanel.vue -->
<template>
  <div class="vmd-crop-panel">
    <div class="vmd-crop-viewport">
      <Cropper
        ref="cropperRef"
        class="vmd-cropper"
        :src="block.src"
        :stencil-props="{ aspectRatio: selectedRatio }"
        @change="onCropperChange"
      />
    </div>

    <div class="vmd-props-section-title">Aspect ratio</div>
    <div class="vmd-crop-ratio-grid">
      <button
        v-for="opt in RATIO_OPTIONS"
        :key="opt.key"
        type="button"
        class="vmd-crop-ratio-btn"
        :class="{ 'vmd-active': selectedRatioKey === opt.key }"
        @click="selectedRatioKey = opt.key"
      >
        {{ opt.label }}
      </button>
    </div>

    <div class="vmd-props-section-title">Rotar y voltear</div>
    <div class="vmd-crop-actions-grid">
      <button type="button" class="vmd-mini-btn vmd-mini-btn--text" @click="rotateLeft">
        <span class="vmd-ico" v-html="ICONS.rotateLeft" />Rotar izquierda
      </button>
      <button type="button" class="vmd-mini-btn vmd-mini-btn--text" @click="rotateRight">
        <span class="vmd-ico" v-html="ICONS.rotateRight" />Rotar derecha
      </button>
      <button
        type="button"
        class="vmd-mini-btn vmd-mini-btn--text"
        :class="{ 'vmd-active': flippedH }"
        @click="toggleFlipH"
      >
        <span class="vmd-ico" v-html="ICONS.flipHorizontal" />Flip horizontal
      </button>
      <button
        type="button"
        class="vmd-mini-btn vmd-mini-btn--text"
        :class="{ 'vmd-active': flippedV }"
        @click="toggleFlipV"
      >
        <span class="vmd-ico" v-html="ICONS.flipVertical" />Flip vertical
      </button>
    </div>
    <label class="vmd-field">
      <span class="vmd-field-label">Enderezar</span>
      <input type="range" class="vmd-range" min="-45" max="45" step="1" :value="straightenDeg" @input="onStraightenInput" />
    </label>

    <div class="vmd-props-section-title">Esquinas</div>
    <label class="vmd-field">
      <span class="vmd-field-label">Radio</span>
      <input type="range" class="vmd-range" min="0" max="60" step="1" v-model.number="radius" />
    </label>

    <button type="button" class="vmd-mini-btn vmd-mini-btn--text" @click="reset">Restablecer</button>
    <p v-if="errorMsg" class="vmd-image-error">{{ errorMsg }}</p>
  </div>
</template>

<script setup lang="ts">
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { computed, ref } from 'vue'
import type { ImageBlock } from '../../schema'
import { useBuilderOptions } from '../../options'
import { useDocumentStore } from '../../store/document'
import { useBuilderPinia } from '../../store/keys'
import { useUiStore } from '../../store/ui'
import { ICONS } from '../icons'

const props = defineProps<{ block: ImageBlock }>()

const store = useDocumentStore(useBuilderPinia())
const ui = useUiStore(useBuilderPinia())
const options = useBuilderOptions()

type CropperExposed = {
  getResult: () => { canvas: HTMLCanvasElement }
  rotate: (angle: number) => void
  flip: (horizontal: boolean, vertical: boolean) => void
  reset: () => void
}
const cropperRef = ref<CropperExposed | null>(null)

const naturalRatio = ref<number | undefined>(undefined)
// La librería real emite `@change` con el `CropperResult` completo, cuyo tamaño de imagen
// viaja en `image.{width,height}` (no en un `imageSize` de nivel superior como asumía el
// draft original de este componente).
function onCropperChange(result: { image?: { width: number; height: number } }) {
  if (result.image && !naturalRatio.value) {
    naturalRatio.value = result.image.width / result.image.height
  }
}

type RatioOption = { key: string; label: string; ratio: number | undefined }
const RATIO_OPTIONS = computed<RatioOption[]>(() => [
  { key: 'free', label: 'Free', ratio: undefined },
  { key: 'original', label: 'Original', ratio: naturalRatio.value },
  { key: 'square', label: 'Square', ratio: 1 },
  { key: '4:3', label: '4:3', ratio: 4 / 3 },
  { key: '3:2', label: '3:2', ratio: 3 / 2 },
  { key: '16:9', label: '16:9', ratio: 16 / 9 },
  { key: '3:4', label: '3:4', ratio: 3 / 4 },
  { key: '2:3', label: '2:3', ratio: 2 / 3 },
  { key: '9:16', label: '9:16', ratio: 9 / 16 },
])
const selectedRatioKey = ref('free')
const selectedRatio = computed(() => RATIO_OPTIONS.value.find((r) => r.key === selectedRatioKey.value)?.ratio)

const straightenDeg = ref(0)
const flippedH = ref(false)
const flippedV = ref(false)
const radius = ref(props.block.borderRadius ?? 0)
const errorMsg = ref<string | null>(null)

function rotateLeft() {
  cropperRef.value?.rotate(-90)
}
function rotateRight() {
  cropperRef.value?.rotate(90)
}
function onStraightenInput(e: Event) {
  const next = Number((e.target as HTMLInputElement).value)
  const delta = next - straightenDeg.value
  straightenDeg.value = next
  cropperRef.value?.rotate(delta)
}
function toggleFlipH() {
  flippedH.value = !flippedH.value
  cropperRef.value?.flip(true, false)
}
function toggleFlipV() {
  flippedV.value = !flippedV.value
  cropperRef.value?.flip(false, true)
}
function reset() {
  selectedRatioKey.value = 'free'
  straightenDeg.value = 0
  flippedH.value = false
  flippedV.value = false
  radius.value = props.block.borderRadius ?? 0
  cropperRef.value?.reset()
}

async function save() {
  if (!cropperRef.value || !options.uploadImage) return
  errorMsg.value = null
  let blob: Blob | null
  try {
    const { canvas } = cropperRef.value.getResult()
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  } catch {
    errorMsg.value = 'No se pudo procesar esta imagen (¿es de otro origen sin CORS habilitado?).'
    return
  }
  if (!blob) {
    errorMsg.value = 'No se pudo procesar esta imagen (¿es de otro origen sin CORS habilitado?).'
    return
  }
  const file = new File([blob], 'cropped.png', { type: 'image/png' })
  try {
    const url = await options.uploadImage(file)
    store.updateBlock(props.block.id, { src: url, borderRadius: radius.value || undefined })
    ui.imageEditorBlockId = null
  } catch {
    errorMsg.value = 'No se pudo subir la imagen recortada.'
  }
}

defineExpose({ save })
</script>
