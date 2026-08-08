# Importar de Unlayer

Desde el menú **Exportar → Importar de Unlayer…** podés pegar el JSON de diseño de una plantilla de Unlayer, o la URL de una plantilla de su studio (ej. `https://studio.unlayer.com/create/black-friday-laptop-deals`). El diseño se convierte a nuestro formato (`EmailDocument`) y se muestra una lista de advertencias con lo que no se pudo mapear.

## Qué se advierte, no se importa

- Estilos responsive específicos de Unlayer (`_override.mobile`) — hoy el importador no genera reglas mobile-only equivalentes.
- Condiciones de visualización (`displayCondition`).
- Fuentes de Google referenciadas — hay que cargarlas vos en tu plataforma.
- Imágenes servidas desde el CDN de Unlayer — les pertenecen a ellos; conviene reemplazarlas por tus propios assets. El conversor lo advierte automáticamente.

## Uso programático

```ts
import { unlayerToDocument, unlayerSlugFromUrl } from '@vue-mail-designer/builder'

const { document, warnings } = unlayerToDocument(unlayerJson)
// document: EmailDocument listo para cargar con loadDesign()/v-model:design
// warnings: string[] con lo que no se pudo mapear

const slug = unlayerSlugFromUrl('https://studio.unlayer.com/create/black-friday-laptop-deals')
// 'black-friday-laptop-deals'
```

## Importar por URL desde el navegador

El navegador no puede pegarle directo a la API de Unlayer por CORS. Pasá un `unlayerFetch` propio que resuelva contra tu backend/proxy:

```ts
async function unlayerFetch(slug: string): Promise<unknown> {
  const res = await fetch(`/api/unlayer-proxy/${slug}`)
  return res.json()
}
```

```vue
<EmailBuilder ... :unlayer-fetch="unlayerFetch" />
```

La app de demo de este repo usa un proxy de Vite en `/unlayer-api` como referencia.

## Fidelidad conocida

El importador se verificó campo a campo contra plantillas reales del studio de Unlayer (no solo contra la forma documentada del JSON). Algunos ejemplos de mapeos no obvios que ya cubre:

- El ancho de imagen vive en `src.maxWidth`/`src.autoWidth`, no en `values.width` (que las plantillas stock traen en `null`).
- El padding del menú separa `containerPadding` (bloque) de `padding` (cada ítem, individualmente).
- `backgroundColor: ""` significa "sin color asignado", no un color real — un chequeo ingenuo lo interpretaba como string válida y pisaba el `transparent` de fábrica.
- `backgroundImage.size` en la práctica es el peso del archivo en bytes, no una palabra clave CSS — cae a `auto` (tamaño natural), como hace el propio export de Unlayer.
