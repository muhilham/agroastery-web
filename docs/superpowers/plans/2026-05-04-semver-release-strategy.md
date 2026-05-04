# Semver Release Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up release-please + tag-gated Railway prod deploys so `main` auto-deploys to staging and `vX.Y.Z` tags trigger human-approved Railway production deploys.

**Architecture:** Three GitHub Actions workflows + two release-please config files. No source code changes. `release-please.yml` runs on every `main` push and automates version bump PRs. `deploy-prod.yml` triggers on `v*.*.*` tag push, validates format, then runs Railway CLI under a GitHub environment approval gate.

**Tech Stack:** GitHub Actions, release-please v4, Railway CLI (`@railway/cli`), pnpm, Conventional Commits.

---

## File Map

| Action | Path |
|---|---|
| Create | `.github/workflows/release-please.yml` |
| Create | `.github/workflows/deploy-prod.yml` |
| Create | `release-please-config.json` |
| Create | `.release-please-manifest.json` |
| Create | `CHANGELOG.md` |

---

## Pre-flight: One-time Railway config

> Do this before merging the PR. Only needs to be done once.

In Railway dashboard:
1. Open the **production** environment for this project.
2. Find the service's deploy settings.
3. Disable (or disconnect) "Deploy on push to branch" / auto-deploy from `main`.

After this, Railway production will only deploy when `deploy-prod.yml` runs.

---

## Task 1: Create feature branch

- [ ] **Step 1: Create and switch to feature branch**

```bash
git checkout -b feat/semver-release-strategy
```

- [ ] **Step 2: Verify branch**

```bash
git branch --show-current
```
Expected output: `feat/semver-release-strategy`

---

## Task 2: Add release-please config files

**Files:**
- Create: `release-please-config.json`
- Create: `.release-please-manifest.json`
- Create: `CHANGELOG.md`

- [ ] **Step 1: Create `release-please-config.json`**

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "release-type": "node",
  "include-component-in-tag": false,
  "include-v-in-tag": true,
  "bump-minor-pre-major": false,
  "bump-patch-for-minor-pre-major": false,
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

- [ ] **Step 2: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('release-please-config.json','utf8')); console.log('valid')"
```
Expected: `valid`

- [ ] **Step 3: Create `.release-please-manifest.json`**

```json
{
  ".": "0.1.0"
}
```

- [ ] **Step 4: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('.release-please-manifest.json','utf8')); console.log('valid')"
```
Expected: `valid`

- [ ] **Step 5: Create `CHANGELOG.md`**

```markdown
# Changelog
```

- [ ] **Step 6: Commit**

```bash
git add release-please-config.json .release-please-manifest.json CHANGELOG.md
git commit -m "chore: add release-please config and manifest"
```

---

## Task 3: Create release-please GitHub Actions workflow

**Files:**
- Create: `.github/workflows/release-please.yml`

- [ ] **Step 1: Create `.github/workflows` directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create `.github/workflows/release-please.yml`**

```yaml
name: release-please

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json
```

- [ ] **Step 3: Validate YAML syntax**

```bash
node -e "
const fs = require('fs');
const content = fs.readFileSync('.github/workflows/release-please.yml', 'utf8');
// basic structure check — indentation errors would cause parse issues
const lines = content.split('\n');
const hasOn = lines.some(l => l.trim().startsWith('on:'));
const hasJobs = lines.some(l => l.trim().startsWith('jobs:'));
if (!hasOn || !hasJobs) throw new Error('missing on: or jobs:');
console.log('structure ok');
"
```
Expected: `structure ok`

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/release-please.yml
git commit -m "ci: add release-please workflow"
```

---

## Task 4: Create deploy-prod GitHub Actions workflow

**Files:**
- Create: `.github/workflows/deploy-prod.yml`

- [ ] **Step 1: Create `.github/workflows/deploy-prod.yml`**

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
            echo "Invalid tag format: $REF (must match v[0-9]+.[0-9]+.[0-9]+)"
            exit 1
          fi
          echo "Tag format valid: $REF"

  deploy:
    needs: validate-tag
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Checkout tag
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.ref || github.ref }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy to production
        run: railway up --service agroastery-web --environment production
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

> **Note:** Replace `agroastery-web` in the `railway up` command with the exact service name shown in Railway dashboard → project → Services.

- [ ] **Step 2: Validate YAML syntax**

```bash
node -e "
const fs = require('fs');
const content = fs.readFileSync('.github/workflows/deploy-prod.yml', 'utf8');
const lines = content.split('\n');
const hasOn = lines.some(l => l.trim().startsWith('on:'));
const hasJobs = lines.some(l => l.trim().startsWith('jobs:'));
const hasValidateTag = lines.some(l => l.includes('validate-tag'));
const hasDeploy = lines.some(l => l.trim() === 'deploy:');
const hasRailwayToken = lines.some(l => l.includes('RAILWAY_TOKEN'));
if (!hasOn || !hasJobs || !hasValidateTag || !hasDeploy || !hasRailwayToken) {
  throw new Error('missing required sections');
}
console.log('structure ok');
"
```
Expected: `structure ok`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy-prod.yml
git commit -m "ci: add tag-gated Railway production deploy workflow"
```

---

## Task 5: Create PR

- [ ] **Step 1: Push branch**

```bash
git push -u origin feat/semver-release-strategy
```

- [ ] **Step 2: Create PR**

```bash
gh pr create \
  --title "ci: add semver release strategy with release-please and Railway prod deploy" \
  --body "$(cat <<'EOF'
## Summary
- Adds release-please automation: version bumps, CHANGELOG, and GitHub Release on each merge to main
- Adds tag-gated Railway production deploy workflow (human approval required via GitHub environment gate)
- Staging continues to auto-deploy from main via Railway git integration (no change needed)

## Pre-merge checklist
- [ ] Disable Railway production environment auto-deploy from main (Railway dashboard)
- [ ] Add `RAILWAY_TOKEN` secret to GitHub repo (Settings → Secrets → Actions)
- [ ] Create `production` GitHub environment with required reviewer (Settings → Environments)
- [ ] Confirm Railway service name matches `agroastery-web` in deploy-prod.yml (or update it)

## Test plan
- Merge this PR → release-please opens a `chore(main): release 0.2.0` PR automatically
- Validate that PR contains package.json bump + CHANGELOG entry
- Merge the release PR → tag `v0.2.0` created → deploy-prod.yml triggers → approve gate → Railway prod deploys
- Verify staging still auto-deploys from main

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Post-merge: Required GitHub config

These are one-time manual steps after the PR is merged:

1. **Add `RAILWAY_TOKEN` secret**
   - Railway dashboard → account settings → Tokens → create token with deploy access
   - GitHub repo → Settings → Secrets and variables → Actions → New repository secret → `RAILWAY_TOKEN`

2. **Create `production` GitHub environment with approval gate**
   - GitHub repo → Settings → Environments → New environment → name: `production`
   - Enable "Required reviewers" → add yourself

3. **Confirm Railway service name**
   - Railway dashboard → project → Services → note the exact service name
   - If it differs from `agroastery-web`, update `.github/workflows/deploy-prod.yml` line:
     `railway up --service <actual-name> --environment production`
