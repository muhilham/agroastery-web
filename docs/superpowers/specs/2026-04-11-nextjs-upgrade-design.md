# Next.js Upgrade: 15.1.2 → 16.2.3

**Date:** 2026-04-11
**Branch:** `chore/upgrade-nextjs-16`

## Context

`next@15.1.2` has 23 known vulnerabilities including two critical CVEs:

| CVE | Severity | Issue | Fixed in |
|---|---|---|---|
| GHSA-9qr9-h5gf-34mp | Critical | RCE in React flight protocol | ≥15.1.9 |
| GHSA-f82v-jwr5-mffw | Critical | Authorization Bypass in Middleware | ≥15.2.3 |
| GHSA-67rr-84xm-4c7r | High | DoS via cache poisoning | ≥15.1.8 |
| GHSA-mwv6-3258-q52c | High | DoS via Server Components | ≥15.1.10 |
| + 19 more | low–high | Various | ≥15.x |

The middleware CVE is particularly relevant: this project uses `middleware.ts` for Supabase auth session refresh on every request.

## Decision

Upgrade to **Next.js 16.2.3** (current latest stable) rather than the minimum patch version, because:
- React 19 is already in use (required peer for Next.js 16)
- `next.config.ts` uses only stable, unchanged config keys
- Turbopack `--turbopack` dev flag is already in use and is now stable in Next.js 16
- No experimental flags to migrate

## Package Changes

| Package | From | To | Location |
|---|---|---|---|
| `next` | `15.1.2` | `16.2.3` | `dependencies` |
| `eslint-config-next` | `15.1.2` | `16.2.3` | `devDependencies` |
| `@next/eslint-plugin-next` | `^15.3.1` | `^16.2.3` | `devDependencies` |
| `@vercel/og` | `^0.6.4` | removed | `dependencies` |

`@vercel/og` is removed because it is confirmed unused; Next.js 16 ships `next/og` built-in.

No changes to `react`, `react-dom`, or any other dependency.

## Compatibility Notes

- **`next.config.ts`**: Only uses `output`, `images`, `trailingSlash`, `skipTrailingSlashRedirect` — all stable and unchanged in Next.js 16.
- **`middleware.ts`**: Session-refresh-only pattern; no route protection logic that could be affected by the middleware auth CVE pattern.
- **React 19**: Already in use. Next.js 16 requires React 19 — no change needed.
- **Turbopack**: Dev script already uses `--turbopack`. No flag changes needed.

## Verification Steps

1. `pnpm install` — resolve new lockfile
2. `pnpm build` — confirm no TypeScript or config errors
3. `pnpm lint` — confirm ESLint passes with aligned `eslint-config-next@16`

If `pnpm build` passes cleanly, no code changes are expected beyond `package.json`.

## Deployment

Railway auto-deploys on merge to `main`. No additional deployment steps required.
