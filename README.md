# Military-Grade Vibe Coding Template ｜ 軍工級 Vibe Coding 通用模板框架

A monorepo template that brings high-reliability engineering guardrails into AI-assisted frontend development — without the overhead.

一個將高可靠工程思維以低成本方式嵌入 AI 輔助前端開發流程的 Monorepo 模板框架。

---

## Tech Stack ｜ 技術棧

Next.js 16 · React 19.2 · TypeScript strict · Tailwind CSS · Turborepo · npm workspaces

Default deployment target: **Vercel**

---

## Core Philosophy ｜ 核心哲學

1. **No spec, no code** — 不寫 spec 不寫碼
2. **Runtime contracts for all external I/O** — 所有外部 I/O 必須有 runtime contract
3. **AI output must be traceable** — AI 產出可追溯
4. **Fault isolation per section** — 區塊故障不拖垮整頁
5. **Guard pipeline: local + CI, fail = block** — Guard 管線可本地跑、可 CI 跑、失敗即阻斷
6. **Reducers over useState sprawl** — 超過 3 個相關 useState 時考慮 reducer / state machine
7. **Minimal, auditable, extensible** — 最小、可審核、可擴充，不做過度工程

---

## Project Phases ｜ 專案階段

| Phase | Topic | Status |
|-------|-------|--------|
| 0 | Monorepo Skeleton | ✅ Done |
| 1 | AI / Cursor Rules | ✅ Done |
| 2 | UI Core | ✅ Done |
| 3 | Contracts Baseline | ✅ Done |
| 4 | CI Guards | ✅ Done |
| 5 | OpenSpec Integration | ✅ Done |
| 6 | Page Generator CLI | ✅ Done |
| 7 | AI Audit Log Baseline | ✅ Done |
| 8 | Production Pipeline | ✅ Done |

> Phases above track **template infrastructure readiness**. The active development phase for projects built from this template is defined in `openspec/project.md`.

---

## Quick Start ｜ 快速開始

```bash
npm install
npm run dev
```

---

## Common Commands ｜ 常用指令

**Development ｜ 開發**

```bash
npm run dev              # Start dev server
npm run build            # Production build
```

**Guards ｜ 品質檢查**

```bash
npm run guard:all        # Run all guards (specs + types + lint + contracts + ppr)
npm run guard:specs      # Spec format validation
npm run guard:types      # TypeScript strict check
npm run guard:lint       # ESLint check
npm run guard:contracts  # Contract schema verification
npm run guard:ppr        # Verify cacheComponents: true
```

**Generators ｜ 產生器**

```bash
npm run gen:contracts                        # Generate contracts from specs
npm run gen:page -- <group> <name> <mode>    # Generate page (static|dynamic|ppr)
```

`<group>` uses `_root` for no route group. Otherwise the CLI converts it to `(group)`.

**Audit ｜ 稽核**

```bash
npm run audit:gen:contracts                       # gen:contracts with audit log
npm run audit:gen:page -- <group> <name> <mode>   # gen:page with audit log
npm run audit:guard:all                           # guard:all with audit log
npm run audit:verify                              # Verify audit log integrity
```

**Deploy ｜ 部署**

```bash
npm run verify:env       # Check required env vars against .env.example
npm run deploy:check     # Full deploy readiness check (guards + build + env)
```

---

## Environment Variables ｜ 環境變數

Copy `.env.example` to `.env` and fill in values.

```bash
cp .env.example .env
```

Keys marked `# required` in `.env.example` will cause `deploy:check` to fail if missing. Keys marked `# optional` are informational only.

---

## Deploy Workflow ｜ 部署流程

The repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml`:

- Trigger: **manual dispatch only** (`workflow_dispatch`)
- Steps: install → deploy-check (guards + build + env) → provider deploy
- The provider deploy step is a placeholder — configure it for your target (Vercel, Cloudflare Pages, AWS, etc.)

---

## Design Documentation ｜ 設計文件

Detailed design lives in OpenSpec:

```
openspec/project.md
```

This README is the quick-start entry point. For architecture decisions, phase details, and contract design, refer to `openspec/project.md`.

---

## Monorepo Structure ｜ Repo 結構

```
apps/
  web/                → Next.js 16 App Router application
packages/
  ui/                 → Shared UI components (FaultIsolatedSection, DynamicSection, etc.)
  contracts/          → Runtime contracts (domain-folder structure)
  machines/           → State machines
scripts/              → Guard, generator, audit, and deploy scripts
templates/            → Handlebars page templates (static, dynamic, ppr)
openspec/             → OpenSpec design documentation
.skills/              → Agent Skills (source of truth for all AI rules)
.cursor/rules/        → Cursor adapter (single bridge file pointing to .skills/)
.ai-audit/            → AI audit log (runtime artifact, not committed)
.github/workflows/    → CI guard + deploy workflows
```
