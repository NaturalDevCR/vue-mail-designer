Status: completed on August 11, 2026.

Commits:
- `f83b870` — `feat(images): unify search and media library`

Changed files:
- `packages/email-builder/src/components/tabs/ImagesPanel.vue`
- `packages/email-builder/src/components/tabs/ImagesTab.vue`
- `packages/email-builder/src/components/tabs/MediaLibraryTab.vue`
- `packages/email-builder/src/components/SidePanel.vue`
- `packages/email-builder/src/store/ui.ts`
- `packages/email-builder/src/styles.css`
- `packages/email-builder/tests/images-tab.test.ts`
- `packages/email-builder/tests/media-library-tab.test.ts`
- `packages/email-builder/tests/sidepanel.test.ts`

RED command:

```bash
pnpm --filter @naturaldevcr/vue-mail-designer exec vitest run tests/images-tab.test.ts tests/media-library-tab.test.ts tests/sidepanel.test.ts
```

RED output:

```text
 RUN  v3.2.7 /Users/jdavidoa91/Dev/vue-mail-designer/.worktrees/unified-image-library-localization/packages/email-builder

 ❯ tests/sidepanel.test.ts (8 tests | 1 failed) 141ms
   × SidePanel > usa un solo tab Images con subtabs Search y Gallery opcional 9ms
     → expected false to be true // Object.is equality

 ❯ tests/media-library-tab.test.ts (23 tests | 22 failed) 194ms
   ✓ MediaLibraryTab > oculta la subpestaña Gallery sin la prop mediaLibrary 43ms
   × MediaLibraryTab > lista los ítems al abrir la subpestaña Gallery 14ms
     → expected false to be true // Object.is equality
   × MediaLibraryTab > abre preview desde Gallery y solo inserta al presionar Add 8ms
     → expected false to be true // Object.is equality

 ❯ tests/images-tab.test.ts (6 tests | 5 failed) 1009ms
   × ImagesTab > busca con la función inyectada y muestra resultados 48ms
     → expected false to be true // Object.is equality
   × ImagesTab > abre preview sin insertar hasta presionar Add 9ms
     → expected false to be true // Object.is equality

 FAIL  tests/images-tab.test.ts > ImagesTab > busca con la función inyectada y muestra resultados
 AssertionError: expected false to be true // Object.is equality

 ❯ searchIn tests/images-tab.test.ts:13:59
      11| async function searchIn(wrapper: ReturnType<typeof mount>) {
      12|   await wrapper.find('[data-tab="images"]').trigger('click')
      13|   expect(wrapper.find('[data-subtab="search"]').exists()).toBe(true)
        |                                                           ^
      14|   const input = wrapper.find('.vmd-image-search input')
      15|   await input.setValue('futbol')

 FAIL  tests/media-library-tab.test.ts > MediaLibraryTab > lista los ítems al abrir la subpestaña Gallery
 AssertionError: expected false to be true // Object.is equality

 ❯ openMediaTab tests/media-library-tab.test.ts:31:31
      29|   await wrapper.find('[data-tab="images"]').trigger('click')
      30|   const galleryTab = wrapper.find('[data-subtab="gallery"]')
      31|   expect(galleryTab.exists()).toBe(true)
        |                               ^
      32|   await galleryTab.trigger('click')
      33|   await flushPromises()

 FAIL  tests/sidepanel.test.ts > SidePanel > usa un solo tab Images con subtabs Search y Gallery opcional
 AssertionError: expected false to be true // Object.is equality

 ❯ tests/sidepanel.test.ts:83:61
      81|     await flushPromises()
      82|
      83|     expect(wrapper.find('[data-subtab="search"]').exists()).toBe(true)
        |                                                             ^
      84|     expect(wrapper.find('[data-subtab="gallery"]').exists()).toBe(true)
      85|     expect(wrapper.find('[data-tab="media"]').exists()).toBe(false)

 Test Files  3 failed (3)
      Tests  28 failed | 9 passed (37)
   Start at  22:37:57
   Duration  1.92s (transform 345ms, setup 0ms, collect 1.59s, tests 1.34s, environment 650ms, prepare 103ms)
```

GREEN command:

```bash
pnpm --filter @naturaldevcr/vue-mail-designer exec vitest run tests/images-tab.test.ts tests/media-library-tab.test.ts tests/sidepanel.test.ts
```

GREEN output:

```text
 RUN  v3.2.7 /Users/jdavidoa91/Dev/vue-mail-designer/.worktrees/unified-image-library-localization/packages/email-builder

 ✓ tests/sidepanel.test.ts (8 tests) 136ms
 ✓ tests/media-library-tab.test.ts (23 tests) 240ms
 ✓ tests/images-tab.test.ts (6 tests) 3307ms
   ✓ ImagesTab > busca con la función inyectada y muestra resultados  499ms
   ✓ ImagesTab > abre preview sin insertar hasta presionar Add  485ms
   ✓ ImagesTab > muestra error si la búsqueda falla  465ms
   ✓ ImagesTab > preserva el alt existente al agregar desde preview sobre un bloque seleccionado  482ms
   ✓ ImagesTab > cerrar o cancelar el preview no muta el diseño  463ms
   ✓ ImagesTab > descarta respuestas fuera de orden  913ms

 Test Files  3 passed (3)
      Tests  37 passed (37)
   Start at  22:39:39
   Duration  4.12s (transform 338ms, setup 0ms, collect 1.52s, tests 3.68s, environment 441ms, prepare 103ms)
```

Implementation notes:
- Added `ImagesPanel.vue` as the single owner of Search/Gallery subtabs, preview state, and image insertion.
- Converted `ImagesTab.vue` and `MediaLibraryTab.vue` to emit `ImageSelection` instead of mutating the document directly.
- Preserved full source URLs for insert/drag payloads and preserved existing media-library CRUD, pagination, rename, delete, upload, and search behavior.
- Removed the separate media rail entry and narrowed `sidebarTab` to `content | blocks | body | images`.
- Updated image/media thumb styling to use square frames with full-image coverage.

Concerns:
- The focused Vitest runs pass, but they still emit repeated stderr warnings from auto-scroll setup: `Auto scrolling has been attached to an element that appears not to be scrollable`. This was present during both RED and GREEN runs and was not changed by Task 2.

---

Review fix on August 11, 2026:

Files:
- `packages/email-builder/src/components/tabs/ImagesPanel.vue`
- `packages/email-builder/src/i18n/en.ts`
- `packages/email-builder/src/i18n/es.ts`
- `packages/email-builder/tests/sidepanel.test.ts`

RED command:

```bash
pnpm --filter @naturaldevcr/vue-mail-designer exec vitest run tests/sidepanel.test.ts
```

RED output:

```text
 RUN  v3.2.7 /Users/jdavidoa91/Dev/vue-mail-designer/.worktrees/unified-image-library-localization/packages/email-builder

 ❯ tests/sidepanel.test.ts (9 tests | 1 failed) 135ms
   × SidePanel > localiza las etiquetas de subtabs de imágenes desde locale 8ms
     → expected 'Search' to be 'Buscar' // Object.is equality

 FAIL  tests/sidepanel.test.ts > SidePanel > localiza las etiquetas de subtabs de imágenes desde locale
 AssertionError: expected 'Search' to be 'Buscar' // Object.is equality

 Expected: "Buscar"
 Received: "Search"

 ❯ tests/sidepanel.test.ts:106:59
     104|     await flushPromises()
     105|
     106|     expect(wrapper.find('[data-subtab="search"]').text()).toBe('Buscar')
        |                                                           ^
     107|     expect(wrapper.find('[data-subtab="gallery"]').text()).toBe('Galería')
     108|   })

 Test Files  1 failed (1)
      Tests  1 failed | 8 passed (9)
   Start at  22:44:27
   Duration  906ms (transform 316ms, setup 0ms, collect 473ms, tests 135ms, environment 135ms, prepare 32ms)
```

GREEN command:

```bash
pnpm --filter @naturaldevcr/vue-mail-designer exec vitest run tests/sidepanel.test.ts
```

GREEN output:

```text
 RUN  v3.2.7 /Users/jdavidoa91/Dev/vue-mail-designer/.worktrees/unified-image-library-localization/packages/email-builder

 ✓ tests/sidepanel.test.ts (9 tests) 136ms

 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  22:44:53
   Duration  890ms (transform 310ms, setup 0ms, collect 465ms, tests 136ms, environment 136ms, prepare 35ms)
```
