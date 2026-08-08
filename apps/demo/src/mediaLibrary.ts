import type { MediaItem, MediaLibraryOptions } from '@naturaldevcr/vue-mail-designer'

const PAGE_SIZE = 4
const LATENCY_MS = 500

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS))
}

let nextId = 1
function createId(): string {
  return `demo-${nextId++}`
}

function seedItem(seed: string, name: string): MediaItem {
  return {
    id: createId(),
    url: `https://picsum.photos/seed/${seed}/800/600`,
    thumbnailUrl: `https://picsum.photos/seed/${seed}/300/200`,
    name,
    createdAt: Date.now(),
  }
}

// demo: reemplaza esto por llamadas reales a tu storage (ej. Firebase Storage) —
// list/upload/delete/rename son las cuatro operaciones que la pestaña Galería necesita.
export function createDemoMediaLibrary(): MediaLibraryOptions {
  const items: MediaItem[] = [
    seedItem('vmd-1', 'Encabezado.jpg'),
    seedItem('vmd-2', 'Producto A.jpg'),
    seedItem('vmd-3', 'Producto B.jpg'),
    seedItem('vmd-4', 'Banner.jpg'),
    seedItem('vmd-5', 'Equipo.jpg'),
    seedItem('vmd-6', 'Oficina.jpg'),
  ]

  return {
    async list(cursor) {
      const start = cursor ? Number(cursor) : 0
      const page = items.slice(start, start + PAGE_SIZE)
      const end = start + page.length
      return delay({ items: page, nextCursor: end < items.length ? String(end) : undefined })
    },

    async upload(file) {
      const url = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      const item: MediaItem = { id: createId(), url, thumbnailUrl: url, name: file.name, createdAt: Date.now() }
      items.unshift(item)
      return delay(item)
    },

    async delete(id) {
      const idx = items.findIndex((i) => i.id === id)
      if (idx !== -1) items.splice(idx, 1)
      return delay(undefined)
    },

    async rename(id, name) {
      const item = items.find((i) => i.id === id)
      if (!item) throw new Error(`No existe una imagen con id ${id}`)
      item.name = name
      return delay(item)
    },
  }
}
