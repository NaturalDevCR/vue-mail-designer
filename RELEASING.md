# Releasing `@naturaldevcr/vue-mail-designer`

This repository publishes `packages/email-builder` to npm through GitHub Actions Trusted Publishing with OpenID Connect (OIDC). The release workflow is intentionally tag-only, uses the protected `release` environment, and does not require `NPM_TOKEN` or `NODE_AUTH_TOKEN`.

## One-time npm Trusted Publisher setup

In npm package settings for `@naturaldevcr/vue-mail-designer`, add a Trusted Publisher with these exact fields:

- Provider: `GitHub Actions`
- Organization or user: `NaturalDevCR`
- Repository: `vue-mail-designer`
- Workflow filename: `publish.yml`
- Environment name: `release`
- Allowed action: `npm publish`

After this is configured, npm accepts publishes from `.github/workflows/publish.yml` when the workflow runs on a GitHub-hosted runner with OIDC enabled.

## What the workflow enforces

The publish workflow only runs for pushed tags matching `v*.*.*` and it will:

- use a GitHub-hosted Ubuntu runner
- use Node 24 and verify npm is at least 11.5.1
- install dependencies with `pnpm install --frozen-lockfile`
- run package gates for `@naturaldevcr/vue-mail-designer`: typecheck, test, and build
- verify the pushed tag exactly matches `packages/email-builder/package.json` as `v<version>`
- verify `packages/email-builder/package.json` points at `https://github.com/NaturalDevCR/vue-mail-designer`
- publish with `npm publish ./packages/email-builder --access public`

Because Trusted Publishing handles authentication automatically, do not add `NPM_TOKEN`, `NODE_AUTH_TOKEN`, or any other npm publish secret to this workflow.

## Future release flow

When you are ready to publish a new version:

1. Update only the version in `packages/email-builder/package.json`.
2. Run the same checks locally:
   - `pnpm install --frozen-lockfile`
   - `pnpm --filter @naturaldevcr/vue-mail-designer typecheck`
   - `pnpm --filter @naturaldevcr/vue-mail-designer test`
   - `pnpm --filter @naturaldevcr/vue-mail-designer build`
3. Commit the version bump.
4. Create a matching annotated or lightweight Git tag in the form `vX.Y.Z`.
5. Push the commit and the tag to GitHub.
6. Review the `Publish package` workflow run in the `release` environment.

This task intentionally does not bump the package version, create a release tag, push a tag, or run `npm publish`.
