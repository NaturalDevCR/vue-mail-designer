# @vue-mail-designer/builder

Email builder visual drag & drop para Vue 3, estilo Unlayer. Genera HTML compatible con clientes de correo y JSON de diseño reeditable.

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
| `unlayerFetch` | `(slug: string) => Promise<unknown>` | Handler para cargar una plantilla de Unlayer por URL/slug; devuelve el JSON de diseño. Por defecto pega a su API (falla por CORS sin proxy). |
| `theme` | `'light' \| 'dark'` | Tema de la UI del builder. |

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

## Compatibilidad de email

El HTML usa tablas con estilos inline, ghost tables para Outlook y una media query para apilar columnas en móvil. Evita flex/grid/position.

## Limitaciones

- No importa HTML existente (solo JSON).
- Fondos de fila en Outlook: soporte parcial (sin VML full-bleed todavía).
- Los merge tags se emiten como `{{value}}`; el motor de tu plataforma los reemplaza.
- No se pueden reordenar columnas dentro de una fila (sí filas y bloques).
- `theme` solo acepta `'light' | 'dark'` (sin `'auto'`).
- Borde/radio de columna sin control dedicado en el inspector; el timer no anima sin un servicio de imagen del integrador.
