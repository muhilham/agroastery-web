# Node LTS 24 Upgrade Design

2026-07-31

## Goal
Upgrade the project's Node.js runtime requirement to LTS 24, update all version constraints, and verify the application still builds and tests pass.

## Context
- `.nvmrc` already says `lts/*` (resolves to 24.x today)
- `package.json` `engines.node` is `>=20.0.0`
- `package.json` `@types/node` is `^20`
- GitHub workflow `deploy-prod.yml` pins `node-version: '20'`

## Changes

### 1. package.json
- `engines.node`: `>=20.0.0` → `>=24.0.0`
- `devDependencies.@types/node`: `^20` → `^24`

### 2. .github/workflows/deploy-prod.yml
- `node-version: '20'` → `node-version: '24'`

### 3. .nvmrc
- No change — `lts/*` already resolves to 24.x

### 4. pnpm-lock.yaml
- Regenerate via `pnpm install` after `@types/node` bump

## Verification Plan
1. `pnpm install` — lockfile regenerates cleanly
2. `pnpm test` — all tests pass
3. `pnpm build` — build succeeds
4. `pnpm lint` — lint passes

## Risk Assessment
- Low risk. This is a config-only change.
- Dependencies already support Node 24 (many have `>=24` in their engine ranges).
- No application code changes expected.
