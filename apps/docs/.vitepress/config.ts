import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Vue Mail Designer',
  description: 'Visual drag & drop email builder for Vue 3, with email-client-compatible HTML export.',
  lang: 'en',
  base: '/vue-mail-designer/',
  cleanUrls: true,

  head: [['link', { rel: 'icon', href: '/vue-mail-designer/favicon.svg' }]],

  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Reference', link: '/reference/props' },
      { text: 'GitHub', link: 'https://github.com/NaturalDevCR/vue-mail-designer' },
      { text: 'npm', link: 'https://www.npmjs.com/package/@naturaldevcr/vue-mail-designer' },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Quickstart', link: '/guide/quickstart' },
          { text: 'Blocks', link: '/guide/blocks' },
          { text: 'Backgrounds', link: '/guide/backgrounds' },
          { text: 'Rich text editor', link: '/guide/rich-text' },
          { text: 'Chrome AI tools', link: '/guide/chrome-ai' },
          { text: 'Custom blocks', link: '/guide/custom-blocks' },
          { text: 'Importing from Unlayer', link: '/guide/unlayer-import' },
          { text: 'Email compatibility', link: '/guide/email-compatibility' },
          { text: 'Limitations', link: '/guide/limitations' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Props', link: '/reference/props' },
          { text: 'Events', link: '/reference/events' },
          { text: 'Methods (ref)', link: '/reference/methods' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/NaturalDevCR/vue-mail-designer' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@naturaldevcr/vue-mail-designer' },
    ],

    footer: {
      message: 'Released under the MIT License. <a href="/vue-mail-designer/llms.txt">llms.txt</a> for AI assistants.',
      copyright: 'Copyright © 2026 Josue',
    },

    search: { provider: 'local' },
  },
})
