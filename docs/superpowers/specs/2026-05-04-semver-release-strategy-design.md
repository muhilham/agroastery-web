# Semantic Versioning & Release Strategy

**Date:** 2026-05-04
**Status:** Approved
**Hosting:** Railway (staging + production environments)
**Reference:** Ported from agr-ops release process

---

## Overview

Adopt semantic versioning (`vX.Y.Z`) for production releases. Production deploys are triggered by git tag pushes, not `main` pushes. `release-please` automates version bumps and CHANGELOG generation via Conventional Commits.

---

## Environments

| Env | Source | Trigger | Who deploys |
|---|---|---|---|
| staging | `main` HEAD | Railway git auto-deploy (existing) | automatic |
| production | `vX.Y.Z` tag | `deploy-prod.yml` GH Action | Railway CLI, human-gated |

**Required one-time change:** Disable Railway production environment's auto-deploy from `main`. After this, prod only deploys when `deploy-prod.yml` runs.

---

## Branching Model

- `main` is the only long-lived branch. Must always be releasable.
- Feature branches PR into `main` using Conventional Commits.
- Commit prefix → version bump:
  - `feat:` → minor
  - `fix:` → patch
  - `feat!:` / `BREAKING CHANGE:` → major
  - `chore:` → no bump, hidden from CHANGELOG

---

## release-please Setup

Three files added to repo root:

### `release-please-config.json`

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "release-type": "node",
  "include-component-in-tag": false,
  "include-v-in-tag": true,
  "packages": {
    ".": {
      "package-name": "agroastery-web",
      "changelog-sections": [
        { "type": "feat", "section": "Features" },
        { "type": "fix", "section": "Bug Fixes" },
        { "type": "perf", "section": "Performance" },
        { "type": "refactor", "section": "Refactors" },
        { "type": "test", "section": "Tests" },
        { "type": "docs", "section": "Documentation" },
        { "type": "chore", "hidden": true }
      ]
    }
  }
}
```

### `.release-please-manifest.json`

Tracks current version. Initial value: `{ ".": "0.1.0" }`.

### `.github/workflows/release-please.yml`

Triggers on push to `main`. Runs `googleapis/release-please-action@v4` with the config and manifest files above.

On each `main` push, release-please opens or updates a PR titled `chore(main): release X.Y.Z` containing:
- `package.json` version bump
- `CHANGELOG.md` entry
- `.release-please-manifest.json` update

Merging that PR creates the git tag `vX.Y.Z` and a GitHub Release → triggers `deploy-prod.yml`.

---

## Cutting a Release (Normal Flow)

1. Merge feature PRs to `main` as usual.
2. release-please opens/updates the release PR automatically.
3. Validate the candidate on the Railway staging URL.
4. Merge the release PR.
5. release-please creates tag `vX.Y.Z` + GitHub Release.
6. Tag push triggers `deploy-prod.yml`. Approve the `production` environment gate when prompted.
7. Verify Railway prod URL serves the new version.

---

## `deploy-prod.yml` Workflow

```yaml
name: deploy-prod

on:
  push:
    tags:
      - 'v*.*.*'
  workflow_dispatch:
    inputs:
      ref:
        description: 'Tag to deploy (e.g. v1.0.0). Used for rollback re-deploys.'
        required: true
        type: string

jobs:
  validate-tag:
    runs-on: ubuntu-latest
    steps:
      - name: Validate tag format
        run: |
          REF="${{ github.event.inputs.ref || github.ref_name }}"
          if [[ ! "$REF" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "Invalid tag format: $REF"
            exit 1
          fi

  deploy:
    needs: validate-tag
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.ref || github.ref }}

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy to production
        run: railway up --service agroastery-web --environment production
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

> **Note:** Replace `agroastery-web` with the exact service name shown in Railway dashboard → project → Services.

Key difference from agr-ops: Railway CLI replaces Vercel CLI. Railway builds from source on their infra — no separate local build step needed.

---

## Rollback

**Fast (recommended):** Railway UI → project → production environment → Deployments → "Redeploy" on a prior deployment.

**Tag-based redeploy:**

```bash
gh workflow run deploy-prod.yml --ref v1.0.0 -f ref=v1.0.0
```

---

## Hotfix Process

When prod is on `vX.Y.Z` and you must ship a fix without picking up unreleased work on `main`:

```bash
git fetch --tags
git checkout -b hotfix/vX.Y.Z vX.Y.(Z-1)

# write fix, commit with `fix:` prefix
# manually bump package.json version → X.Y.Z
# manually add CHANGELOG.md entry
git commit -m "chore: release X.Y.Z"

git tag vX.Y.Z
git push origin hotfix/vX.Y.Z
git push origin vX.Y.Z        # triggers deploy-prod.yml

# after deploy verified, backport to main:
git checkout main && git pull
git cherry-pick <fix-sha>
git push origin main

# cleanup:
git push origin :hotfix/vX.Y.Z
git branch -d hotfix/vX.Y.Z
```

release-please will roll the cherry-picked fix into the next normal release PR.

---

## Required GitHub Secrets & Config

| Item | Value |
|---|---|
| `RAILWAY_TOKEN` | Railway token with deploy permission for production service |
| GitHub Environment `production` | Repo → Settings → Environments → `production` → Required reviewers |

---

## Do NOT

- Edit `version` in `package.json` by hand for normal releases — release-please owns it.
- Re-enable Railway production auto-deploy from `main`.
- Push `v*.*.*` tags manually for normal releases — hotfixes only.
