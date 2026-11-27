# Backgrounds

## Body background

The **email body's background color and image** are edited in the inspector's **Body** tab (`settings.backgroundColor` / `settings.backgroundImage`). It's the background shown behind the entire document.

## Row and column background

**Rows are transparent by default**, so the body background shows through. The row background color fills the email's width. The content background color fills just the padded area bounded by `contentWidth`. Columns can have their own background color.

For a row background image:

- **`url`** — the image.
- **`repeat`** — `no-repeat` / `repeat` / `repeat-x` / `repeat-y`.
- **`size`** — `auto` (natural size, not stretched), `cover` (fills the container, may crop), or `contain` (fits entirely, may leave bands).
- **`position`** — standard CSS position (e.g. `center`, `top center`).
- **Container width** — "Content" follows the body's `contentWidth` and alignment. "Full width" reaches the email's edges.

The desktop and mobile canvas use the same background layers and content padding as the export. The mobile canvas stacks columns and keeps a small editable marker for rows or blocks hidden on the selected device. Open the email preview to see the layout with those elements omitted.

::: tip Importing from Unlayer
When importing an Unlayer template, `size` almost never arrives as a CSS keyword — Unlayer puts the file's byte size there instead. The importer detects this and falls back to `auto` (natural size), the same thing Unlayer itself exports when it doesn't send an explicit `background-size`.
:::

## Outlook

Row background support in Outlook desktop is partial — see [Email compatibility](/guide/email-compatibility).
