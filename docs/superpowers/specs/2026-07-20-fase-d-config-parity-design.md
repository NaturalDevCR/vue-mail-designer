# Fase D — Configuración y paridad de API — Diseño

**Fecha:** 2026-07-20
**Contexto:** cuarta fase del roadmap. Principio transversal: clean-room (identidad/nombres/código propios). Esta fase da al integrador el control de configuración que ofrecen los builders comerciales, sin copiar su API — la nuestra es propia pero cubre los mismos casos de uso.

## Objetivo

Tres capacidades de configuración, todas vía props nuevas, retrocompatibles (sin prop → comportamiento actual):

1. **`tools`** — habilitar/deshabilitar, reordenar y limitar el uso de cada bloque de la paleta.
2. **`appearance`** — personalizar los colores del builder (acento, paneles, bordes, fondo) más allá de claro/oscuro.
3. **`locale`** — internacionalización: todos los textos de la UI salen de un diccionario; se incluyen `es` (default) y `en`; el integrador puede sobreescribir cualquier subconjunto.

## 1. Config de herramientas (`tools`)

```ts
type ToolConfig = { enabled?: boolean; position?: number; usageLimit?: number }
tools?: Partial<Record<BlockType, ToolConfig>>
```
- `enabled: false` → el bloque no aparece en la paleta Contenido (ni se puede arrastrar).
- `position` → orden en la grilla (los sin `position` van después, en el orden por defecto).
- `usageLimit` → máximo de instancias de ese tipo en el documento; alcanzado el límite, el ítem de paleta se ve deshabilitado (no arrastrable) con un tooltip.
- Se provee vía `BuilderOptions`; la paleta (`ContentTab`) y el canvas (drop) lo consultan. El conteo de uso se deriva del documento (recorrer bloques por tipo).

## 2. Apariencia (`appearance`)

```ts
type Appearance = { accent?: string; panel?: string; border?: string; background?: string; foreground?: string; muted?: string }
appearance?: Appearance
```
- Cada campo presente sobreescribe la variable CSS correspondiente (`--vmd-accent`, `--vmd-panel`, …) en el `.vmd-root` vía `:style`. Se aplica sobre el tema activo (claro/oscuro), así que el integrador puede ajustar solo el acento y dejar el resto.
- No afecta el canvas del email (sigue usando los colores del documento).

## 3. i18n (`locale`)

```ts
type Locale = { [key: string]: string }   // claves planas, ej. 'palette.heading', 'header.export'
locale?: 'es' | 'en' | Locale
```
- Todos los strings visibles de la UI pasan a claves. Un módulo `i18n/es.ts` y `i18n/en.ts` con los diccionarios completos.
- `locale` puede ser el nombre de un idioma incluido, o un objeto que se fusiona sobre `es` (default) — así el integrador traduce solo lo que quiera o agrega un idioma nuevo.
- Composable `useI18n()` que provee `t(key)`; se inyecta desde `EmailBuilder`. Los componentes reemplazan sus literales por `t('...')`.
- Alcance: se cubren los strings de header, canvas bar, paleta (labels de bloque), tabs del riel, títulos del inspector y labels de campos frecuentes, diálogos (preview, plantillas, import Unlayer). Los mensajes de error del import y las advertencias del conversor quedan en español por ahora (se anota como límite).

## Arquitectura / cambios

- `options.ts`: `BuilderOptions` gana `tools?`, `appearance?`, `locale?` (resuelto a diccionario). Tipos `ToolConfig`, `Appearance`.
- `i18n/` nuevo: `es.ts`, `en.ts`, `keys.ts` (tipo de claves), `useI18n.ts` (provide/inject + `t`).
- `EmailBuilder.vue`: acepta las 3 props; resuelve `locale` a diccionario (merge sobre es); provee i18n; aplica `appearance` como estilo inline en la raíz; incluye `tools` en las opciones.
- `ContentTab.vue`: filtra/ordena `PALETTE_BLOCKS` según `tools`; marca deshabilitados los que llegaron a `usageLimit` (contando en `store.doc`); labels vía `t()`.
- Componentes de UI (header, canvas bar, tabs, inspector, diálogos): literales → `t()`.
- `palette-items.ts`: los labels dejan de ser el texto final; se vuelven claves i18n (o se mapean).

## Testing

- `tools`: bloque `enabled:false` no aparece; `position` reordena; `usageLimit` deshabilita el ítem cuando el doc alcanza el límite (montar con un `design` que ya tenga N de ese tipo).
- `appearance`: las variables CSS de la raíz reflejan los overrides; el canvas del email no cambia.
- i18n: `locale:'en'` cambia los textos visibles (ej. header muestra "Templates"/"Export"); un `locale` objeto parcial sobreescribe solo esas claves y el resto queda en es; `t()` de una clave inexistente devuelve la clave (fallback visible, no crash).
- Retrocompat: sin ninguna prop nueva, todo se ve como hoy (es, colores del tema, todos los bloques).
- Suite + typecheck + build verdes.

## Fuera de alcance (a Fase E o futuro)

Custom tools/bloques del integrador, display conditions, i18n de mensajes de error/advertencias del conversor, RTL.

## Criterios de aceptación

- El integrador puede ocultar, reordenar y limitar bloques de la paleta con `tools`.
- El integrador puede cambiar el acento y los colores del builder con `appearance` sin tocar el canvas del email.
- Con `locale:'en'` la UI está en inglés; con un objeto parcial, se traduce solo lo indicado; una clave faltante nunca rompe.
- Sin props nuevas, el comportamiento es idéntico al actual (retrocompat).
- Suite + typecheck + build de librería y demo verdes.
