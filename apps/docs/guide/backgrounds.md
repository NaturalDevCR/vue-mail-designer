# Fondos

## Fondo del cuerpo

El **color y la imagen de fondo del cuerpo del email** se editan en la pestaña **Cuerpo** del inspector (`settings.backgroundColor` / `settings.backgroundImage`). Es el fondo que se ve detrás de todo el documento.

## Fondo por fila y columna

Las **filas son transparentes por defecto** para que el fondo del cuerpo se vea a través. Cada fila y cada columna puede tener su propio color e imagen de fondo, independientes del cuerpo.

Para una imagen de fondo de fila:

- **`url`** — la imagen.
- **`repeat`** — `no-repeat` / `repeat` / `repeat-x` / `repeat-y`.
- **`size`** — `auto` (tamaño natural, no se estira), `cover` (llena el contenedor, puede recortar) o `contain` (entra completa, puede dejar franjas).
- **`position`** — posición CSS estándar (ej. `center`, `top center`).
- **Ancho del contenedor** — "Contenido" (queda acotada al `contentWidth` del body, centrada) o "Ancho completo" (sangra hasta los bordes del email, independiente del ancho de contenido).

::: tip Importar de Unlayer
Al importar una plantilla de Unlayer, `size` casi nunca llega como palabra clave CSS — Unlayer manda ahí el peso del archivo en bytes. El importador lo detecta y cae a `auto` (tamaño natural), que es lo mismo que exporta Unlayer cuando no manda `background-size` explícito.
:::

## Outlook

El soporte de fondo de fila en Outlook de escritorio es parcial — ver [Compatibilidad de email](/guide/email-compatibility).
