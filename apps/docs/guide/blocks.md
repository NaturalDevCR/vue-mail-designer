# Blocks

The palette includes: **Heading**, **Text** (rich editor), **Image**, **Button**, **Divider**, **Spacer**, **Social**, **Menu**, **HTML**, **Video**, **Table**, **Gallery**, and **Timer** (countdown).

## Common properties

Most blocks share, in their inspector:

- **Padding** — available on every editable block, including Spacer and registered custom blocks. It is linked by default (a single value for all 4 sides); a link-icon button unlinks it to edit **Top**, **Right**, **Bottom**, and **Left** separately.
- **Alignment** — left/center/right, where applicable.
- **Hide per device** — `hideDesktop`/`hideMobile`, per block and per row. The exported HTML uses classes + a media query, no JS.

## Timer

Countdown to a date. Two modes:

- **Integrator-provided dynamic image**: you pass a function that generates the counter image (typically an external service like countdownmail).
- **Static box**: without that function, it shows a styled days/hours/minutes/seconds snapshot — works in any client, with no JavaScript animation.

The Timer inspector lets you customize the static box background, border color and thickness, corner radius, number color, label color, font family, and each unit label. These settings are stored in the design JSON and are applied to both the live canvas and exported HTML. Existing timers keep their previous appearance through schema defaults.

## Table and Gallery

- **Table** — rows/columns of simple text cells, with configurable padding and font size.
- **Gallery** — a grid of 2 to 4 images; each item accepts dragging an image onto it (from the Images/Gallery tab, or by moving an image already placed on the canvas) to replace it.

## Custom blocks

Besides the built-in blocks, you can register your own — see [Custom blocks](/guide/custom-blocks).

Custom blocks also receive the shared outer padding control. It is stored in the block's `style.padding` and is applied in both the canvas and exported HTML.

## Corner radius in Outlook

The Image block's `borderRadius` renders with CSS `border-radius`, and additionally with VML `<v:roundrect>` for Outlook desktop on fixed-width buttons — see [Email compatibility](/guide/email-compatibility).
