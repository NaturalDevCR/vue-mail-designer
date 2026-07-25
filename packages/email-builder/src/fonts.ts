import type { EmailDocument } from './schema'

export type FontDef = { label: string; value: string; url?: string }

/**
 * Fuentes disponibles en el builder. Dos grupos:
 * - Web-safe: ya instaladas en prácticamente cualquier SO/cliente de correo, se renderizan
 *   nativas sin cargar nada — la apuesta más segura para máxima compatibilidad.
 * - Google Fonts: se cargan vía <link> (usedFontUrls incluye solo las que el documento usa
 *   de verdad). Las respetan Apple Mail, iOS/Gmail/Yahoo webmail, etc.; los clientes que no
 *   cargan fuentes web (notablemente Outlook de escritorio) caen automáticamente al stack de
 *   respaldo indicado en cada `value` (p.ej. `sans-serif`), así que el correo nunca se rompe.
 */
export const DEFAULT_FONTS: FontDef[] = [
  // --- web-safe (sin carga externa) ---
  { label: 'Arial', value: "Arial, 'Helvetica Neue', Helvetica, sans-serif" },
  { label: 'Helvetica', value: "Helvetica, 'Helvetica Neue', Arial, sans-serif" },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', Helvetica, sans-serif" },
  { label: 'Segoe UI', value: "'Segoe UI', Tahoma, Geneva, sans-serif" },
  { label: 'Calibri', value: 'Calibri, Candara, Segoe, sans-serif' },
  { label: 'Century Gothic', value: "'Century Gothic', Futura, sans-serif" },
  { label: 'Lucida Sans', value: "'Lucida Sans Unicode', 'Lucida Grande', sans-serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { label: 'Palatino', value: "'Palatino Linotype', Palatino, serif" },
  { label: 'Garamond', value: 'Garamond, Baskerville, serif' },
  { label: 'Cambria', value: 'Cambria, Georgia, serif' },
  { label: 'Bookman', value: "'Bookman Old Style', serif" },
  { label: 'Courier New', value: "'Courier New', Courier, monospace" },
  { label: 'Consolas', value: 'Consolas, Menlo, monospace' },
  { label: 'Comic Sans MS', value: "'Comic Sans MS', 'Comic Sans', cursive" },
  { label: 'Impact', value: 'Impact, Haettenschweiler, sans-serif' },
  // --- Google Fonts (sans-serif) ---
  { label: 'Roboto', value: "'Roboto', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap' },
  { label: 'Open Sans', value: "'Open Sans', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap' },
  { label: 'Lato', value: "'Lato', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap' },
  { label: 'Montserrat', value: "'Montserrat', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap' },
  { label: 'Poppins', value: "'Poppins', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap' },
  { label: 'Inter', value: "'Inter', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap' },
  { label: 'Nunito', value: "'Nunito', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap' },
  { label: 'Raleway', value: "'Raleway', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Raleway:wght@400;700&display=swap' },
  { label: 'Work Sans', value: "'Work Sans', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;700&display=swap' },
  { label: 'Source Sans 3', value: "'Source Sans 3', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;700&display=swap' },
  { label: 'PT Sans', value: "'PT Sans', sans-serif", url: 'https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap' },
  { label: 'Rubik', value: "'Rubik', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Rubik:wght@400;700&display=swap' },
  { label: 'Karla', value: "'Karla', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Karla:wght@400;700&display=swap' },
  { label: 'Mulish', value: "'Mulish', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Mulish:wght@400;700&display=swap' },
  { label: 'Quicksand', value: "'Quicksand', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;700&display=swap' },
  { label: 'DM Sans', value: "'DM Sans', sans-serif", url: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&display=swap' },
  { label: 'Josefin Sans', value: "'Josefin Sans', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;700&display=swap' },
  { label: 'Ubuntu', value: "'Ubuntu', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;700&display=swap' },
  { label: 'Barlow', value: "'Barlow', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Barlow:wght@400;700&display=swap' },
  { label: 'Fira Sans', value: "'Fira Sans', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;700&display=swap' },
  // --- Google Fonts (serif) ---
  { label: 'Playfair Display', value: "'Playfair Display', serif", url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap' },
  { label: 'Merriweather', value: "'Merriweather', serif", url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap' },
  { label: 'Lora', value: "'Lora', serif", url: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;700&display=swap' },
  { label: 'Libre Baskerville', value: "'Libre Baskerville', serif", url: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap' },
  { label: 'EB Garamond', value: "'EB Garamond', serif", url: 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;700&display=swap' },
  { label: 'Cormorant Garamond', value: "'Cormorant Garamond', serif", url: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&display=swap' },
  { label: 'Bitter', value: "'Bitter', serif", url: 'https://fonts.googleapis.com/css2?family=Bitter:wght@400;700&display=swap' },
  // --- Google Fonts (display / monospace) ---
  { label: 'Oswald', value: "'Oswald', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&display=swap' },
  { label: 'Bebas Neue', value: "'Bebas Neue', cursive", url: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap' },
  { label: 'Pacifico', value: "'Pacifico', cursive", url: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap' },
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace", url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap' },
]

/** Recolecta los font-family usados en el documento (settings + bloques heading/text/menu). */
export function usedFontValues(doc: EmailDocument): Set<string> {
  const used = new Set<string>()
  used.add(doc.settings.fontFamily)
  for (const row of doc.rows) {
    for (const col of row.columns) {
      for (const block of col.blocks) {
        if ((block.type === 'heading' || block.type === 'text' || block.type === 'menu') && block.fontFamily) {
          used.add(block.fontFamily)
        }
      }
    }
  }
  return used
}

/** HTML de todos los bloques de texto, para detectar fuentes aplicadas por selección
 * (spans <span style="font-family:…"> que el editor genera al elegir una fuente en un
 * fragmento de texto en vez de en todo el bloque). */
function collectTextHtml(doc: EmailDocument): string {
  const parts: string[] = []
  for (const row of doc.rows) {
    for (const col of row.columns) {
      for (const block of col.blocks) {
        if (block.type === 'text') parts.push(block.html)
      }
    }
  }
  return parts.join('\n')
}

/** Primer nombre de familia de un stack de fuentes, sin comillas (p.ej. "'Roboto', sans-serif" → "Roboto"). */
function primaryFamilyName(value: string): string {
  return value.split(',')[0].trim().replace(/^['"]|['"]$/g, '')
}

/**
 * URLs de Google Fonts que hay que cargar para las fuentes usadas en el documento.
 * Para el HTML de bloques de texto se compara solo el nombre de familia (sin comillas):
 * el editor normaliza `'Roboto'` a comillas dobles (y luego a `&quot;` al serializar el
 * atributo), así que comparar el `value` completo con comillas simples nunca matchearía.
 */
export function usedFontUrls(doc: EmailDocument, fonts: FontDef[]): string[] {
  const used = usedFontValues(doc)
  const textHtml = collectTextHtml(doc)
  const urls = new Set<string>()
  for (const f of fonts) {
    if (!f.url) continue
    const name = primaryFamilyName(f.value)
    if (used.has(f.value) || (name && textHtml.includes(name))) urls.add(f.url)
  }
  return Array.from(urls)
}
