# Props

Todas opcionales.

| Prop | Tipo | Descripción |
|------|------|-------------|
| `design` | `EmailDocument` | Diseño del documento (`v-model:design`). Sin ella, el editor arranca en blanco. |
| `mergeTags` | `MergeTagItem[]` | Variables insertables en texto: `{ name, value }`, o grupos `{ name, tags: MergeTagDef[] }` (se muestran como optgroups). |
| `templates` | `EmailTemplate[]` | Plantillas extra, además de las incluidas por defecto. |
| `uploadImage` | `(file: File) => Promise<string>` | Handler de subida; devuelve la URL final. Sin esta prop, el bloque Imagen no puede subir archivos nuevos. |
| `imageSearch` | `(query: string) => Promise<ImageResult[]>` | Handler de búsqueda para la pestaña Imágenes; por defecto usa `openverseSearch` (Openverse, CC0/CC-BY). |
| `mediaLibrary` | `MediaLibraryOptions` | Habilita la pestaña "Galería": `{ list: (cursor?) => Promise<{ items: MediaItem[], nextCursor? }>, upload: (file) => Promise<MediaItem>, delete: (id) => Promise<void>, rename: (id, name) => Promise<MediaItem> }`. Sin esta prop, la pestaña no aparece. Vos implementás cada función contra tu propio storage — la librería no asume ningún backend. |
| `unlayerFetch` | `(slug: string) => Promise<unknown>` | Handler para cargar una plantilla de Unlayer por URL/slug; devuelve el JSON de diseño. Por defecto pega a la API pública de Unlayer (falla por CORS sin un proxy propio). |
| `theme` | `'light' \| 'dark'` | Tema de la UI del builder (no afecta el canvas del email). |
| `locale` | `'es' \| 'en' \| LocaleDict` | Idioma de la UI. Un objeto es un diccionario que se fusiona sobre el español — traducís solo las claves que quieras. |
| `appearance` | `Appearance` | Colores del builder: `accent`, `panel`, `border`, `background`, `foreground`, `muted`. Cada campo presente sobreescribe su variable CSS `--vmd-*`. |
| `tools` | `Partial<Record<BlockType, ToolConfig>>` | Config por bloque de la paleta: `{ enabled?, position?, usageLimit? }` para ocultar, reordenar o limitar instancias de un tipo de bloque. |
| `fonts` | `FontDef[]` | Lista de fuentes disponibles (`{ label, value, url? }`); las que traen `url` (Google Fonts) se cargan tanto en el canvas como en el HTML exportado. Por defecto, una lista curada. |
| `specialLinks` | `SpecialLink[]` | Enlaces predefinidos insertables desde el editor de texto (`{ name, href }`) — por ejemplo, un link de cancelar suscripción resuelto por tu plataforma de envío. |
| `customBlocks` | `CustomBlockDef[]` | Bloques propios del integrador — ver [Bloques personalizados](/guide/custom-blocks). |

Ver también [Eventos](/reference/events) y [Métodos](/reference/methods).
