# Limitations

A summary of what the library **doesn't** do today, so you know upfront whether it fits before integrating it:

- **No HTML import** — the importer only reads JSON (your own, or Unlayer templates). There's no parser turning arbitrary HTML into blocks.
- **No backend of its own** — image upload, media library, and Unlayer URL-import proxying are functions you implement. The library assumes no particular storage — not Firebase, not S3, nothing specific.
- **Columns aren't reorderable relative to each other** — within a row, column order is fixed; you can reorder rows and blocks within a column.
- **`theme` has no `'auto'` mode** — only `'light' | 'dark'`, no system-preference detection.
- **No UI for column border/radius** — the model and the export support them, but the inspector doesn't have a control for them yet.
- **Outlook desktop**:
  - Row background has partial support (no full-bleed VML).
  - Image `borderRadius` is ignored (the button's does have a VML fallback).
- **Timer has no animation of its own** — needs an external dynamic-image service; without one, it falls back to a static box with the days remaining.
- **Merge tags have no replacement engine** — emitted as literal `{{value}}`; the actual replacement is done by your sending platform when the email is sent.

If any of these blocks you, or you find a fidelity difference when importing a real Unlayer template, [open an issue](https://github.com/NaturalDevCR/vue-mail-designer/issues).
