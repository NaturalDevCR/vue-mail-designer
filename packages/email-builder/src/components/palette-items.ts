import type { BlockType } from '../schema'

export const PALETTE_BLOCKS: { type: BlockType; label: string; icon: string }[] = [
  { type: 'heading', label: 'Título', icon: 'H' },
  { type: 'text', label: 'Texto', icon: '¶' },
  { type: 'image', label: 'Imagen', icon: '🖼' },
  { type: 'button', label: 'Botón', icon: '⬢' },
  { type: 'divider', label: 'Divisor', icon: '—' },
  { type: 'spacer', label: 'Espacio', icon: '↕' },
  { type: 'social', label: 'Redes', icon: '@' },
  { type: 'menu', label: 'Menú', icon: '≡' },
  { type: 'html', label: 'HTML', icon: '<>' },
  { type: 'video', label: 'Video', icon: '▶' },
]

export const ROW_LAYOUTS: { key: string; label: string; widths: number[] }[] = [
  { key: '100', label: '1 columna', widths: [100] },
  { key: '50-50', label: '2 columnas', widths: [50, 50] },
  { key: '33-33-33', label: '3 columnas', widths: [33, 34, 33] },
  { key: '66-33', label: '2:1', widths: [66, 34] },
  { key: '33-66', label: '1:2', widths: [34, 66] },
  { key: '25-25-25-25', label: '4 columnas', widths: [25, 25, 25, 25] },
]
