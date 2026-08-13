# AI template generation side-panel tab

## Goal

Expose the existing provider-agnostic AI template workflow as a first-class side-panel tab, matching the builder rail shown by the user.

## Design

- Add an `AI` tab to `SidePanel` only when the injected `aiTemplates.enabled` option is `true`.
- Add a `tabAi` icon and localized `rail.aiTemplates` label in English and Spanish.
- Extract the existing AI workflow UI and state into a reusable panel component. The header action continues to open the same workflow in a modal; the new side-panel tab renders the workflow inline.
- Keep the existing public provider contract, dynamic context resolution, proposal validation, preview, apply, discard, regenerate, and error event behavior unchanged.
- When the AI tab is selected, it takes the same precedence as the other tabs and exits properties mode through the existing panel-mode transition.

## Testing

- Side-panel tests verify the AI tab is hidden by default and visible only when explicitly enabled.
- Tests verify selecting the tab renders the AI workflow and preserves the existing create/edit and proposal lifecycle behavior.
- Run the package test suite, package build, demo typecheck, and docs build.
