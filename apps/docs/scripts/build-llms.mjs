// Generates public/llms.txt and public/llms-full.txt from the real guide/reference pages,
// so the LLM-facing docs never drift from what a human reader sees on the site. Run via
// `pnpm --filter docs build` (wired in package.json's prebuild) or standalone with
// `node scripts/build-llms.mjs`.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(fileURLToPath(import.meta.url)) + '/..'
const SITE = 'https://naturaldevcr.github.io/vue-mail-designer'

/** Orden de lectura: mismo orden que el sidebar en .vitepress/config.ts. */
const GUIDE = [
  ['introduction', 'Introduction', 'What the library is, who it is for, and what it generates.'],
  ['installation', 'Installation', 'Package install, peer dependencies, and the stylesheet import.'],
  ['quickstart', 'Quickstart', 'Minimal working component, plus the optional media library setup.'],
  ['blocks', 'Blocks', 'The block palette, shared inspector properties, and per-block notes.'],
  ['backgrounds', 'Backgrounds', 'Body, row, and column backgrounds — color, image, size, position.'],
  ['rich-text', 'Rich text editor', 'Formatting, merge tags, link color inheritance, special links.'],
  ['custom-blocks', 'Custom blocks', 'Registering integrator-defined blocks: fields, defaultData, render().'],
  ['unlayer-import', 'Importing from Unlayer', 'Converting an Unlayer design JSON/URL to this library’s format, and known field-mapping details.'],
  ['email-compatibility', 'Email compatibility', 'The HTML techniques used (ghost tables, VML, media queries) and known limitations.'],
  ['limitations', 'Limitations', 'A blunt list of what the library does not do today.'],
]

const REFERENCE = [
  ['props', 'Props', 'Every EmailBuilder prop, its type, and what it does.'],
  ['events', 'Events', 'update:design, change, export-html.'],
  ['methods', 'Methods (ref)', 'exportHtml, exportJson, getDesign, loadDesign, exportImage.'],
]

/** Saca contenedores/sintaxis propios de VitePress, dejando markdown plano. */
function stripVitepressSyntax(md) {
  return md
    .replace(/^::: ?(tip|warning|danger|info)[^\n]*\n/gm, '')
    .replace(/^::: code-group\s*$/gm, '')
    .replace(/^:::\s*$/gm, '')
    // ```bash [pnpm] → ```bash — el sufijo [nombre] es la etiqueta de tab de code-group
    .replace(/^```(\w+) \[[^\]]+\]/gm, '```$1')
}

function readPage(dir, slug) {
  const raw = readFileSync(path.join(root, dir, `${slug}.md`), 'utf8')
  // el título ya lo agrega buildLlmsFullTxt() como "# {title}" — sacar el H1 propio de la
  // página para no duplicarlo.
  const withoutOwnH1 = raw.replace(/^# .+\n+/, '')
  return stripVitepressSyntax(withoutOwnH1).trim()
}

function buildLlmsTxt() {
  const guideLinks = GUIDE.map(([slug, title, desc]) => `- [${title}](${SITE}/guide/${slug}): ${desc}`).join('\n')
  const refLinks = REFERENCE.map(([slug, title, desc]) => `- [${title}](${SITE}/reference/${slug}): ${desc}`).join('\n')

  return `# Vue Mail Designer

> A visual drag & drop email builder for Vue 3. Drag blocks onto a canvas, edit them with a properties inspector, and export email-client-compatible HTML (Outlook included) plus a re-editable design JSON. Published as \`@naturaldevcr/vue-mail-designer\` on npm.

The library exposes one main component, \`EmailBuilder\`, driven entirely by props/events/exposed methods — no global config, no required backend. Image storage, media library, and Unlayer-URL-import proxying are all integrator-supplied functions; the library assumes no particular backend.

For the complete content of every page below in a single file, see [llms-full.txt](${SITE}/llms-full.txt).

## Guide

${guideLinks}

## Reference

${refLinks}

## Optional

- [Source repository](https://github.com/NaturalDevCR/vue-mail-designer): monorepo, includes the demo app and this docs site.
- [npm package](https://www.npmjs.com/package/@naturaldevcr/vue-mail-designer)
`
}

function buildLlmsFullTxt() {
  const sections = []
  sections.push(`# Vue Mail Designer — full documentation

> A visual drag & drop email builder for Vue 3. Published as \`@naturaldevcr/vue-mail-designer\` on npm. This file concatenates every guide and reference page verbatim, for feeding to an LLM in one shot. Source of truth: ${SITE}/`)

  for (const [slug, title] of GUIDE) {
    const body = readPage('guide', slug)
    sections.push(`\n\n---\n\n# ${title}\n\nSource: ${SITE}/guide/${slug}\n\n${body}`)
  }
  for (const [slug, title] of REFERENCE) {
    const body = readPage('reference', slug)
    sections.push(`\n\n---\n\n# ${title}\n\nSource: ${SITE}/reference/${slug}\n\n${body}`)
  }
  return sections.join('')
}

mkdirSync(path.join(root, 'public'), { recursive: true })
writeFileSync(path.join(root, 'public/llms.txt'), buildLlmsTxt())
writeFileSync(path.join(root, 'public/llms-full.txt'), buildLlmsFullTxt())
console.log('wrote public/llms.txt and public/llms-full.txt')
