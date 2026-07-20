import type { BlockType } from '../schema'

export const PALETTE_BLOCKS: { type: BlockType; label: string }[] = [
  { type: 'heading', label: 'Título' },
  { type: 'text', label: 'Texto' },
  { type: 'image', label: 'Imagen' },
  { type: 'button', label: 'Botón' },
  { type: 'divider', label: 'Divisor' },
  { type: 'spacer', label: 'Espacio' },
  { type: 'social', label: 'Redes' },
  { type: 'menu', label: 'Menú' },
  { type: 'html', label: 'HTML' },
  { type: 'video', label: 'Video' },
  { type: 'table', label: 'Tabla' },
  { type: 'gallery', label: 'Galería' },
  { type: 'timer', label: 'Timer' },
]

export const ROW_LAYOUTS: { key: string; label: string; widths: number[] }[] = [
  { key: '100', label: '1 columna', widths: [100] },
  { key: '50-50', label: '2 columnas', widths: [50, 50] },
  { key: '33-33-33', label: '3 columnas', widths: [33, 34, 33] },
  { key: '66-33', label: '2:1', widths: [66, 34] },
  { key: '33-66', label: '1:2', widths: [34, 66] },
  { key: '25-25-25-25', label: '4 columnas', widths: [25, 25, 25, 25] },
]
