# @vue-mail-designer/builder

Email builder visual drag & drop para Vue 3, estilo Unlayer. Genera HTML compatible con clientes de correo y JSON de diseño reeditable.

📖 **[Documentación completa](https://naturaldevcr.github.io/vue-mail-designer/)** · [Repositorio](https://github.com/NaturalDevCR/vue-mail-designer)

## Instalación

```bash
pnpm add @vue-mail-designer/builder vue pinia
```

## Uso básico

```vue
<template>
  <EmailBuilder
    v-model:design="design"
    :merge-tags="mergeTags"
    :upload-image="uploadImage"
    :media-library="mediaLibrary"
    @export-html="onHtml"
  />
</template>

<script setup lang="ts">
import { EmailBuilder, type EmailDocument, type MergeTagDef } from '@vue-mail-designer/builder'
import '@vue-mail-designer/builder/style.css'
import { ref } from 'vue'

const design = ref<EmailDocument>()
const mergeTags: MergeTagDef[] = [{ name: 'Nombre', value: 'first_name' }]

async function uploadImage(file: File): Promise<string> {
  // subí el archivo a tu CDN y devolvé la URL
  return 'https://cdn.tu-dominio.com/...'
}

const mediaLibrary = {
  async list(cursor?: string) {
    // listá tu bucket (ej. Firebase Storage) paginado por cursor
    return { items: [], nextCursor: undefined }
  },
  async upload(file: File) {
    // subí el archivo y devolvé el MediaItem completo (id, url, thumbnailUrl, name)
    return { id: 'x', url: '...', thumbnailUrl: '...', name: file.name }
  },
  async delete(id: string) {
    // borrá el archivo de tu bucket
  },
  async rename(id: string, name: string) {
    // renombrá el archivo y devolvé el MediaItem actualizado
    return { id, url: '...', thumbnailUrl: '...', name }
  },
}

function onHtml(html: string) {
  // guardá o enviá el HTML
}
</script>
```

## Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `design` | `EmailDocument` | Diseño (v-model). |
| `mergeTags` | `MergeTagDef[]` | Variables insertables en texto (`{ name, value }`). |
| `templates` | `EmailTemplate[]` | Plantillas extra además de las incluidas. |
| `uploadImage` | `(file: File) => Promise<string>` | Handler de subida; devuelve la URL final. |
| `imageSearch` | `(query: string) => Promise<ImageResult[]>` | Handler de búsqueda para la pestaña Imágenes; por defecto usa `openverseSearch`. |
| `mediaLibrary` | `MediaLibraryOptions` | Habilita la pestaña "Galería": `{ list: (cursor?) => Promise<{ items: MediaItem[], nextCursor? }>, upload: (file) => Promise<MediaItem>, delete: (id) => Promise<void>, rename: (id, name) => Promise<MediaItem> }`. Sin esta prop, la pestaña no aparece. Todas las funciones las implementa el integrador contra su propio storage (ej. Firebase Storage); la librería no asume ningún backend. |
| `unlayerFetch` | `(slug: string) => Promise<unknown>` | Handler para cargar una plantilla de Unlayer por URL/slug; devuelve el JSON de diseño. Por defecto pega a su API (falla por CORS sin proxy). |
| `theme` | `'light' \| 'dark'` | Tema de la UI del builder. |
| `locale` | `'es' \| 'en' \| LocaleDict` | Idioma de la UI. Objeto = diccionario de claves que se fusiona sobre el español (traduce solo lo que quieras). |
| `appearance` | `Appearance` | Colores del builder: `accent`, `panel`, `border`, `background`, `foreground`, `muted`. Cada campo presente sobreescribe su variable CSS; no afecta el canvas del email. |
| `tools` | `Partial<Record<BlockType, ToolConfig>>` | Config por bloque de la paleta: `{ enabled?, position?, usageLimit? }` para ocultar, reordenar o limitar instancias. |
| `fonts` | `FontDef[]` | Lista de fuentes (`{ label, value, url? }`); las Google Fonts (`url`) se cargan en el canvas y en el HTML exportado. Por defecto una lista curada. |
| `specialLinks` | `SpecialLink[]` | Enlaces especiales insertables desde el editor (`{ name, href }`, ej. cancelar suscripción). |
| `customBlocks` | `CustomBlockDef[]` | Bloques propios del integrador (`{ type, label, icon?, defaultData, fields, render }`); aparecen en la paleta con inspector genérico y render en el export. |

`mergeTags` acepta además grupos: `{ name, tags: MergeTagDef[] }` (se muestran como optgroups en el editor).

> **Seguridad de bloques custom:** tu `render(data)` genera HTML crudo. Si `data` puede venir de un JSON importado, escapá los valores (la librería exporta `escapeHtml`) para evitar inyección.

## Métodos extra (via ref)

- `exportImage(): Promise<string>` — PNG (data URL) del diseño. Limitación: imágenes de otro origen (CORS) pueden impedir la captura.
- Versiones: desde **EXPORTAR → Versiones…** se guardan/cargan/borran versiones nombradas (en memoria durante la sesión).

## Fondos

El **color y la imagen de fondo del cuerpo** se editan en la pestaña **Cuerpo** (`settings.backgroundColor` / `settings.backgroundImage`). Las filas son transparentes por defecto para que el fondo del cuerpo se vea a través; cada fila y columna puede tener su propio color/imagen de fondo.

## Editor de texto

El editor enriquecido incluye negrita, cursiva, subrayado, tachado, listas (viñeta/numerada), alineación, **color de texto**, **tamaño de fuente**, enlaces, variables (merge tags) y limpiar formato.

## Importar de Unlayer

Desde el menú **EXPORTAR → Importar de Unlayer…** puedes pegar el JSON de diseño de Unlayer o la URL de una plantilla de su studio (ej. `https://studio.unlayer.com/create/...`). El diseño se convierte a nuestro formato y se muestra una lista de advertencias con lo que no se pudo mapear (estilos responsive específicos, condiciones de visualización, fuentes de Google, etc.).

- **Programático:** `unlayerToDocument(json)` devuelve `{ document, warnings }`; `unlayerSlugFromUrl(url)` extrae el slug.
- **Por URL:** el navegador no puede pegar directamente a la API de Unlayer por CORS. Pasa un `unlayerFetch` que use tu backend/proxy (la app de demo usa un proxy de Vite en `/unlayer-api`).
- **Assets:** las imágenes de las plantillas de Unlayer viven en su CDN y les pertenecen; reemplázalas por tus propios assets. El conversor lo advierte automáticamente.

## Eventos

- `update:design` — en cada cambio del diseño.
- `change` — igual que arriba, sin v-model.
- `export-html` — al llamar `exportHtml()`; entrega el HTML.

## Métodos (via ref)

- `exportHtml(): string`
- `exportJson(): string`
- `getDesign(): EmailDocument`
- `loadDesign(doc: EmailDocument): void`

## Bloques

Título, Texto (editor enriquecido), Imagen, Botón, Divisor, Espacio, Redes, Menú, HTML, Video, **Tabla**, **Galería** y **Timer** (cuenta regresiva: imagen dinámica del integrador, o caja estática con los días restantes).

## Propiedades ricas

- **Ocultar por dispositivo** por bloque y por fila (`hideDesktop` / `hideMobile`) — el HTML exportado usa clases + media query.
- **Imagen de fondo** por fila (`url`, `repeat`, `size`, `position`).
- **Fuente propia** por bloque de título/texto (además de la fuente del documento).
- Borde y radio por columna (soportados en el modelo y el HTML; sin control dedicado en el inspector todavía).
- **Recorte de imagen** (botón "Recortar" en el inspector de un bloque imagen, visible solo con `uploadImage` configurado) — aspect ratio, rotar/flip, enderezar y radio de esquinas (`borderRadius`); el resultado se sube vía `uploadImage`.

## Compatibilidad de email

El HTML usa tablas con estilos inline, ghost tables para Outlook y una media query para apilar columnas en móvil. Evita flex/grid/position.

## Limitaciones

- No importa HTML existente (solo JSON).
- Fondos de fila en Outlook: soporte parcial (sin VML full-bleed todavía).
- Los merge tags se emiten como `{{value}}`; el motor de tu plataforma los reemplaza.
- No se pueden reordenar columnas dentro de una fila (sí filas y bloques).
- `theme` solo acepta `'light' | 'dark'` (sin `'auto'`).
- Borde/radio de columna sin control dedicado en el inspector; el timer no anima sin un servicio de imagen del integrador.
- El radio de esquinas (`borderRadius`) del bloque imagen se renderiza con CSS `border-radius`; Outlook de escritorio (motor Word) lo ignora, así que las esquinas redondeadas se ven bien en el builder y en la mayoría de los clientes pero no en Outlook desktop.
