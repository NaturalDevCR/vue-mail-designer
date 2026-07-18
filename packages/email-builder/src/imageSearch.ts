export type ImageResult = { url: string; thumbnailUrl: string; title?: string }

type OpenverseResult = { url: string; thumbnail: string; title?: string }
type OpenverseResponse = { results: OpenverseResult[] }

export async function openverseSearch(query: string): Promise<ImageResult[]> {
  const res = await fetch(
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license_type=commercial&page_size=20`,
  )
  if (!res.ok) throw new Error('No se pudo buscar imágenes.')
  const data = (await res.json()) as OpenverseResponse
  return data.results.map((r) => ({ url: r.url, thumbnailUrl: r.thumbnail, title: r.title }))
}
