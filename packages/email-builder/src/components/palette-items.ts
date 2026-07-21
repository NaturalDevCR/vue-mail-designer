import type { BlockType } from '../schema'

export const PALETTE_BLOCKS: { type: BlockType; labelKey: string }[] = [
  { type: 'heading', labelKey: 'palette.heading' },
  { type: 'text', labelKey: 'palette.text' },
  { type: 'image', labelKey: 'palette.image' },
  { type: 'button', labelKey: 'palette.button' },
  { type: 'divider', labelKey: 'palette.divider' },
  { type: 'spacer', labelKey: 'palette.spacer' },
  { type: 'social', labelKey: 'palette.social' },
  { type: 'menu', labelKey: 'palette.menu' },
  { type: 'html', labelKey: 'palette.html' },
  { type: 'video', labelKey: 'palette.video' },
  { type: 'table', labelKey: 'palette.table' },
  { type: 'gallery', labelKey: 'palette.gallery' },
  { type: 'timer', labelKey: 'palette.timer' },
]

export const ROW_LAYOUTS: { key: string; labelKey: string; widths: number[] }[] = [
  { key: '100', labelKey: 'layout.100', widths: [100] },
  { key: '50-50', labelKey: 'layout.50-50', widths: [50, 50] },
  { key: '33-33-33', labelKey: 'layout.33-33-33', widths: [33, 34, 33] },
  { key: '66-33', labelKey: 'layout.66-33', widths: [66, 34] },
  { key: '33-66', labelKey: 'layout.33-66', widths: [34, 66] },
  { key: '25-25-25-25', labelKey: 'layout.25-25-25-25', widths: [25, 25, 25, 25] },
]
