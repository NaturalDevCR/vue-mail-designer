# Introducción

**Vue Mail Designer** (`@naturaldevcr/vue-mail-designer`) es un componente Vue 3 de edición visual de emails, estilo Unlayer: arrastrás bloques a un lienzo, los editás con un inspector de propiedades, y obtenés HTML compatible con clientes de correo (Outlook incluido) además de un JSON de diseño reeditable.

## ¿Para quién es esto?

Para integrar un editor de emails dentro de tu propia aplicación (un SaaS de marketing, un CRM, un builder de campañas) sin depender de un servicio externo. Vos controlás:

- **Dónde se guardan las imágenes** — implementás `uploadImage` y opcionalmente `mediaLibrary` contra tu propio storage.
- **Qué variables se pueden insertar** — `mergeTags` define las variables disponibles en el editor de texto.
- **Qué bloques aparecen** — la prop `tools` oculta, reordena o limita bloques de la paleta.
- **El look del editor** — `theme`, `appearance` y `locale` (español o inglés, o un diccionario propio).

## ¿Qué genera?

Dos salidas, ambas bajo tu control:

1. **HTML de email** (`exportHtml()` o el evento `export-html`) — tablas con estilos inline, ghost tables MSO para Outlook, media query para apilar columnas en mobile. Pensado para pegar directo en tu proveedor de envío (SES, SendGrid, Postmark, etc.).
2. **JSON de diseño** (`EmailDocument`, vía `getDesign()`/`loadDesign()` o `v-model:design`) — el modelo editable completo, para guardarlo en tu base de datos y volver a abrirlo en el editor.

## Próximos pasos

- [Instalación](/guide/installation)
- [Inicio rápido](/guide/quickstart)
- [Referencia de props](/reference/props)
