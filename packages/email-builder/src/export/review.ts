export type EmailReview = {
  missingAlt: { position: number; label?: string }[]
  variables: { name: string; configured: boolean }[]
}

const mergeVariable = /(?<!\{)\{\{\s*([\p{L}\p{N}_][\p{L}\p{N}_.-]*)\s*\}\}(?!\})/gu

export function mergeVariableNames(value: string): string[] {
  return Array.from(value.matchAll(mergeVariable), (match) => match[1])
}

function imageLabel(image: HTMLImageElement): string | undefined {
  const src = image.getAttribute('src')?.trim()
  const filename = src && !/^(data|blob):/i.test(src) ? src.split(/[?#]/, 1)[0].split('/').at(-1) : undefined
  return (image.getAttribute('title')?.trim() || filename)?.slice(0, 80)
}

export function reviewEmailHtml(html: string, configuredVariables: ReadonlySet<string> = new Set()): EmailReview {
  // Parsing in a detached template keeps email markup inert while inspecting it.
  const template = document.createElement('template')
  template.innerHTML = html

  const missingAlt: EmailReview['missingAlt'] = []
  for (const [index, image] of Array.from(template.content.querySelectorAll('img')).entries()) {
    const role = image.getAttribute('role')?.trim().toLowerCase()
    if (image.alt.trim() || role === 'presentation' || role === 'none' || image.closest('[aria-hidden="true" i]')) continue
    missingAlt.push({ position: index + 1, label: imageLabel(image) })
  }

  const names = new Set<string>()
  const addVariables = (value: string) => {
    for (const name of mergeVariableNames(value)) names.add(name)
  }
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => node instanceof Element && node.matches('script, style, template')
      ? NodeFilter.FILTER_REJECT
      : NodeFilter.FILTER_ACCEPT,
  })

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node instanceof Element) {
      for (const attribute of node.attributes) addVariables(attribute.value)
    } else {
      addVariables(node.nodeValue ?? '')
    }
  }

  return {
    missingAlt,
    variables: Array.from(names, (name) => ({ name, configured: configuredVariables.has(name) })),
  }
}
