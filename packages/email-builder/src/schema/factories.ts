import { createId } from './ids'
import type { Block, BlockType, Column, CustomBlock, EmailDocument, Padding, Row } from './document'

export const BLOCK_TYPES: BlockType[] = [
  'heading',
  'text',
  'image',
  'button',
  'divider',
  'spacer',
  'social',
  'menu',
  'html',
  'video',
  'table',
  'gallery',
  'timer',
]

function pad(top: number, right: number, bottom: number, left: number): Padding {
  return { top, right, bottom, left }
}

export function createDocument(): EmailDocument {
  return {
    version: 1,
    settings: {
      contentWidth: 600,
      backgroundColor: '#f4f4f5',
      textColor: '#000000',
      fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
      fontWeight: 'normal',
      preheader: '',
      htmlTitle: '',
      contentAlignment: 'center',
      linkColor: '#3b82f6',
      linkUnderline: true,
    },
    rows: [],
  }
}

export function createColumn(widthPct: number): Column {
  return {
    id: createId('col'),
    widthPct,
    style: { backgroundColor: 'transparent', padding: pad(0, 0, 0, 0) },
    blocks: [],
  }
}

export function createRow(widths: number[]): Row {
  return {
    id: createId('row'),
    // transparente por defecto: así el color/imagen de fondo del cuerpo se ve a través de la fila
    style: { backgroundColor: 'transparent', contentBackgroundColor: 'transparent', padding: pad(8, 0, 8, 0), borderRadius: 0 },
    columns: widths.map((w) => createColumn(w)),
  }
}

export function createBlock(type: BlockType): Block {
  const id = createId('blk')
  switch (type) {
    case 'heading':
      return {
        id, type, text: 'Escribe un título', level: 1,
        style: { color: '#111827', fontSize: 28, align: 'left', lineHeight: 1.3, padding: pad(12, 24, 12, 24) },
      }
    case 'text':
      return {
        id, type, html: '<p>Escribe aquí tu texto.</p>',
        style: { color: '#374151', fontSize: 14, lineHeight: 1.6, padding: pad(8, 24, 8, 24) },
      }
    case 'image':
      return {
        id, type, src: '', alt: '', widthPct: 100, align: 'center',
        style: { padding: pad(8, 24, 8, 24) },
      }
    case 'button':
      return {
        id, type, label: 'Haz clic aquí', href: 'https://example.com', align: 'center',
        style: {
          backgroundColor: '#3b82f6', color: '#ffffff', fontSize: 14,
          borderRadius: 6, innerPaddingX: 24, innerPaddingY: 12, padding: pad(12, 24, 12, 24),
        },
      }
    case 'divider':
      return {
        id, type,
        style: { color: '#e5e7eb', thickness: 1, widthPct: 100, padding: pad(12, 24, 12, 24) },
      }
    case 'spacer':
      return { id, type, height: 24 }
    case 'social':
      return {
        id, type,
        networks: [
          { kind: 'facebook', url: 'https://facebook.com/' },
          { kind: 'instagram', url: 'https://instagram.com/' },
          { kind: 'x', url: 'https://x.com/' },
        ],
        iconSize: 32, spacing: 8, align: 'center',
        style: { padding: pad(12, 24, 12, 24) },
      }
    case 'menu':
      return {
        id, type,
        items: [
          { label: 'Inicio', href: 'https://example.com' },
          { label: 'Productos', href: 'https://example.com' },
          { label: 'Contacto', href: 'https://example.com' },
        ],
        separator: '·', align: 'center',
        style: { color: '#374151', fontSize: 14, padding: pad(12, 24, 12, 24) },
      }
    case 'html':
      return { id, type, code: '<div style="text-align:center">HTML personalizado</div>' }
    case 'video':
      return {
        id, type, thumbnailUrl: '', videoUrl: '', alt: 'Ver video', widthPct: 100,
        style: { padding: pad(8, 24, 8, 24) },
      }
    case 'table':
      return {
        id, type,
        rows: [['Encabezado 1', 'Encabezado 2'], ['Celda', 'Celda'], ['Celda', 'Celda']],
        headerRow: true,
        style: { borderColor: '#e5e7eb', borderWidth: 1, cellPadding: 8, headerBackground: '#f4f4f5', fontSize: 14, color: '#374151', padding: pad(8, 24, 8, 24) },
      }
    case 'gallery':
      return {
        id, type,
        images: [{ src: '', alt: '' }, { src: '', alt: '' }],
        columns: 2, gap: 8,
        style: { padding: pad(8, 24, 8, 24) },
      }
    case 'timer':
      return {
        id, type,
        endDate: new Date(Date.now() + 7 * 864e5).toISOString(),
        imageUrl: '', alt: 'Cuenta regresiva', widthPct: 100,
        style: { padding: pad(8, 24, 8, 24) },
      }
    case 'custom':
      // los bloques custom se crean con createCustomBlock(customType, defaultData)
      throw new Error('Usa createCustomBlock para bloques personalizados.')
  }
}

export function createCustomBlock(customType: string, defaultData: Record<string, unknown>): CustomBlock {
  return {
    id: createId('blk'),
    type: 'custom',
    customType,
    data: JSON.parse(JSON.stringify(defaultData)) as Record<string, unknown>,
  }
}
