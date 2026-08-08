# Compatibilidad de email

El HTML exportado está pensado para clientes de correo, no para navegadores: usa tablas con estilos inline, evita `flex`/`grid`/`position`, y agrega ghost tables condicionales para Outlook (motor Word).

## Técnicas usadas

- **Tablas de presentación** (`role="presentation"`) para todo el layout — columnas, padding, alineación.
- **Ghost tables MSO** (`<!--[if mso]>...<![endif]-->`) para que Outlook de escritorio calcule anchos en píxeles donde el resto de los clientes usan `%`/`max-width`.
- **Media query** única para apilar columnas en mobile (`@media (max-width: 480px)`) y para las clases de ocultar por dispositivo.
- **VML** (`<v:roundrect>`) en botones de ancho fijo, para lograr esquinas redondeadas también en Outlook de escritorio — la única forma de conseguirlo ahí.
- **`font-size:0;line-height:0`** en divisores y separadores, para evitar el hueco en blanco que deja `display:inline-block` en el layout de línea.

## Limitaciones conocidas

- No importa HTML existente — solo JSON (propio o de Unlayer).
- Fondos de fila: soporte parcial en Outlook de escritorio (sin VML full-bleed todavía).
- Los merge tags se emiten como `{{value}}` — el motor de tu plataforma de envío los reemplaza; la librería no interpola nada.
- No se pueden reordenar columnas dentro de una fila (sí se pueden reordenar filas y bloques).
- `theme` acepta solo `'light' | 'dark'` (sin `'auto'`).
- Borde/radio de columna: soportados en el modelo y el HTML exportado, pero sin control dedicado en el inspector todavía.
- El `borderRadius` del bloque Imagen usa CSS `border-radius` — se ve bien en el builder y en la mayoría de los clientes, pero Outlook de escritorio (motor Word) lo ignora.
- El timer no anima sin un servicio de imagen dinámica del integrador — sin él, muestra una caja estática con los días restantes.

## Ver también

- [Fondos](/guide/backgrounds) — imagen/color de fondo por fila y columna.
- [Importar de Unlayer](/guide/unlayer-import) — qué se advierte al convertir una plantilla.
