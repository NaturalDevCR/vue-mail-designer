# Events

| Event | Payload | When |
|---|---|---|
| `update:design` | `EmailDocument` | On every design change — the event that powers `v-model:design`. |
| `change` | `EmailDocument` | Same as `update:design`, for when you'd rather not use `v-model`. |
| `export-html` | `string` | When calling `exportHtml()` via `ref` — delivers the generated HTML. |
| `autosave-status` | `AutosaveStatusPayload` | When autosave changes status: `'disabled'`, `'idle'`, `'restoring'`, `'saving'`, `'saved'`, or `'error'`. |
| `autosave-saved` | `AutosaveSavedPayload` | After a save succeeds. Includes the saved design snapshot and `savedAt`. |
| `autosave-restored` | `AutosaveRestoredPayload` | After a saved draft is applied to the builder. Includes the restored design snapshot and `restoredAt`. |
| `autosave-error` | `AutosaveErrorPayload` | After a load or save failure. Includes `operation: 'load' | 'save'` and the thrown `error`. |

```vue
<template>
  <EmailBuilder
    v-model:design="design"
    @change="onChange"
    @export-html="onHtml"
    @autosave-status="onAutosaveStatus"
    @autosave-error="onAutosaveError"
  />
</template>

<script setup lang="ts">
function onChange(doc: EmailDocument) {
  // react to every document change
}

function onHtml(html: string) {
  // send or preview
}

function onAutosaveStatus(payload: AutosaveStatusPayload) {
  // update UI for saving, saved, or error states
}

function onAutosaveError(payload: AutosaveErrorPayload) {
  // log or surface adapter failures
}
</script>
```

See also [Autosave](/guide/autosave) for restore behavior and the full autosave payloads, and [Methods](/reference/methods) for `getAutosaveStatus()` and export helpers.
