# Custom blocks

Besides the built-in blocks, you can register your own blocks that appear in the palette with a generic inspector (generated from `fields`) and your own render in the exported HTML. The generic inspector also includes the shared outer padding control, so custom blocks support the same Top/Right/Bottom/Left spacing behavior as built-in blocks.

```ts
import type { CustomBlockDef } from '@naturaldevcr/vue-mail-designer'

const promoBlock: CustomBlockDef = {
  type: 'promo-banner',
  label: 'Promo banner',
  icon: '🏷️', // optional
  defaultData: { text: 'Special offer', color: '#dc2626' },
  fields: [
    { key: 'text', label: 'Text', type: 'text' },
    { key: 'color', label: 'Background color', type: 'color' },
  ],
  render: (data) => `<div style="background:${data.color};padding:16px;text-align:center;">${data.text}</div>`,
}
```

```vue
<EmailBuilder ... :custom-blocks="[promoBlock]" />
```

## `CustomField`

Each entry in `fields` is a simple control in the inspector, tied to a `data` key:

| `type` | Control |
|---|---|
| `text` | text input |
| `number` | numeric input |
| `color` | color picker |
| `textarea` | textarea |

## `render(data)`

Receives the block's current `data` (starts at `defaultData`, updated as the user edits the `fields`) and returns the raw HTML that goes into the export.

::: warning Security
`render(data)` generates raw HTML as-is. If that `data` can come from a JSON imported from outside your control, escape the values before interpolating them — the library exports `escapeHtml` for that:

```ts
import { escapeHtml } from '@naturaldevcr/vue-mail-designer'

render: (data) => `<div>${escapeHtml(String(data.text))}</div>`
```
:::
