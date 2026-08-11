# Builder Header and Theme Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\- [ ]\) syntax for tracking.

**Goal:** Add an opt-out builder header and per-mode light/dark appearance configuration to EmailBuilder without breaking existing consumers.

**Architecture:** Keep the existing Appearance color shape as the backward-compatible flat form and add ThemeAppearance with optional light and dark branches. EmailBuilder.vue computes active CSS variable overrides from ui.theme, while the existing root theme class supplies built-in defaults. The existing BuilderHeader is conditionally mounted from the entry component.

**Tech Stack:** Vue 3 script setup, TypeScript, Pinia, Vitest, Vue Test Utils, Vite/Vue TSC, Markdown documentation.

## Global Constraints

- showHeader defaults to true, preserving the current layout for existing integrations.
- Flat Appearance values remain valid and apply to both modes.
- ThemeAppearance accepts optional light and dark color branches; omitted fields use that mode's built-in defaults.
- theme remains 'light' | 'dark', is applied on mount, and remains reactive to prop changes.
- showHeader=false omits the complete BuilderHeader, including templates, saved status, theme toggle, export/import, and version controls.
- The email canvas and exported email HTML are unaffected by builder UI appearance settings.
- No new runtime dependencies are introduced.

---

## File Map

- Modify packages/email-builder/src/options.ts: export ThemeAppearance and add a runtime type guard.
- Modify packages/email-builder/src/index.ts: export the new public type.
- Modify packages/email-builder/src/components/EmailBuilder.vue: accept showHeader, accept flat or themed appearance, conditionally render the header, and compute active-mode CSS overrides.
- Create packages/email-builder/tests/email-builder-config.test.ts: component-level regression tests.
- Modify apps/docs/reference/props.md: document showHeader and both appearance forms.
- Modify packages/email-builder/README.md: document the public API and add an integration snippet.

## Task 1: Add failing component tests

**Files:**
- Create: packages/email-builder/tests/email-builder-config.test.ts

**Interfaces:**
- Consumes: EmailBuilder props showHeader, theme, and appearance.
- Produces: regression coverage that the implementation must satisfy.

- [ ] **Step 1: Write the failing tests**

~~~ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'

describe('configuración del builder', () => {
  it('muestra el header por defecto y permite ocultarlo', () => {
    const visible = mount(EmailBuilder)
    expect(visible.find('.vmd-header').exists()).toBe(true)

    const hidden = mount(EmailBuilder, { props: { showHeader: false } })
    expect(hidden.find('.vmd-header').exists()).toBe(false)
  })

  it('aplica el tema inicial y reacciona a cambios de la prop', async () => {
    const wrapper = mount(EmailBuilder, { props: { theme: 'dark' } })
    expect(wrapper.find('.vmd-root').classes()).toContain('vmd-dark')

    await wrapper.setProps({ theme: 'light' })
    expect(wrapper.find('.vmd-root').classes()).not.toContain('vmd-dark')
  })

  it('mantiene la apariencia plana compatible', () => {
    const wrapper = mount(EmailBuilder, {
      props: { appearance: { accent: '#123456', panel: '#abcdef' } },
    })
    const root = wrapper.find('.vmd-root').element as HTMLElement
    expect(root.style.getPropertyValue('--vmd-accent')).toBe('#123456')
    expect(root.style.getPropertyValue('--vmd-panel')).toBe('#abcdef')
  })

  it('selecciona la rama light o dark activa', async () => {
    const wrapper = mount(EmailBuilder, {
      props: {
        appearance: {
          light: { accent: '#111111', panel: '#eeeeee' },
          dark: { accent: '#eeeeff', panel: '#111122' },
        },
      },
    })
    const root = () => wrapper.find('.vmd-root').element as HTMLElement

    expect(root().style.getPropertyValue('--vmd-accent')).toBe('#111111')
    expect(root().style.getPropertyValue('--vmd-panel')).toBe('#eeeeee')

    await wrapper.setProps({ theme: 'dark' })
    expect(root().style.getPropertyValue('--vmd-accent')).toBe('#eeeeff')
    expect(root().style.getPropertyValue('--vmd-panel')).toBe('#111122')
  })
})
~~~

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run:

~~~bash
pnpm --filter @naturaldevcr/vue-mail-designer test -- email-builder-config.test.ts
~~~

Expected: failure because the themed appearance object is not supported by the current component/type implementation.

## Task 2: Implement typed header and appearance configuration

**Files:**
- Modify: packages/email-builder/src/options.ts
- Modify: packages/email-builder/src/index.ts
- Modify: packages/email-builder/src/components/EmailBuilder.vue

**Interfaces:**
- Consumes: existing Appearance, theme, BuilderHeader, and CSS variables in styles.css.
- Produces: ThemeAppearance and EmailBuilder props showHeader?: boolean, appearance?: Appearance | ThemeAppearance.

- [ ] **Step 1: Add the themed appearance type and type guard**

Keep the existing Appearance definition unchanged and add to options.ts:

~~~ts
export type ThemeAppearance = {
  light?: Appearance
  dark?: Appearance
}

export function isThemeAppearance(value: Appearance | ThemeAppearance): value is ThemeAppearance {
  return 'light' in value || 'dark' in value
}
~~~

Export ThemeAppearance from index.ts alongside Appearance. Keep the guard internal to the package unless an existing public convention requires exporting runtime helpers.

- [ ] **Step 2: Extend EmailBuilder.vue props and conditionally render the header**

Retain a props reference and add:

~~~ts
const props = defineProps<{
  showHeader?: boolean
  // existing props remain unchanged
  appearance?: Appearance | ThemeAppearance
}>()
~~~

Render the existing header as:

~~~vue
<BuilderHeader v-if="props.showHeader !== false" />
~~~

An omitted prop is equivalent to true; false removes the complete header subtree.

- [ ] **Step 3: Compute appearance overrides from the active theme**

Import isThemeAppearance and select the active color object:

~~~ts
const appearanceStyle = computed<Record<string, string>>(() => {
  const configured = props.appearance
  if (!configured) return {}

  const colors = isThemeAppearance(configured) ? configured[ui.theme] : configured
  if (!colors) return {}

  const out: Record<string, string> = {}
  for (const key of Object.keys(APPEARANCE_VARS) as (keyof Appearance)[]) {
    const value = colors[key]
    if (value) out[APPEARANCE_VARS[key]] = value
  }
  return out
})
~~~

Keep the style binding on .vmd-root and preserve the existing theme initialization/watch logic. Do not alter built-in values in styles.css.

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

~~~bash
pnpm --filter @naturaldevcr/vue-mail-designer test -- email-builder-config.test.ts
~~~

Expected: all five configuration tests pass.

- [ ] **Step 5: Commit the implementation**

~~~bash
git add packages/email-builder/src/options.ts packages/email-builder/src/index.ts packages/email-builder/src/components/EmailBuilder.vue packages/email-builder/tests/email-builder-config.test.ts
git commit -m "feat: configure builder header and themes"
~~~

## Task 3: Document migration-compatible configuration

**Files:**
- Modify: apps/docs/reference/props.md
- Modify: packages/email-builder/README.md

**Interfaces:**
- Consumes: the public API implemented in Task 2.
- Produces: user-facing examples distinguishing flat and per-mode appearance.

- [ ] **Step 1: Update the props reference**

Add a showHeader row explaining that it defaults to true and hides the entire builder header when false. Update appearance to document both accepted forms:

~~~md
| appearance | Appearance | Builder colors. A flat object ({ accent, panel, border, background, foreground, muted }) applies to both modes. The union Appearance or ThemeAppearance also accepts { light: Appearance, dark: Appearance } for mode-specific values; omitted fields keep that mode's defaults. |
~~~

Add a Vue snippet showing :show-header="false", theme="dark", and distinct light/dark colors.

- [ ] **Step 2: Update the package README**

Add the same showHeader row and expand appearance. Add near basic usage:

~~~vue
<EmailBuilder
  :show-header="false"
  theme="dark"
  :appearance="{
    light: { accent: '#2563eb', panel: '#ffffff' },
    dark: { accent: '#60a5fa', panel: '#111827' },
  }"
/>
~~~

Explain that the flat form remains supported and hiding the header also removes built-in export and theme-toggle controls, so the host app should use component methods/events when it hides the header.

- [ ] **Step 3: Run documentation checks**

Run:

~~~bash
git diff --check
~~~

Expected: exit code 0 with no whitespace errors.

- [ ] **Step 4: Commit the documentation**

~~~bash
git add apps/docs/reference/props.md packages/email-builder/README.md
git commit -m "docs: describe header and theme options"
~~~

## Task 4: Verify package and workspace

**Files:**
- No additional files; validate changes from Tasks 1–3.

**Interfaces:**
- Consumes: implementation, tests, and docs from prior tasks.
- Produces: fresh evidence for the issue and PR description.

- [ ] **Step 1: Run the complete library test suite**

Run:

~~~bash
pnpm --filter @naturaldevcr/vue-mail-designer test
~~~

Expected: Vitest exits 0 with zero failed tests.

- [ ] **Step 2: Run workspace typecheck**

Run:

~~~bash
pnpm typecheck
~~~

Expected: all workspace packages typecheck without errors, including the generated public type surface.

- [ ] **Step 3: Build the library and demo**

Run:

~~~bash
pnpm build
~~~

Expected: library and demo builds exit 0.

- [ ] **Step 4: Review final diff and status**

Run:

~~~bash
git diff origin/main...HEAD --check
git diff origin/main...HEAD --stat
git status --short --branch
~~~

Expected: only issue-scoped implementation, tests, docs, and superpowers records are present; no generated build output or unrelated edits are included.

## Task 5: Record and publish GitHub workflow

**Files:**
- GitHub issue and pull request metadata; no additional repository files.

**Interfaces:**
- Consumes: final verified branch and validation commands from Task 4.
- Produces: linked issue, pushed branch, pull request, and merge commit on main.

- [ ] **Step 1: Create the issue**

Create an issue titled Configurar visibilidad del header y tema por modo with:

~~~md
## Contexto
Al integrar EmailBuilder en otro proyecto, el header se renderiza siempre y la apariencia configurada no puede variar entre light y dark.

## Alcance
- Permitir ocultar el header sin cambiar el comportamiento por defecto.
- Permitir seleccionar el tema inicial mediante theme.
- Permitir colores planos compatibles y colores específicos para light y dark.
- Documentar la integración y mantener cobertura de tests.

## Criterios de aceptación
- showHeader es true por defecto y false oculta todo el header.
- appearance={{ light: {...}, dark: {...} }} sigue el tema activo.
- La forma plana de appearance continúa funcionando.
- Tests, typecheck y build pasan.
~~~

- [ ] **Step 2: Create the feature branch if publication requires it**

Keep the current feature branch if it is already the intended PR branch. Otherwise create one using:

~~~bash
git switch -c codex/header-theme-configuration
~~~

- [ ] **Step 3: Push and open the PR**

Push with tracking and open a PR targeting main. Link the issue with Closes #<issue-number>. The PR body must include the implementation summary, backward-compatibility behavior, and observed test, typecheck, and build results.

- [ ] **Step 4: Merge the PR into main**

After checks are green and there are no blocking review comments, merge it into main. Verify the remote main contains the merge and report the issue, PR, merge commit, and validation evidence.
