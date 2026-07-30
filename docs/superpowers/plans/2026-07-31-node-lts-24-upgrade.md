# Node LTS 24 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the project's Node.js runtime requirement to LTS 24 and verify everything works.

**Architecture:** Config-only changes to package.json, GitHub workflow, and lockfile. No application code changes.

**Tech Stack:** Next.js 16, pnpm, Node.js 24, Vitest

---

### Task 1: Update package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Bump engines.node**

Change `"node": ">=20.0.0"` to `"node": ">=24.0.0"`

- [ ] **Step 2: Bump @types/node**

Change `"@types/node": "^20"` to `"@types/node": "^24"`

---

### Task 2: Update GitHub workflow

**Files:**
- Modify: `.github/workflows/deploy-prod.yml`

- [ ] **Step 1: Bump node-version in deploy-prod.yml**

Change `node-version: '20'` to `node-version: '24'`

---

### Task 3: Regenerate lockfile and verify

**Files:**
- Modify: `pnpm-lock.yaml` (regenerated)

- [ ] **Step 1: Delete node_modules and lockfile, reinstall**

Run: `rm -rf node_modules pnpm-lock.yaml && pnpm install`

- [ ] **Step 2: Run tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 3: Run build**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Run lint**

Run: `pnpm lint`
Expected: Lint passes

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml .github/workflows/deploy-prod.yml docs/superpowers/
git commit -m "chore: upgrade Node.js runtime to LTS 24"
```
