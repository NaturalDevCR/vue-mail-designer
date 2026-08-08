# Bloques personalizados

Además de los bloques built-in, podés registrar bloques propios que aparecen en la paleta con un inspector genérico (generado a partir de `fields`) y tu propio render en el HTML exportado.

```ts
import type { CustomBlockDef } from '@naturaldevcr/vue-mail-designer'

const promoBlock: CustomBlockDef = {
  type: 'promo-banner',
  label: 'Banner de promo',
  icon: '🏷️', // opcional
  defaultData: { text: 'Oferta especial', color: '#dc2626' },
  fields: [
    { key: 'text', label: 'Texto', type: 'text' },
    { key: 'color', label: 'Color de fondo', type: 'color' },
  ],
  render: (data) => `<div style="background:${data.color};padding:16px;text-align:center;">${data.text}</div>`,
}
```

```vue
<EmailBuilder ... :custom-blocks="[promoBlock]" />
```

## `CustomField`

Cada entrada de `fields` es un control simple en el inspector, ligado a una clave de `data`:

| `type` | Control |
|---|---|
| `text` | input de texto |
| `number` | input numérico |
| `color` | selector de color |
| `textarea` | textarea |

## `render(data)`

Recibe el `data` actual del bloque (arranca en `defaultData`, se actualiza con lo que el usuario edite en los `fields`) y devuelve el HTML crudo que va al export.

::: warning Seguridad
`render(data)` genera HTML crudo tal cual. Si ese `data` puede venir de un JSON importado desde fuera de tu control, escapá los valores antes de interpolarlos — la librería exporta `escapeHtml` para eso:

```ts
import { escapeHtml } from '@naturaldevcr/vue-mail-designer'

render: (data) => `<div>${escapeHtml(String(data.text))}</div>`
```
:::
