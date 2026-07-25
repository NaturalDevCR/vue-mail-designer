export type MediaItem = {
  id: string
  url: string
  thumbnailUrl: string
  name?: string
  size?: number
  createdAt?: string | number
}

export type MediaListPage = { items: MediaItem[]; nextCursor?: string }

export type MediaLibraryOptions = {
  list: (cursor?: string) => Promise<MediaListPage>
  upload: (file: File) => Promise<MediaItem>
  delete: (id: string) => Promise<void>
  rename: (id: string, name: string) => Promise<MediaItem>
}
