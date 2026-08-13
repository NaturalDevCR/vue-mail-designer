# AI template generation

`EmailBuilder` can expose an AI workflow for generating complete email designs. The feature is provider-agnostic: you provide the `generate` function and decide whether it calls OpenAI, Anthropic, Kimi, OpenCode, a local model, or your own backend.

The library never stores API keys and never imports a provider SDK. Keep credentials on your server whenever possible.

## Enable the feature

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  EmailBuilder,
  type AiTemplateOptions,
  type AiTemplateProposal,
  type AiTemplateRequest,
  type EmailDocument,
} from '@naturaldevcr/vue-mail-designer'

const design = ref<EmailDocument>()

const aiContext = () => ({
  brandName: campaign.value.brandName,
  language: campaign.value.language,
  brandColors: campaign.value.colors,
  tone: campaign.value.tone,
})

const aiTemplates: AiTemplateOptions = {
  enabled: true,
  context: aiContext,
  generate,
}

async function generate(request: AiTemplateRequest): Promise<AiTemplateProposal[]> {
  const response = await fetch('/api/email-ai/templates', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) throw new Error('Template generation failed')
  return await response.json() as AiTemplateProposal[]
}
</script>

<template>
  <EmailBuilder v-model:design="design" :ai-templates="aiTemplates" />
</template>
```

The AI action appears in the builder header and as an `AI` tab in the side panel only when `enabled` is `true`. Both entry points use the same workflow and provider callback.

## Explicit create and edit modes

The user must choose one of these modes; the library never infers the operation from the prompt:

- **Create template** starts from a new `EmailDocument`.
- **Modify current design** sends a cloned copy of the current document and asks the provider to return the modified design.

The user also chooses whether to request 1, 2, or 3 proposals. The default is 1. Results are shown as email previews and nothing changes until the user selects **Use this design**.

Discarding, closing, or regenerating does not mutate the current design. Applying a proposal replaces the document through the normal `update:design`, `change`, and autosave flows.

## Dynamic context

Context is resolved when the user clicks **Generate**, not when `EmailBuilder` mounts. Pass a plain/reactive object or a function:

```ts
const aiTemplates: AiTemplateOptions = {
  enabled: true,
  context: {
    brandName: 'Hotel Poco a Poco',
    language: 'es',
  },
  generate,
}
```

```ts
const aiTemplates: AiTemplateOptions = {
  enabled: true,
  context: async () => ({
    userId: currentUser.id,
    campaignId: campaign.value.id,
    brand: await loadCurrentBrand(campaign.value.brandId),
  }),
  generate,
}
```

This is useful for campaign-specific copy, current permissions, locale, brand rules, merge-tag policies, or any data that can change while the editor stays mounted.

## Provider request

The callback receives:

```ts
type AiTemplateRequest = {
  mode: 'create' | 'edit'
  prompt: string
  count: 1 | 2 | 3
  currentDesign?: EmailDocument
  context: Record<string, unknown>
  designer: {
    schemaVersion: 1
    supportedBlocks: BlockType[]
    customBlocks: AiTemplateCustomBlock[]
    mergeTags: MergeTagItem[]
  }
}
```

`currentDesign` exists only in edit mode. `designer` describes the blocks and merge tags available in this editor instance, so your adapter can build model instructions without hard-coding a particular provider. Custom block descriptors omit the runtime `render` function; the model should use their `type`, fields, and data shape.

Your backend can turn this structured request into the provider-specific system/developer prompt. Instruct the model to return only the requested proposal envelope and valid `EmailDocument` JSON. The package validates every returned design with its schema before previewing it and rejects custom block types that are not registered in the current editor.

## Provider response

Return one to three proposals:

```ts
type AiTemplateProposal = {
  title: string
  description?: string
  design: EmailDocument
}
```

The package rejects an empty response, malformed design JSON, and unknown custom block types. The `generate` callback may return fewer proposals than requested.

## Errors

Listen to `ai-templates-error` when the host needs telemetry or an error boundary:

```vue
<EmailBuilder
  :ai-templates="aiTemplates"
  @ai-templates-error="onAiTemplatesError"
/>
```

The payload is:

```ts
type AiTemplateErrorPayload = {
  operation: 'context' | 'generate' | 'validate'
  error: unknown
}
```

The visible message is intentionally generic. The original error is available only through this event and is never logged by the library.

## Security guidance

- Do not put OpenAI, Anthropic, Kimi, or other provider API keys in the `EmailBuilder` props or browser bundle.
- Authenticate and authorize the host backend before it forwards a request to a model provider.
- Treat prompts, context, current designs, and generated HTML as untrusted data.
- Keep `html` blocks disabled in your provider instructions unless your application explicitly needs them.
- Review generated links, merge tags, image URLs, and copy before sending an email.

The demo includes a deterministic local adapter so the UI can be evaluated without network access or credentials. It is not a model-quality fallback.
