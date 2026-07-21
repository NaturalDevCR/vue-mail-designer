const BARE_SLUG_RE = /^[a-z0-9-]+$/

/**
 * Extrae el slug de una plantilla stock de Unlayer a partir de una URL del
 * studio (`https://studio.unlayer.com/create/<slug>`) o de un slug pelado
 * (`^[a-z0-9-]+$`). Devuelve `null` si no reconoce el formato.
 */
export function unlayerSlugFromUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed)
    if (url.hostname !== 'studio.unlayer.com') return null
    const segments = url.pathname.split('/').filter(Boolean)
    const createIdx = segments.indexOf('create')
    if (createIdx === -1 || createIdx === segments.length - 1) return null
    const slug = segments[segments.length - 1]
    return BARE_SLUG_RE.test(slug) ? slug : null
  } catch {
    return BARE_SLUG_RE.test(trimmed) ? trimmed : null
  }
}

export type UnlayerFetch = (slug: string) => Promise<unknown>

const STOCK_TEMPLATE_QUERY =
  'query StockTemplateLoad($slug: String!){ StockTemplate(slug:$slug){ StockTemplatePages{ design } } }'

/**
 * Implementación por defecto de `UnlayerFetch`: hace POST a la API GraphQL
 * pública de Unlayer para obtener el `design` de una plantilla stock.
 *
 * Falla por CORS desde el navegador salvo que el integrador use un proxy;
 * pasa tu propio `unlayerFetch`.
 */
export const defaultUnlayerFetch: UnlayerFetch = async (slug: string): Promise<unknown> => {
  const res = await fetch('https://studio.unlayer.com/api/v1/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operationName: 'StockTemplateLoad',
      query: STOCK_TEMPLATE_QUERY,
      variables: { slug },
    }),
  })

  if (!res.ok) throw new Error('No se pudo cargar la plantilla de Unlayer.')

  const json = await res.json()
  const design = json?.data?.StockTemplate?.StockTemplatePages?.[0]?.design
  if (design === undefined) throw new Error('No se pudo cargar la plantilla de Unlayer.')
  return design
}
