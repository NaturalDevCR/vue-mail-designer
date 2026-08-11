# Export, Social Icons, Gallery, and AI Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make delivered social icons reliable in email clients, add a first-class Export rail tab, keep Gallery thumbnails uniform, and keep text AI menus/dialogs anchored to the text editor instead of falling to the bottom of the panel.

**Architecture:** Preserve the existing document schema and public component API. Add social icon URL resolution only to HTML export, extract the existing export actions into a side-rail panel, constrain gallery media through a dedicated square thumbnail viewport, and render AI text overlays through the existing portal/positioning layer with an anchor inside the text editor.

**Tech Stack:** Vue 3, TypeScript, Vitest, existing package CSS/i18n system, pnpm workspace, GitHub Actions.

## Global Constraints

- Keep all package, documentation, issue, PR, and UI source strings in English with Spanish translations in the existing locale files.
- Preserve existing public APIs and backward-compatible defaults.
- Use `apply_patch` for source edits.
- Keep all modals/overlays outside clipping and stacking contexts when they need viewport positioning.
- Add regression tests before implementation for each behavior where practical.

## Task 1: Branch and tracking artifacts

- [ ] Create `codex/export-social-gallery` from the clean `main` branch.
- [ ] Include the approved design spec and this implementation plan in the branch.
- [ ] Track issues #42, #43, #44 and the AI overlay regression in the implementation PR.

## Task 2: Email-safe social icon rendering

- [ ] Add a failing renderer test proving default social icon images use HTTPS URLs and never `data:` URLs.
- [ ] Add a failing renderer test proving a custom URL builder is called and HTML-escaped.
- [ ] Add `SocialIconUrlBuilder` and the public `socialIconUrlBuilder` option with a safe default URL resolver.
- [ ] Thread the option through `EmailBuilder`, `BuilderOptions`, and `renderHtml` without breaking existing call signatures.
- [ ] Add fallback behavior for builders that throw or return an empty URL.
- [ ] Update package/API/LLM documentation with self-hosting guidance.

## Task 3: Uniform Gallery thumbnails

- [ ] Add a focused component regression assertion for the square thumbnail viewport.
- [ ] Wrap gallery thumbnails in a fixed square, overflow-hidden viewport and use `object-fit: cover`.
- [ ] Prevent CSS grid row stretching and keep filenames/actions outside the image viewport.
- [ ] Verify portrait, landscape, and very tall images in the existing gallery layout.

## Task 4: Export rail tab and API documentation

- [ ] Add a failing side-panel test for the Export tab and all six existing native actions.
- [ ] Extract the header export menu behavior into `ExportPanel` without duplicating serialization/import logic.
- [ ] Add the Export tab after Images, remove the header dropdown, and preserve localized labels.
- [ ] Keep and document `exportHtml`, `exportJson`, `getDesign`, and `loadDesign` as the programmatic integration surface.
- [ ] Update package README and docs/reference content in English and Spanish locale coverage.

## Task 5: Anchor text AI overlays

- [ ] Reproduce the AI menu/dialog placement regression in a focused component test inside a constrained editor container.
- [ ] Ensure the AI menu opens adjacent to its trigger and remains above the text controls, regardless of panel scroll position.
- [ ] Ensure Generate, Rewrite, Summarize, and Translate dialogs use the same anchored overlay strategy and remain interactive.
- [ ] Preserve the existing body portal behavior for full-screen modals and keep dark/light appearance variables applied.

## Task 6: Verification and integration

- [ ] Run focused renderer/component tests, typecheck, package build, demo build, and docs build.
- [ ] Review the full diff for accidental API, localization, and layout regressions.
- [ ] Commit, push, open a ready PR linking #42, #43, #44, and the AI overlay regression.
- [ ] Address CI/review feedback, merge into `main`, verify `main` is clean and synchronized, and report release readiness without publishing to npm unless explicitly requested.
