import type { EmailDocument } from './schema'

export type FontDef = { label: string; value: string; url?: string }

/** Fuentes email-safe + Google Fonts populares (con su CSS). */
export const DEFAULT_FONTS: FontDef[] = [
  { label: 'Arial', value: "Arial, 'Helvetica Neue', Helvetica, sans-serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { label: 'Courier New', value: "'Courier New', Courier, monospace" },
  { label: 'Roboto', value: "'Roboto', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap' },
  { label: 'Open Sans', value: "'Open Sans', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap' },
  { label: 'Lato', value: "'Lato', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap' },
  { label: 'Montserrat', value: "'Montserrat', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap' },
  { label: 'Poppins', value: "'Poppins', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap' },
]

/** Recolecta los font-family usados en el documento (settings + bloques heading/text). */
export function usedFontValues(doc: EmailDocument): Set<string> {
  const used = new Set<string>()
  used.add(doc.settings.fontFamily)
  for (const row of doc.rows) {
    for (const col of row.columns) {
      for (const block of col.blocks) {
        if ((block.type === 'heading' || block.type === 'text') && block.fontFamily) {
          used.add(block.fontFamily)
        }
      }
    }
  }
  return used
}

/** URLs de Google Fonts que hay que cargar para las fuentes usadas en el documento. */
export function usedFontUrls(doc: EmailDocument, fonts: FontDef[]): string[] {
  const used = usedFontValues(doc)
  const urls = new Set<string>()
  for (const f of fonts) {
    if (f.url && used.has(f.value)) urls.add(f.url)
  }
  return Array.from(urls)
}
