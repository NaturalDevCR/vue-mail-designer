# Limitaciones

Un resumen de lo que la librería **no** hace hoy, para que sepas si te sirve antes de integrarla:

- **No importa HTML** — el importador solo lee JSON (propio o de plantillas de Unlayer). No hay parser de HTML arbitrario a bloques.
- **Sin backend propio** — subida de imágenes, galería de medios y proxy de importación por URL de Unlayer son funciones que implementás vos. La librería no asume Firebase, S3, ni ningún storage particular.
- **Columnas no reordenables entre sí** — dentro de una fila, el orden de las columnas es fijo; sí podés reordenar filas y bloques dentro de una columna.
- **`theme` sin modo `'auto'`** — solo `'light' | 'dark'`, sin detección automática del sistema.
- **Borde/radio de columna sin UI** — el modelo y el export los soportan, pero el inspector todavía no tiene control para editarlos visualmente.
- **Outlook de escritorio**:
  - Fondo de fila con soporte parcial (sin VML full-bleed).
  - `borderRadius` de imagen ignorado (el de botón sí tiene fallback VML).
- **Timer sin animación propia** — necesita un servicio externo de imagen dinámica; sin él, cae a una caja estática con los días restantes.
- **Merge tags sin motor de reemplazo** — se emiten como `{{value}}` literal; el reemplazo real lo hace tu plataforma de envío al momento de mandar el correo.

Si alguna de estas te bloquea, o encontrás una diferencia de fidelidad al importar una plantilla real de Unlayer, [abrí un issue](https://github.com/NaturalDevCR/vue-mail-designer/issues).
