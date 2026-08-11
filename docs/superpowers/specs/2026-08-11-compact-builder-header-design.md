# Compact Builder Header

## Goal

Rework the `EmailBuilder` header so it has a distinct professional, compact toolbar identity instead of visually echoing Unlayer, while preserving every existing header action and the public API.

## Approved visual direction

- Use the editor surface (`var(--vmd-panel)`) with a thin bottom border (`var(--vmd-border)`) instead of a fixed navy bar.
- Render a compact brand block with a rounded `V` monogram and the existing `Vue Mail Designer` name.
- Present `Plantillas` as a restrained navigation tab with accent-soft hover/active treatment rather than a floating button.
- Present `Guardado` as a subtle status badge with a dot and low-contrast background.
- Keep the theme control icon-only with its existing accessible tooltip.
- Keep `Exportar` as the primary action, but use a compact surface-aware control with icon and chevron instead of a large blue Unlayer-like button.
- Use the same structure in light and dark themes; only the existing CSS variables determine surfaces, text, border, and accent colors.

## Behavior and responsive rules

- `Plantillas` continues to set `ui.galleryOpen = true`.
- The saved status remains informational and does not change autosave behavior.
- The theme control continues to call `ui.toggleTheme()` and preserves its current title text.
- The export menu keeps all existing HTML, JSON, Unlayer import, image, and versions actions.
- No props, dependencies, or public API types are added or removed.
- The header remains keyboard accessible, including visible `focus-visible` treatment and existing button semantics.
- At narrow widths, the brand name may collapse while retaining the monogram; the templates label may collapse to an icon/tooltip; status and export remain available.

## Implementation scope

- `packages/email-builder/src/components/BuilderHeader.vue`: add only the markup and accessible labels needed for the visual hierarchy and responsive collapse.
- `packages/email-builder/src/styles.css`: replace the header-specific visual rules while leaving shared editor controls and behavior untouched.
- `packages/email-builder/tests/header.test.ts`: assert the stable header contract (brand, templates, saved status, theme control, export menu) without depending on exact cosmetic values.

## Verification

Run the focused header tests, the full package test suite, typecheck, and the package/demo build. The change is complete only when all commands exit successfully and the header retains its current interactions.

