<template>
  <div
    ref="el"
    class="vmd-block"
    :class="{ 'vmd-selected': isSelected, 'vmd-drop-before': blockEdge === 'before', 'vmd-drop-after': blockEdge === 'after' }"
    @click.stop="selectBlock"
  >
    <span v-if="showHiddenBadge" class="vmd-hidden-badge">{{ t('canvas.hiddenHere') }}</span>
    <div class="vmd-block-actions">
      <button ref="handle" type="button" class="vmd-mini-btn vmd-drag-handle" :title="t('props.move')"><span class="vmd-ico" v-html="ICONS.move" /></button>
      <button type="button" class="vmd-mini-btn" :title="t('props.duplicate')" @click.stop="store.duplicateBlock(block.id)"><span class="vmd-ico" v-html="ICONS.duplicate" /></button>
      <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" :title="t('props.delete')" @click.stop="store.removeBlock(block.id)"><span class="vmd-ico" v-html="ICONS.trash" /></button>
    </div>

    <!-- heading -->
    <div
      v-if="block.type === 'heading'"
      :style="{
        color: block.style.color,
        fontSize: block.style.fontSize + 'px',
        textAlign: block.style.align,
        fontWeight: block.fontWeight,
        lineHeight: String(block.style.lineHeight),
        letterSpacing: block.style.letterSpacing + 'px',
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
        textAlign: block.style.align,
        lineHeight: String(block.style.lineHeight),
        letterSpacing: block.style.letterSpacing + 'px',
        padding: padCss(block.style.padding),
        fontFamily: block.fontFamily || fontFamily,
      }"
    >
      <div class="vmd-b-text" v-html="textHtml" />
    </div>

    <!-- image -->
    <div v-else-if="block.type === 'image'" :style="{ padding: padCss(block.style.padding), textAlign: block.align }">
      <img
        v-if="block.src"
        ref="imageDropEl"
        :src="block.src"
        :alt="block.alt"
        :class="{ 'vmd-media-drop-active': isImageOver }"
        :style="{
          ...(block.widthAuto ? { width: 'auto', maxWidth: '100%' } : { width: block.widthPct + '%' }),
          display: 'inline-block',
          ...(block.borderRadius ? { borderRadius: block.borderRadius + 'px' } : {}),
        }"
      />
      <div v-else ref="imageDropEl" class="vmd-b-image-placeholder" :class="{ 'vmd-media-drop-active': isImageOver }"><span class="vmd-ico" v-html="ICONS.image" />{{ t('canvas.imagePlaceholder') }}</div>
    </div>

    <!-- button -->
    <div v-else-if="block.type === 'button'" :style="{ padding: padCss(block.style.padding), textAlign: block.align }">
      <span
        class="vmd-b-button"
        :style="{
          background: block.style.backgroundColor,
          color: block.style.color,
          fontSize: block.style.fontSize + 'px',
          lineHeight: String(block.style.lineHeight),
          letterSpacing: block.style.letterSpacing + 'px',
          borderRadius: block.style.borderRadius + 'px',
          padding: block.style.innerPaddingY + 'px ' + block.style.innerPaddingX + 'px',
          fontFamily: fontFamily,
          width: block.widthPct ? block.widthPct + '%' : undefined,
          boxSizing: 'border-box',
          textAlign: 'center',
          border: block.style.border ? block.style.border.width + 'px ' + block.style.border.style + ' ' + block.style.border.color : undefined,
        }"
      >{{ block.label }}</span>
    </div>

    <!-- divider -->
    <div v-else-if="block.type === 'divider'" :style="{ padding: padCss(block.style.padding), textAlign: block.style.align, fontSize: '0' }">
      <div :style="{ width: block.style.widthPct + '%', display: 'inline-block', borderTop: block.style.thickness + 'px ' + block.style.lineStyle + ' ' + block.style.color }" />
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
          margin: '0 ' + block.spacing / 2 + 'px',
          background: SOCIAL_BRANDS[n.kind].color,
          borderRadius: block.iconShape === 'circle' ? '50%' : block.iconShape === 'rounded' ? '8px' : '0',
        }"
        v-html="socialGlyphHtml(n.kind, block.iconSize)"
      />
    </div>

    <!-- menu -->
    <div
      v-else-if="block.type === 'menu'"
      :style="{ padding: padCss(block.style.padding), textAlign: block.align, color: block.style.color, fontSize: block.style.fontSize + 'px', letterSpacing: block.style.letterSpacing + 'px', fontWeight: block.fontWeight, fontFamily: block.fontFamily || fontFamily }"
    >
      <template v-if="block.layout === 'vertical'">
        <div v-for="(it, i) in block.items" :key="i" :style="{ padding: padCss(block.style.itemPadding), color: block.linkColor || block.style.color }">{{ it.label }}</div>
      </template>
      <template v-else>
        <template v-for="(it, i) in block.items" :key="i">
          <span v-if="i > 0" style="padding: 0 4px">{{ block.separator }}</span>
          <span :style="{ padding: padCss(block.style.itemPadding), color: block.linkColor || block.style.color, display: 'inline-block' }">{{ it.label }}</span>
        </template>
      </template>
    </div>

    <!-- html -->
    <div v-else-if="block.type === 'html'" class="vmd-b-html" :style="{ padding: padCss(block.style.padding) }" v-html="block.code" />

    <!-- video -->
    <div v-else-if="block.type === 'video'" :style="{ padding: padCss(block.style.padding), textAlign: 'center' }">
      <div v-if="block.thumbnailUrl" class="vmd-b-video" :style="{ width: block.widthPct + '%' }">
        <img :src="block.thumbnailUrl" :alt="block.alt" style="width: 100%; display: block" />
        <span class="vmd-b-video-play" v-html="ICONS.play" />
      </div>
      <div v-else class="vmd-b-image-placeholder"><span class="vmd-ico" v-html="ICONS.video" />{{ t('canvas.videoPlaceholder') }}</div>
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
                background: block.headerRow && r === 0
                  ? block.style.headerBackground
                  : block.stripedRows && (block.headerRow ? r % 2 === 0 : r % 2 === 1) ? 'rgba(0,0,0,.03)' : 'transparent',
                color: block.headerRow && r === 0 && block.style.headerColor ? block.style.headerColor : block.style.color,
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
        <GalleryItemView
          v-for="(img, i) in block.images"
          :key="i"
          :img="img"
          :index="i"
          :block-id="block.id"
        />
      </div>
    </div>

    <!-- timer -->
    <div v-else-if="block.type === 'timer'" :style="{ padding: padCss(block.style.padding), textAlign: 'center' }">
      <img v-if="block.imageUrl" :src="block.imageUrl" :alt="block.alt" :style="{ width: block.widthPct + '%', display: 'inline-block' }" />
      <div v-else class="vmd-b-image-placeholder">{{ timerDaysText }}</div>
    </div>

    <!-- custom -->
    <div v-else-if="block.type === 'custom'">
      <div v-if="customHtml !== null" v-html="customHtml" />
      <div v-else class="vmd-b-image-placeholder">{{ t('canvas.customBlock') }} «{{ block.customType }}»</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { SOCIAL_BRANDS, socialSvg, styleLinks } from '../render/html'
import type { Block, Padding, SocialNetworkKind } from '../schema'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'
import { useBuilderOptions } from '../options'
import { useI18n } from '../i18n/useI18n'
import { useCanvasImageDrag, useDraggableItem, useDropTarget, useMediaDropTarget } from '../dnd/usePragmatic'
import { dropBlock, dropCanvasImage, dropMediaImageOnImageBlock } from '../dnd/applyDrop'
import { ICONS } from './icons'
import GalleryItemView from './GalleryItemView.vue'

const props = withDefaults(defineProps<{ block: Block; columnId?: string }>(), { columnId: '' })
const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
const options = useBuilderOptions()
const { t } = useI18n()
const el = ref<HTMLElement | null>(null)
const handle = ref<HTMLElement | null>(null)

useDraggableItem({
  el,
  handle,
  getData: () => ({ kind: 'canvas-block', blockId: props.block.id, columnId: props.columnId }),
  previewLabel: () => props.block.type,
})

const { edge: blockEdge } = useDropTarget({
  el,
  getData: () => ({ vmdBlockId: props.block.id }),
  accept: (d) => d.kind === 'palette-block' || d.kind === 'canvas-block',
  onDrop: (drag, e) => dropBlock(store, drag, props.columnId, props.block.id, e),
})

const imageDropEl = ref<HTMLElement | null>(null)
const { isOver: isImageOver } = useMediaDropTarget({
  el: imageDropEl,
  onDrop: (drag) => {
    if (drag.kind === 'media-image') dropMediaImageOnImageBlock(store, props.block.id, drag)
    else dropCanvasImage(store, drag, { blockId: props.block.id })
  },
})
useCanvasImageDrag({
  el: imageDropEl,
  getData: () => {
    const b = props.block
    return b.type === 'image'
      ? { src: b.src, alt: b.alt, from: { blockId: b.id } }
      : { src: '', alt: '', from: { blockId: b.id } }
  },
})

const customHtml = computed<string | null>(() => {
  const b = props.block
  if (b.type !== 'custom') return null
  const def = options.customBlocks?.find((d) => d.type === b.customType)
  return def ? def.render(b.data) : null
})
const isSelected = computed(() => store.selection?.kind === 'block' && store.selection.id === props.block.id)
const fontFamily = computed(() => store.doc.settings.fontFamily)

// El lienzo debe reflejar el mismo color/subrayado de link que ve el HTML exportado: el
// bloque hereda del body si no tiene los suyos propios (mismo criterio que renderHtml).
const textHtml = computed(() => {
  const b = props.block
  if (b.type !== 'text') return ''
  const color = b.linkColor ?? store.doc.settings.linkColor
  const underline = b.linkUnderline ?? store.doc.settings.linkUnderline
  return styleLinks(b.html, color, underline)
})

function socialGlyphHtml(kind: SocialNetworkKind, size: number): string {
  const g = Math.round(size * 0.62)
  return `<span style="display:inline-block;width:${g}px;height:${g}px;line-height:0;">${socialSvg(kind)}</span>`
}

const showHiddenBadge = computed(() => {
  const b = props.block
  return (ui.canvasDevice === 'mobile' && !!b.hideMobile) || (ui.canvasDevice === 'desktop' && !!b.hideDesktop)
})

const timerDaysText = computed(() => {
  const b = props.block
  if (b.type !== 'timer') return ''
  const days = Math.max(0, Math.ceil((new Date(b.endDate).getTime() - Date.now()) / 864e5))
  return `${days} ${days === 1 ? t('canvas.day') : t('canvas.days')}`
})

function padCss(p: Padding): string {
  return `${p.top}px ${p.right}px ${p.bottom}px ${p.left}px`
}

function selectBlock() {
  store.select({ kind: 'block', id: props.block.id })
  ui.panelMode = 'props'
}
</script>
