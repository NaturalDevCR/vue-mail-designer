# Importing from Unlayer

From the **Export → Import from Unlayer…** menu you can paste an Unlayer design JSON, or the URL of a template from their studio (e.g. `https://studio.unlayer.com/create/black-friday-laptop-deals`). The design is converted to our format (`EmailDocument`) and a list of warnings is shown for anything that couldn't be mapped.

## What gets warned about, not imported

- Unlayer-specific responsive styles (`_override.mobile`) — the importer doesn't yet generate equivalent mobile-only rules.
- Display conditions (`displayCondition`).
- Referenced Google Fonts — you need to load them yourself in your platform.
- Images served from Unlayer's CDN — they belong to Unlayer; you should replace them with your own assets. The converter warns about this automatically.

## Programmatic usage

```ts
import { unlayerToDocument, unlayerSlugFromUrl } from '@naturaldevcr/vue-mail-designer'

const { document, warnings } = unlayerToDocument(unlayerJson)
// document: EmailDocument, ready to load with loadDesign()/v-model:design
// warnings: string[] of anything that couldn't be mapped

const slug = unlayerSlugFromUrl('https://studio.unlayer.com/create/black-friday-laptop-deals')
// 'black-friday-laptop-deals'
```

## Importing by URL from the browser

The browser can't hit Unlayer's API directly due to CORS. Pass your own `unlayerFetch` that resolves against your backend/proxy:

```ts
async function unlayerFetch(slug: string): Promise<unknown> {
  const res = await fetch(`/api/unlayer-proxy/${slug}`)
  return res.json()
}
```

```vue
<EmailBuilder ... :unlayer-fetch="unlayerFetch" />
```

This repo's demo app uses a Vite proxy at `/unlayer-api` as a reference.

## Known fidelity notes

The importer was verified field-by-field against real templates from Unlayer's studio (not just the documented shape of the JSON). A few examples of non-obvious mappings it already covers:

- Image width lives in `src.maxWidth`/`src.autoWidth`, not in `values.width` (which stock templates ship as `null`).
- Menu padding separates `containerPadding` (block) from `padding` (each item, individually).
- `backgroundColor: ""` means "no color assigned", not a real color — a naive check would interpret it as a valid string and overwrite the factory `transparent`.
- `backgroundImage.size` is, in practice, the file's byte size, not a CSS keyword — it falls back to `auto` (natural size), same as Unlayer's own export.
