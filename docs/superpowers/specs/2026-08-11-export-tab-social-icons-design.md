# Export Rail Tab and Email-Safe Social Icons

## Goal

Move the editor's export actions into a first-class right-rail tab, preserve the existing public import/export API, and make social icons render reliably in delivered email clients.

## Context

The editor currently exposes HTML export, JSON export/import, image export, Unlayer import, and version management from a header dropdown. The document store already owns JSON serialization and validation, while `EmailBuilder` exposes `exportHtml`, `exportJson`, `getDesign`, and `loadDesign` through its public component API.

Social icons currently render in exported email HTML as `<img>` elements whose `src` is a `data:image/svg+xml` URI. Many email clients block data-URI images, leaving the colored social circles with broken-image placeholders.

## Approved Design

### Gallery card sizing

- Keep Gallery cards in a two-column grid, but prevent CSS grid row stretching from making one card inherit a neighboring image's natural height.
- Give each thumbnail viewport an explicit square aspect ratio and `overflow:hidden`.
- Render every thumbnail with `object-fit:cover` so portrait and landscape source images occupy the same visual footprint without distorting.
- Keep the filename and item actions outside the thumbnail viewport.

### Export tab

- Add an `export` rail tab after Images and make it selectable like Content, Blocks, Body, and Images.
- Remove the header Export dropdown from the primary editor chrome.
- Render a dedicated `ExportPanel` in the side panel with the existing actions:
  - Download HTML
  - Download JSON
  - Import JSON
  - Import Unlayer JSON
  - Export PNG
  - Manage versions
- Reuse the existing action implementations and modal entry points; do not duplicate document serialization logic.
- Selecting Export clears property-panel mode just like other rail tabs.
- Keep the public API stable and document `exportHtml`, `exportJson`, `getDesign`, and `loadDesign` as the programmatic integration surface.

### Social icons

- Replace data-URI social icon images in delivered HTML with an email-safe icon URL generated per network.
- Add an optional `socialIconUrlBuilder` public option. It receives a `SocialNetworkKind` and returns the URL used for that network.
- Provide a default URL builder using Simple Icons CDN URLs with the icon color encoded in the URL. Consumers can override it to self-host icons or use their own asset service.
- Keep the existing colored background, accessible `alt`, link URL, size, shape, spacing, and block padding unchanged.
- Ensure every exported social icon has a normal HTTPS URL and never a `data:` URL.
- The editor canvas continues using inline SVG for crisp local rendering; this change is specific to email HTML output.

## Alternatives considered

1. Keep the header dropdown and add a second export surface. Rejected because it duplicates navigation and leaves Export unlike the other editor tools.
2. Inline SVG in delivered email HTML. Rejected as the sole strategy because client support is inconsistent; hosted HTTPS images are the established interoperable email fallback.
3. Hard-code one third-party icon host with no override. Rejected because integrators may require self-hosting, CSP control, privacy guarantees, or asset version pinning.

## Data flow

`EmailBuilder` provides `socialIconUrlBuilder` through `BuilderOptions` → `renderHtml` receives it in `RenderCtx` → the social block renderer calls it once per network → the resulting HTTPS URL is escaped into the email `<img src>` attribute.

The Export tab calls the existing store/render helpers. JSON import continues through schema validation before `loadDesign`; Unlayer import and versions continue through their existing body-portal dialogs.

## Error handling

- If a custom icon URL builder throws or returns an empty value, the renderer uses the default URL for that network.
- Invalid JSON continues to show the existing localized alert and does not mutate the document.
- PNG export continues to show the existing localized error alert.

## Testing

- Add renderer tests proving default social URLs are HTTPS and contain no `data:` URI.
- Add renderer tests proving a custom `socialIconUrlBuilder` is used and its value is escaped.
- Add rail tests proving Export is visible, selectable, and renders all six actions.
- Preserve existing public API tests and add coverage for the documented API methods if needed.
- Run focused tests, the full typecheck/test suite, package/demo builds, and docs build.

## Documentation

- Update the package README and API/reference docs in English with the Export tab and programmatic import/export API.
- Document `socialIconUrlBuilder`, its signature, default behavior, and self-hosting recommendation.
- Regenerate LLM documentation when the docs build updates generated files.
