# Bloques

La paleta incluye: **Título**, **Texto** (editor enriquecido), **Imagen**, **Botón**, **Divisor**, **Espacio**, **Redes**, **Menú**, **HTML**, **Video**, **Tabla**, **Galería** y **Timer** (cuenta regresiva).

## Propiedades comunes

La mayoría de los bloques comparten, en su inspector:

- **Padding** — vinculado por defecto (un solo valor para los 4 lados); un botón de cadena lo desvincula para editar cada lado por separado.
- **Alineación** — izquierda/centro/derecha, donde aplica.
- **Ocultar por dispositivo** — `hideDesktop`/`hideMobile`, por bloque y por fila. El HTML exportado usa clases + media query, no JS.

## Timer

Cuenta regresiva a una fecha. Dos modos:

- **Imagen dinámica del integrador**: le pasás una función que genera la imagen del contador (típicamente un servicio externo tipo countdownmail).
- **Caja estática**: sin esa función, muestra los días restantes en texto plano — funciona en cualquier cliente, sin animación.

## Tabla y Galería

- **Tabla** — filas/columnas de celdas de texto simple, con padding y tamaño de fuente configurables.
- **Galería** — grilla de 2 a 4 imágenes; cada ítem acepta arrastrar una imagen encima (desde la pestaña Imágenes/Galería, o moviendo una imagen ya puesta en el lienzo) para reemplazarla.

## Bloques personalizados

Además de los bloques built-in, podés registrar los tuyos — ver [Bloques personalizados](/guide/custom-blocks).

## Radio de esquinas en Outlook

El `borderRadius` del bloque Imagen se renderiza con CSS `border-radius` y además con VML `<v:roundrect>` para Outlook de escritorio en botones con ancho fijo — ver [Compatibilidad de email](/guide/email-compatibility).
