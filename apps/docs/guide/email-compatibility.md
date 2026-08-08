# Email compatibility

The exported HTML is built for email clients, not browsers: it uses tables with inline styles, avoids `flex`/`grid`/`position`, and adds conditional ghost tables for Outlook (Word engine).

## Techniques used

- **Presentation tables** (`role="presentation"`) for all layout — columns, padding, alignment.
- **MSO ghost tables** (`<!--[if mso]>...<![endif]-->`) so Outlook desktop computes pixel widths where other clients use `%`/`max-width`.
- **A single media query** to stack columns on mobile (`@media (max-width: 480px)`) and for the per-device hide classes.
- **VML** (`<v:roundrect>`) on fixed-width buttons, to get rounded corners in Outlook desktop too — the only way to achieve that there.
- **`font-size:0;line-height:0`** on dividers and separators, to avoid the whitespace gap that `display:inline-block` leaves in inline layout.

## Known limitations

- Doesn't import existing HTML — JSON only (your own, or Unlayer's).
- Row backgrounds: partial support in Outlook desktop (no full-bleed VML yet).
- Merge tags are emitted as `{{value}}` — your sending platform's engine replaces them; the library interpolates nothing.
- Columns can't be reordered within a row (rows and blocks can be reordered).
- `theme` only accepts `'light' | 'dark'` (no `'auto'`).
- Column border/radius: supported in the model and the exported HTML, but no dedicated inspector control yet.
- The Image block's `borderRadius` uses CSS `border-radius` — looks right in the builder and in most clients, but Outlook desktop (Word engine) ignores it.
- The timer doesn't animate without an integrator-provided dynamic image service — without one, it shows a static box with the days remaining.

## See also

- [Backgrounds](/guide/backgrounds) — background image/color per row and column.
- [Importing from Unlayer](/guide/unlayer-import) — what gets warned about when converting a template.
