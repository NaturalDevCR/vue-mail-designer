<template>
  <div
    class="vmd-block"
    :class="{ 'vmd-selected': isSelected }"
    @click.stop="selectBlock"
  >
    <span v-if="showHiddenBadge" class="vmd-hidden-badge">Oculto aquí</span>
    <div class="vmd-block-actions">
      <button type="button" class="vmd-mini-btn vmd-drag-handle" title="Mover">✥</button>
      <button type="button" class="vmd-mini-btn" title="Duplicar" @click.stop="store.duplicateBlock(block.id)">⧉</button>
      <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" title="Eliminar" @click.stop="store.removeBlock(block.id)">🗑</button>
    </div>

    <!-- heading -->
    <div
      v-if="block.type === 'heading'"
      :style="{
        color: block.style.color,
        fontSize: block.style.fontSize + 'px',
        textAlign: block.style.align,
        fontWeight: 'bold',
        padding: padCss(block.style.padding),
        fontFamily: block.fontFamily || fontFamily,
      }"
    >{{ block.text }}</div>

    <!-- text -->
    <div
      v-else-if="block.type === 'text'"
      :style="{
        color: block.style.color,
        fontSize: block.style.fontSize + 'px',
        lineHeight: String(block.style.lineHeight),
        padding: padCss(block.style.padding),
        fontFamily: block.fontFamily || fontFamily,
      }"
    >
      <RichTextEditor
        v-if="isSelected"
        :model-value="block.html"
        @update:model-value="store.updateBlock(block.id, { html: $event })"
      />
      <div v-else class="vmd-b-text" v-html="block.html" />
    </div>

    <!-- image -->
    <div v-else-if="block.type === 'image'" :style="{ padding: padCss(block.style.padding), textAlign: block.align }">
      <img v-if="block.src" :src="block.src" :alt="block.alt" :style="{ width: block.widthPct + '%', display: 'inline-block' }" />
      <div v-else class="vmd-b-image-placeholder">🖼 Selecciona una imagen en el inspector</div>
    </div>

    <!-- button -->
    <div v-else-if="block.type === 'button'" :style="{ padding: padCss(block.style.padding), textAlign: block.align }">
      <span
        class="vmd-b-button"
        :style="{
          background: block.style.backgroundColor,
          color: block.style.color,
          fontSize: block.style.fontSize + 'px',
          borderRadius: block.style.borderRadius + 'px',
          padding: block.style.innerPaddingY + 'px ' + block.style.innerPaddingX + 'px',
          fontFamily: fontFamily,
        }"
      >{{ block.label }}</span>
    </div>

    <!-- divider -->
    <div v-else-if="block.type === 'divider'" :style="{ padding: padCss(block.style.padding), textAlign: 'center' }">
      <div :style="{ width: block.style.widthPct + '%', display: 'inline-block', borderTop: block.style.thickness + 'px solid ' + block.style.color }" />
    </div>

    <!-- spacer -->
    <div v-else-if="block.type === 'spacer'" class="vmd-b-spacer" :style="{ height: block.height + 'px' }" />

    <!-- social -->
    <div v-else-if="block.type === 'social'" :style="{ padding: padCss(block.style.padding), textAlign: block.align }">
      <span
        v-for="(n, i) in block.networks"
        :key="i"
        class="vmd-b-social-icon"
        :style="{
          width: block.iconSize + 'px', height: block.iconSize + 'px',
          lineHeight: block.iconSize + 'px',
          margin: '0 ' + block.spacing / 2 + 'px',
          background: SOCIAL_BRANDS[n.kind].color,
          fontSize: Math.round(block.iconSize * 0.45) + 'px',
        }"
      >{{ SOCIAL_BRANDS[n.kind].label }}</span>
    </div>

    <!-- menu -->
    <div
      v-else-if="block.type === 'menu'"
      :style="{ padding: padCss(block.style.padding), textAlign: block.align, color: block.style.color, fontSize: block.style.fontSize + 'px', fontFamily: fontFamily }"
    >
      <template v-for="(it, i) in block.items" :key="i">
        <span v-if="i > 0" style="padding: 0 8px">{{ block.separator }}</span>
        <span>{{ it.label }}</span>
      </template>
    </div>

    <!-- html -->
    <div v-else-if="block.type === 'html'" class="vmd-b-html" v-html="block.code" />

    <!-- video -->
    <div v-else-if="block.type === 'video'" :style="{ padding: padCss(block.style.padding), textAlign: 'center' }">
      <div v-if="block.thumbnailUrl" class="vmd-b-video" :style="{ width: block.widthPct + '%' }">
        <img :src="block.thumbnailUrl" :alt="block.alt" style="width: 100%; display: block" />
        <span class="vmd-b-video-play">▶</span>
      </div>
      <div v-else class="vmd-b-image-placeholder">▶ Configura el video en el inspector</div>
    </div>

    <!-- table -->
    <div v-else-if="block.type === 'table'" :style="{ padding: padCss(block.style.padding) }">
      <table
        class="vmd-b-table"
        :style="{ borderCollapse: 'collapse', width: '100%', fontSize: block.style.fontSize + 'px', color: block.style.color, fontFamily: fontFamily }"
      >
        <tbody>
          <tr v-for="(row, r) in block.rows" :key="r">
            <component
              :is="block.headerRow && r === 0 ? 'th' : 'td'"
              v-for="(cell, c) in row"
              :key="c"
              :style="{
                border: block.style.borderWidth + 'px solid ' + block.style.borderColor,
                padding: block.style.cellPadding + 'px',
                background: block.headerRow && r === 0 ? block.style.headerBackground : 'transparent',
                textAlign: 'left',
              }"
            >{{ cell }}</component>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- gallery -->
    <div v-else-if="block.type === 'gallery'" :style="{ padding: padCss(block.style.padding) }">
      <div
        class="vmd-b-gallery"
        :style="{ display: 'grid', gridTemplateColumns: 'repeat(' + block.columns + ', 1fr)', gap: block.gap + 'px' }"
      >
        <template v-for="(img, i) in block.images" :key="i">
          <img v-if="img.src" :src="img.src" :alt="img.alt" style="width: 100%; display: block" />
          <div v-else class="vmd-b-image-placeholder vmd-b-gallery-placeholder">🖼</div>
        </template>
      </div>
    </div>

    <!-- timer -->
    <div v-else-if="block.type === 'timer'" :style="{ padding: padCss(block.style.padding), textAlign: 'center' }">
      <img v-if="block.imageUrl" :src="block.imageUrl" :alt="block.alt" :style="{ width: block.widthPct + '%', display: 'inline-block' }" />
      <div v-else class="vmd-b-image-placeholder">{{ timerDaysText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SOCIAL_BRANDS } from '../render/html'
import type { Block, Padding } from '../schema'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'
import RichTextEditor from './RichTextEditor.vue'

const props = defineProps<{ block: Block }>()
const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
const isSelected = computed(() => store.selection?.kind === 'block' && store.selection.id === props.block.id)
const fontFamily = computed(() => store.doc.settings.fontFamily)

const showHiddenBadge = computed(() => {
  const b = props.block
  return (ui.canvasDevice === 'mobile' && !!b.hideMobile) || (ui.canvasDevice === 'desktop' && !!b.hideDesktop)
})

const timerDaysText = computed(() => {
  const b = props.block
  if (b.type !== 'timer') return ''
  const days = Math.max(0, Math.ceil((new Date(b.endDate).getTime() - Date.now()) / 864e5))
  return `${days} ${days === 1 ? 'día' : 'días'}`
})

function padCss(p: Padding): string {
  return `${p.top}px ${p.right}px ${p.bottom}px ${p.left}px`
}

function selectBlock() {
  store.select({ kind: 'block', id: props.block.id })
  ui.panelMode = 'props'
}
</script>
