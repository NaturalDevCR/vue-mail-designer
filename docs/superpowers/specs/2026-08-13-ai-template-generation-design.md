# AI template generation design

## Goal

Add an optional, provider-agnostic AI workflow to `@naturaldevcr/vue-mail-designer` that can either create a new email design or transform the current design from a natural-language instruction. The host application supplies the provider adapter, credentials, transport, model selection, and any backend policy.

## Confirmed decisions

- The user explicitly selects one of two modes: **Create template** or **Modify current design**.
- Every request lets the user select 1, 2, or 3 proposals; the default is 1.
- The provider is supplied by the host through a generic `generate` function. No provider SDK, API key, or server endpoint is built into the package.
- Brand and campaign context is resolved at request time. Both a reactive/plain context object and a `context()` resolver are supported.
- Generated designs are previewed before they replace the current design.
- In modify mode the current design is sent to the provider. In create mode it is omitted.
- Every returned design is validated against the package schema before it can be previewed or applied.
- Existing Chrome built-in text AI remains a separate feature and is not coupled to this workflow.

## Public API

Add these public types:

```ts
export type AiTemplateMode = 'create' | 'edit'
export type AiTemplateContext =
  | Record<string, unknown>
  | (() => Record<string, unknown> | Promise<Record<string, unknown>>)

export type AiTemplateRequest = {
  mode: AiTemplateMode
  prompt: string
  count: 1 | 2 | 3
  currentDesign?: EmailDocument
  context: Record<string, unknown>
  designer: {
    schemaVersion: 1
    supportedBlocks: BlockType[]
    customBlocks: CustomBlockDef[]
    mergeTags: MergeTagItem[]
  }
}

export type AiTemplateProposal = {
  title: string
  description?: string
  design: EmailDocument
}

export type AiTemplateOptions = {
  enabled: boolean
  context?: AiTemplateContext
  generate: (request: AiTemplateRequest) => Promise<AiTemplateProposal[]>
}
```

`EmailBuilder` receives an optional `aiTemplates?: AiTemplateOptions` prop. The option is provided to child components through the existing reactive builder options injection and is exported from the package entry point.

The provider adapter receives a cloned current design and a resolved context. The library never mutates either object before the user applies a proposal. The adapter may return fewer proposals than requested, but an empty result is an error because the UI cannot offer a useful review state.

## Prompt/context contract

The library supplies structured designer context rather than assuming a model or provider-specific message format. It includes the schema version, all built-in block types, registered custom block definitions, and configured merge tags. The host's adapter decides how to serialize this into system/developer instructions for OpenAI, Anthropic, Kimi, OpenCode, a local model, or its own service.

The package must document that providers should instruct the model to return the requested proposal envelope and valid `EmailDocument` JSON only. The package validates the result as a trust boundary; validation is not a replacement for provider-side authorization or content moderation.

`context` is resolved only after the user submits a request, so current brand, campaign, locale, permissions, and other reactive state are available. A rejected resolver is treated as a request error.

## UI and interaction

When `aiTemplates.enabled` is true, the builder header exposes an AI template action. It opens a dedicated portal popover/modal with this flow:

1. Select mode: Create template or Modify current design.
2. Enter the instruction. Edit mode explains that the current design will be used.
3. Select 1, 2, or 3 proposals.
4. Submit and show loading state; prevent duplicate submissions.
5. Display each validated proposal as a rendered email preview with title and description.
6. Apply one proposal, discard all, or return to the request form and regenerate.

Applying a proposal calls the existing `loadDesign` path so the update emits `update:design`/`change` and participates in the builder's normal autosave flow. It is one replacement operation and resets the undo/redo history consistently with the existing public method. Closing or discarding never changes the design.

The UI must handle a provider response arriving after the dialog is closed, a second request superseding the first, and unmount cleanup without applying stale results. A request can be cancelled when the adapter returns an optional abort-aware promise in a future extension; the MVP only ignores stale results and cannot forcibly cancel an arbitrary user callback.

## Validation and safety

- Parse every proposal design with `zEmailDocument.safeParse`.
- Reject malformed proposals with a localized error that reports how many designs were invalid, without exposing raw provider output in the UI.
- Preserve custom blocks only when their `customType` is registered by the host; unknown custom block types are invalid for the current builder configuration.
- Do not execute model-produced scripts or HTML during preview. HTML blocks remain data rendered by the existing builder pipeline; the host remains responsible for deciding whether to enable custom/HTML blocks in its provider prompt.
- Clone designs before preview/application boundaries to avoid accidental mutation by Vue reactivity or provider code.
- Never log prompts, context, designs, or provider responses from the package.

## Errors and events

The component exposes an `ai-templates-error` event with a small typed payload containing the operation (`context`, `generate`, or `validate`) and the original error for host logging. User-facing messages stay generic and localized. The API does not add a provider-specific error hierarchy.

## Testing

Add unit coverage for:

- public option typing/export and reactive option injection;
- create requests omitting `currentDesign`;
- edit requests including a cloned current design;
- resolving object and function contexts at submit time;
- forwarding the selected count (1/2/3) and explicit mode;
- validating valid, malformed, and unknown-custom-block proposals;
- preview/apply/discard behavior and no mutation on discard;
- stale response protection and provider/context failures;
- localized labels and errors in English and Spanish;
- disabled/hidden AI action when `enabled` is false or absent.

## Documentation and demo

Document the public prop, request/response types, provider examples for a user-owned backend, security guidance about API keys, the two explicit modes, dynamic context, and the preview/apply flow. Add a deterministic local demo adapter so the demo can exercise the workflow without network access or real credentials.

## Scope boundaries

The MVP does not ship provider-specific adapters, server code, image generation, streaming tokens, automatic prompt inference, or partial JSON patch operations. Future versions may add an abort signal, streaming progress, provider helper packages, and patch-based edit mode without changing the core provider boundary.
