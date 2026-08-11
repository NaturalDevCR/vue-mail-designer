# Chrome AI tools

The rich text editor can expose optional Chrome built-in AI tools. These APIs are browser-provided and availability depends on the user's browser, device, and AI model access. The library does not provide a server-side fallback or require an API key.

## Enable the menu

Import the public `AiLanguage` type when configuring Translate targets:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  EmailBuilder,
  type AiLanguage,
  type EmailDocument,
} from '@naturaldevcr/vue-mail-designer'

const design = ref<EmailDocument>()
const aiLanguages: AiLanguage[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
]
</script>

<template>
  <EmailBuilder
    v-model:design="design"
    :ai="{ enabled: true, languages: aiLanguages }"
  />
</template>
```

`ai.enabled` controls whether the AI button is rendered in the rich text toolbar. It is `false` unless you enable it. `languages` is the list of target languages offered by Translate; each entry needs a language code and a display label.

The AI menu follows the builder's `locale` setting, so its labels and error messages are available in English and Spanish. See [Localization](/reference/props#locale) for the language configuration.

## Available actions

- **Rewrite** revises the selected text. It supports tone and length options.
- **Write** generates new text from a prompt. It does not require an existing selection and supports tone, length, and plain-text/Markdown format options.
- **Summarize** summarizes the selected text with a summary type and length.
- **Translate** translates the selected text into one of the configured target languages. The editor uses the browser's Language Detector when available and falls back to the current builder locale for the source language.

Rewrite, Summarize, and Translate require selected text. Actions whose browser APIs are unavailable are disabled. Translate also checks the selected source/target pair before allowing the request to run.

## Review and apply results

AI output is shown in an editable result field and does not change the email content immediately. Choose **Apply** to replace the selection, or insert generated text when there is no selection. Choose **Discard** or close the menu to leave the editor unchanged.

Requests can show model-download progress. Chrome manages the on-device model and normally downloads it only the first time it is needed; it may download again after an update or storage eviction. The library reuses Summarizer sessions for the same summary configuration during the page lifetime, while failed sessions are discarded so the next request can retry. Writer, Rewriter, and Translate sessions are released after each request.

## Browser availability

Chrome built-in AI APIs are experimental and may be unavailable, require model download, or support only some language pairs. Treat the AI menu as an optional enhancement: keep your editor usable when the APIs are missing, and do not assume that enabling the prop makes every action available.

The public demo includes a deterministic local preview fallback when the browser does not expose these APIs. This keeps the interaction available for evaluation; it is demo-only and is not included in the package or used as a production AI provider.

See the [`ai` prop](/reference/props#ai) for the public configuration shape.
