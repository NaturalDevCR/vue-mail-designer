# Introduction

**Vue Mail Designer** (`@naturaldevcr/vue-mail-designer`) is a Vue 3 component for visual email editing, Unlayer-style: drag blocks onto a canvas, edit them with a properties inspector, and get email-client-compatible HTML (Outlook included) plus a re-editable design JSON.

## Who is this for?

For embedding an email editor inside your own application (a marketing SaaS, a CRM, a campaign builder) without depending on an external service. You control:

- **Where images are stored** — you implement `uploadImage` and optionally `mediaLibrary` against your own storage.
- **Which variables can be inserted** — `mergeTags` defines the variables available in the text editor.
- **Which blocks appear** — the `tools` prop hides, reorders, or limits blocks in the palette.
- **The editor's look** — `theme`, `appearance`, and `locale` (Spanish or English, or your own dictionary).

## What does it generate?

Two outputs, both under your control:

1. **Email HTML** (`exportHtml()` or the `export-html` event) — tables with inline styles, MSO ghost tables for Outlook, a media query to stack columns on mobile. Meant to be pasted straight into your sending provider (SES, SendGrid, Postmark, etc.).
2. **Design JSON** (`EmailDocument`, via `getDesign()`/`loadDesign()` or `v-model:design`) — the full editable model, to save in your database and reopen in the editor later.

## Next steps

- [Installation](/guide/installation)
- [Quickstart](/guide/quickstart)
- [Props reference](/reference/props)
