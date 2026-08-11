# Builder Header and Theme Configuration

## Goal

Allow applications embedding `EmailBuilder` to hide the builder header and match the editor UI to their own product in both light and dark modes, while preserving existing integrations.

## Public API

`EmailBuilder` adds:

```ts
showHeader?: boolean
```

The default is `true`, so existing consumers keep the current layout. When `false`, the complete `BuilderHeader` is omitted, including templates, saved status, theme toggle, export/import actions, and version controls.

The existing `theme?: 'light' | 'dark'` prop remains the initial and reactive theme selection. The internal theme toggle continues to work when the header is visible.

The existing flat `Appearance` type remains valid. A new `ThemeAppearance` type supports per-mode colors:

```ts
type Appearance = {
  accent?: string
  panel?: string
  border?: string
  background?: string
  foreground?: string
  muted?: string
}

type ThemeAppearance = {
  light?: Appearance
  dark?: Appearance
}
```

The prop accepts either shape:

```ts
appearance?: Appearance | ThemeAppearance
```

Flat appearance values are applied to both modes for backward compatibility. In a themed appearance, the active mode's values override the built-in palette and omitted fields retain that mode's defaults. The `ThemeAppearance` type is exported from the package.

## Implementation

`EmailBuilder.vue` will compute CSS custom properties from the active `ui.theme`. The computed style will distinguish the legacy flat shape from the `{ light, dark }` shape, then apply only the active mode's overrides to the root element. The root's existing `.vmd-dark` class remains the source of built-in dark-mode defaults.

The template will render `BuilderHeader` only when `showHeader` is not `false`. All existing header behavior remains unchanged when it is visible.

## Testing

Component tests will verify:

1. The header is rendered by default and omitted when `showHeader` is `false`.
2. `theme="dark"` applies the dark root class on mount and a reactive theme prop update changes it.
3. Flat appearance values set the corresponding CSS variables.
4. The active light/dark branch of `ThemeAppearance` sets its values and updates when the theme changes.

Typecheck, the package test suite, and the package build must pass before publishing the change.

## Documentation and release traceability

The props reference and package README will document the new prop and both appearance forms, including a complete integration example. The issue will capture the request and acceptance criteria; the pull request will link the issue, summarize compatibility behavior, and include validation commands.
