# Autosave

`EmailBuilder` can persist the current `EmailDocument` for you through the `autosave` prop. The library stores only the design JSON snapshot. You choose where it goes: browser storage with a stable key, or your own remote adapter.

## Local storage

Use `type: 'local'` when you want the browser to keep a draft between mounts:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { EmailBuilder, type EmailDocument } from '@naturaldevcr/vue-mail-designer'

const design = ref<EmailDocument>()
const campaignId = 'spring-launch'
const autosaveKey = computed(() => `campaign:${campaignId}:draft`)
</script>

<template>
  <EmailBuilder
    v-model:design="design"
    :autosave="{
      enabled: true,
      storage: { type: 'local', key: autosaveKey },
      mode: 'debounce',
      delay: 1500,
      restore: true,
    }"
  />
</template>
```

Use a key that stays stable for the same host record (`campaign:${campaignId}:draft`, `template:${templateId}:draft`, and so on). A random key per mount creates a new draft every time, so restore cannot find the previous save.

`storage` is optional for local autosave. When omitted, the builder uses `window.localStorage`. Pass `storage` only when you need a different `Storage` object.

## Custom adapters

Use `type: 'custom'` when the draft belongs in your own backend:

```vue
<script setup lang="ts">
import { EmailBuilder, type AutosaveOptions, type EmailDocument } from '@naturaldevcr/vue-mail-designer'

const autosave: AutosaveOptions = {
  enabled: true,
  storage: {
    type: 'custom',
    async load() {
      const response = await fetch('/api/campaigns/spring-launch/autosave')
      if (response.status === 404) return undefined
      return await response.json() as EmailDocument
    },
    async save(document) {
      await fetch('/api/campaigns/spring-launch/autosave', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(document),
      })
    },
  },
  restore: true,
  restorePrecedence: 'saved-design',
}
</script>

<template>
  <EmailBuilder :autosave="autosave" />
</template>
```

`load` is optional. A save-only adapter is valid when you want remote persistence without automatic restoration:

```ts
const autosave: AutosaveOptions = {
  enabled: true,
  storage: {
    type: 'custom',
    async save(document) {
      await fetch('/api/campaigns/spring-launch/autosave', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(document),
      })
    },
  },
}
```

The public storage shapes are:

```ts
type AutosaveStorage =
  | {
      type: 'local'
      key: string
      storage?: Storage
    }
  | {
      type: 'custom'
      load?: () => Promise<EmailDocument | undefined> | EmailDocument | undefined
      save: (document: EmailDocument) => Promise<void> | void
    }
```

## Save modes and defaults

`autosave.mode` controls when the builder writes a snapshot:

| Mode | Behavior | Default `delay` |
|---|---|---|
| `'change'` | Saves every design change, one snapshot at a time, without overlapping saves. | `0` |
| `'debounce'` | Waits until changes stop, then saves only the latest snapshot. This is the default mode. | `1000` ms |
| `'interval'` | Saves the latest dirty snapshot on a repeating interval, and skips ticks when nothing changed. | `5000` ms |

`delay` is optional for every mode. If you omit it, the builder uses the defaults above.

## Restore and precedence

`restore` defaults to `false` (off). Set `restore: true` to enable restoration when autosave is configured:

- Local storage always tries to read from the configured key.
- Custom storage reads only when you provide `load`.

When `restore` is off, no saved draft replaces the initial design.

`restorePrecedence` decides whether a found draft replaces the current design after restoration is enabled:

| Value | Result |
|---|---|
| `'initial-design'` | Default. The current builder design stays authoritative even if a saved draft exists. |
| `'saved-design'` | A found draft is applied to the builder, then emitted through `autosave-restored`. |

This matters when you mount the builder with an existing `design` prop. If your host application treats that design as the source of truth, keep the default `'initial-design'`. If the autosaved draft should win, set `'saved-design'`.

If a slow restore is still loading and the user edits the design first, the live edit wins and the late restore is ignored.

## Events and status

Autosave adds four events:

| Event | Payload | When |
|---|---|---|
| `autosave-status` | `AutosaveStatusPayload` | Whenever the autosave status changes. |
| `autosave-saved` | `AutosaveSavedPayload` | After a save succeeds. |
| `autosave-restored` | `AutosaveRestoredPayload` | After a saved draft is applied to the builder. |
| `autosave-error` | `AutosaveErrorPayload` | After a load or save failure. |

The status payload exposes:

```ts
type AutosaveStatus =
  | 'disabled'
  | 'idle'
  | 'restoring'
  | 'saving'
  | 'saved'
  | 'error'
```

You can also read the current status through the exposed `getAutosaveStatus()` method:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { EmailBuilder, type AutosaveStatusPayload } from '@naturaldevcr/vue-mail-designer'

const builder = ref<InstanceType<typeof EmailBuilder>>()

function onAutosaveStatus(payload: AutosaveStatusPayload) {
  console.log(payload.status, builder.value?.getAutosaveStatus())
}
</script>

<template>
  <EmailBuilder
    ref="builder"
    :autosave="{ enabled: true, storage: { type: 'local', key: 'campaign:spring-launch:draft' } }"
    @autosave-status="onAutosaveStatus"
  />
</template>
```

`AutosaveStatusPayload` is `{ status: AutosaveStatus; error?: unknown }`. `AutosaveSavedPayload` and `AutosaveRestoredPayload` include the design snapshot plus `savedAt` or `restoredAt` timestamps. `AutosaveErrorPayload` is `{ operation: 'load' | 'save'; error: unknown }`.

## Errors and cleanup

Autosave failures do not unmount the editor or clear the current design. Instead:

- load failures emit `autosave-error` with `operation: 'load'` and move the status to `'error'`
- save failures emit `autosave-error` with `operation: 'save'` and move the status to `'error'`
- a later successful save moves the status back to `'saved'`

When the component unmounts, the builder disposes the autosave controller, clears pending timers, and ignores late completions from older saves or restores. Replacing the `autosave` prop also reconfigures the controller and cancels pending work from the previous configuration.

## Ownership of remote data

For `type: 'custom'`, the library only calls your `load` and `save` functions with `EmailDocument` snapshots. Your host application still owns:

- authentication and authorization
- request retries and backoff
- conflict resolution between multiple editors
- retention, expiration, and deletion of remote drafts
- choosing when a draft should be cleared after publish or send

There is no public autosave clear API. If you need explicit cleanup, handle it in your own backend or by removing the local-storage key you chose.
