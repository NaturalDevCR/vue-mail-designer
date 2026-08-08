import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Vue Mail Designer',
  description: 'Email builder visual drag & drop para Vue 3, con export HTML compatible con clientes de correo.',
  lang: 'es',
  base: '/vue-mail-designer/',
  cleanUrls: true,

  head: [['link', { rel: 'icon', href: '/vue-mail-designer/favicon.svg' }]],

  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: 'Guía', link: '/guide/introduction' },
      { text: 'Referencia', link: '/reference/props' },
      { text: 'GitHub', link: 'https://github.com/NaturalDevCR/vue-mail-designer' },
      { text: 'npm', link: 'https://www.npmjs.com/package/@naturaldevcr/vue-mail-designer' },
    ],

    sidebar: [
      {
        text: 'Guía',
        items: [
          { text: 'Introducción', link: '/guide/introduction' },
          { text: 'Instalación', link: '/guide/installation' },
          { text: 'Inicio rápido', link: '/guide/quickstart' },
          { text: 'Bloques', link: '/guide/blocks' },
          { text: 'Fondos', link: '/guide/backgrounds' },
          { text: 'Editor de texto', link: '/guide/rich-text' },
          { text: 'Bloques personalizados', link: '/guide/custom-blocks' },
          { text: 'Importar de Unlayer', link: '/guide/unlayer-import' },
          { text: 'Compatibilidad de email', link: '/guide/email-compatibility' },
          { text: 'Limitaciones', link: '/guide/limitations' },
        ],
      },
      {
        text: 'Referencia',
        items: [
          { text: 'Props', link: '/reference/props' },
          { text: 'Eventos', link: '/reference/events' },
          { text: 'Métodos (ref)', link: '/reference/methods' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/NaturalDevCR/vue-mail-designer' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@naturaldevcr/vue-mail-designer' },
    ],

    footer: {
      message: 'Publicado bajo licencia MIT.',
      copyright: 'Copyright © 2026 Josue',
    },

    search: { provider: 'local' },
  },
})
