# Rename: vue-mail-designer → vue-mailcraft

## Contexto

El paquete se llamaba `vue-mail-designer` (monorepo) / `@vue-mail-designer/builder` (paquete
npm publicable). El usuario lo considera muy escueto. Se decidió un nuevo nombre evocador que
sigue dejando claro que es específico de Vue 3 (no agnóstico de framework).

## Decisión

- **Nombre nuevo:** `vue-mailcraft`
- **Sin scope npm** (antes `@vue-mail-designer/builder`) — es un solo paquete, no una suite;
  instalación más corta (`pnpm add vue-mailcraft`), sin necesidad de crear un org en npm.
- Disponibilidad verificada en el registro de npm al momento de decidir (`vue-mailcraft` y
  `@vue-mailcraft/builder` ambos libres — se descarta el segundo por la decisión de "sin scope").
- Autor/copyright holder del `LICENSE`: `NaturalDevCR` (ya actualizado).

## Alcance

Reemplazar `vue-mail-designer` → `vue-mailcraft` y `@vue-mail-designer/builder` → `vue-mailcraft`
en los siguientes archivos (localizados por grep, ver tabla). Ningún otro archivo del repo
contiene esas cadenas fuera de los excluidos abajo.

| Archivo | Cambio exacto |
|---|---|
| `package.json` (raíz) | `"name"` → `vue-mailcraft` |
| `packages/email-builder/package.json` | `"name"` → `vue-mailcraft`; `exports["./style.css"]` → `./dist/vue-mailcraft.css` |
| `packages/email-builder/vite.config.ts` | `cssFileName: 'vue-mail-designer'` → `'vue-mailcraft'` |
| `packages/email-builder/src/store/keys.ts` | tag de error `[vue-mail-designer]` → `[vue-mailcraft]` |
| `packages/email-builder/README.md` | título, `pnpm add`, import specifier, import de `style.css` |
| `README.md` (raíz) | referencias al nombre del paquete |
| `apps/demo/package.json` | dependency key `@vue-mail-designer/builder` → `vue-mailcraft` (sigue `workspace:*`) |
| `apps/demo/tsconfig.json` | alias de `paths` |
| `apps/demo/vite.config.ts` | alias de `resolve.alias` |
| `apps/demo/src/App.vue` | import specifier |
| `apps/demo/src/mediaLibrary.ts` | import specifier |

Después de los reemplazos: `pnpm install` (regenera `pnpm-lock.yaml` solo, no se edita a mano)
y `pnpm check` (typecheck + test) para confirmar que nada quedó roto.

## Fuera de alcance (explícito)

- **Carpeta en disco** `/Users/jdavidoa91/Dev/vue-mail-designer` — no se renombra en esta tarea;
  moverla en caliente afecta la sesión de trabajo actual. Queda como paso manual opcional del
  usuario.
- **Prefijo de clases CSS `vmd-`** usado en el HTML de email exportado (~65 archivos entre
  `src/` y `tests/`, incluye snapshots) — implementación interna del HTML generado, ningún
  consumidor externo depende de ese nombre; tocarlo es riesgo puro sin beneficio.
- `docs/superpowers/plans/*.md` — bitácoras fechadas de trabajo pasado, no se reescribe historia.

## Verificación

- `pnpm check` (typecheck + test) pasa después del rename.
- Grep de `vue-mail-designer` y `@vue-mail-designer` sobre el repo (excluyendo `node_modules`,
  `dist`, `.git`, `docs/superpowers/plans/`) no devuelve resultados.
