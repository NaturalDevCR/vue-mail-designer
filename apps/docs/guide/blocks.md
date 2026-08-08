# Blocks

The palette includes: **Heading**, **Text** (rich editor), **Image**, **Button**, **Divider**, **Spacer**, **Social**, **Menu**, **HTML**, **Video**, **Table**, **Gallery**, and **Timer** (countdown).

## Common properties

Most blocks share, in their inspector:

- **Padding** — linked by default (a single value for all 4 sides); a link-icon button unlinks it to edit each side separately.
- **Alignment** — left/center/right, where applicable.
- **Hide per device** — `hideDesktop`/`hideMobile`, per block and per row. The exported HTML uses classes + a media query, no JS.

## Timer

Countdown to a date. Two modes:

- **Integrator-provided dynamic image**: you pass a function that generates the counter image (typically an external service like countdownmail).
- **Static box**: without that function, it shows the days remaining as plain text — works in any client, no animation.

## Table and Gallery

- **Table** — rows/columns of simple text cells, with configurable padding and font size.
- **Gallery** — a grid of 2 to 4 images; each item accepts dragging an image onto it (from the Images/Gallery tab, or by moving an image already placed on the canvas) to replace it.

## Custom blocks

Besides the built-in blocks, you can register your own — see [Custom blocks](/guide/custom-blocks).

## Corner radius in Outlook

The Image block's `borderRadius` renders with CSS `border-radius`, and additionally with VML `<v:roundrect>` for Outlook desktop on fixed-width buttons — see [Email compatibility](/guide/email-compatibility).
