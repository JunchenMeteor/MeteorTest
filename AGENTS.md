# AGENTS.md

Guidance for AI coding agents working in this repository.

MeteorTest is a general-purpose automated testing platform. It has a Next.js web console, a Python Local Agent, Supabase migrations, shared protocol types, and example test-project contracts.

Use this file as the first project-specific context before editing code.

## Project Map

```text
apps/web/                 Next.js web console
agent/                    Python Local Agent implementation
docs/                     Documentation index, roadmaps, runbooks, protocol examples
packages/shared/          Shared TypeScript protocol types
supabase/migrations/      Database schema migrations
DESIGN.md                 Product and architecture design
PROGRESS.md               Current progress index; detailed plans live in docs/
README.md                 English setup and project overview
README.zh-CN.md           Simplified Chinese mirror of README.md
```

## Read First

Before making non-trivial changes, read the relevant source plus:

- `README.md` and `README.zh-CN.md` for setup, architecture, and validation flow.
- `docs/README.md` and `docs/README.zh-CN.md` for the documentation map and read order.
- `DESIGN.md` for product and protocol intent.
- `PROGRESS.md` for current implementation status. Do not add large implementation plans there; link to focused docs instead.
- `docs/supabase-account-data-runbook.md` and `docs/supabase-account-data-runbook.zh-CN.md` for Auth/RLS and account-data SQL execution.
- `docs/local-agent-operations.md` and `docs/local-agent-operations.zh-CN.md` for Local Agent daemon and runtime behavior.
- `docs/private-agent-preview-loop.md` and `docs/private-agent-preview-loop.zh-CN.md` for public Web plus private Agent validation.
- `agent/README.md` before changing Local Agent behavior.
- `docs/meteortest.example.yml` before changing suite import or contract parsing.

Do not rely only on file names. This repo contains platform code, test execution code, and protocol definitions with different ownership boundaries.

## Core Architecture

MeteorTest is split into three responsibilities:

1. **Web Console**
   - Lives in `apps/web`.
   - Owns UI, API routes, Supabase client/server access, AI assistant surfaces, task creation, reports, builds, projects, settings, and executor views.

2. **Local Agent**
   - Lives in `agent`.
   - Polls tasks, prepares artifacts, executes suite commands, captures logs, writes reports, and updates task state.
   - It is the platform executor reference implementation, not part of any individual test repository.

3. **Test Project Contract**
   - Uses `meteortest.yml`.
   - Test projects expose suites and commands through this file.
   - MeteorTest should preserve compatibility with existing contract field names such as `id`, `key`, and `suite_key`.

## Web UI Direction

The web console should feel like a restrained operations console, with visual inspiration from `JunchenMeteor/junchen-meteor` but without turning product pages into marketing pages.

- Treat the target product direction as an **engineering testing console**, not a decorative dashboard or a generic admin template.
- Combine three reference families deliberately:
  - CI / DevOps consoles for task status, execution history, failure details, logs, and run detail layouts.
  - Test reporting / QA platforms for project, suite, case, report, failure-analysis, executor, and device dimensions.
  - AI workspaces for actionable AI entry points: project import, suite import, task creation, report inspection, failure analysis, and next-step suggestions.
- Do not simply copy one product family. MeteorTest should present a testing control plane, local executor scheduling, report center, and AI operations surface as one coherent workflow.
- Concrete page direction: the homepage should show what happened today, Projects should emphasize integration status, Tasks should emphasize the execution queue, Reports should emphasize failure reason and next action, and AI should feel like an operation command surface rather than a plain chat page.
- Use the theme token system in `apps/web/app/globals.css` instead of hard-coded page colors.
- Keep page structure consistent: page header, primary action, filters, data panel, status badges, and forms should use the shared semantic classes where possible.
- Theme selection lives in Settings and is stored in `meteortest.settings.v1`.
- Current supported themes are `meteor`, `indigo`, `dune`, `aurora`, `parchment`, `sky`, `glacier`, and `sakura`.
- Theme ordering should group dark themes first, then light themes: `meteor`, `indigo`, `dune`, `aurora`, `parchment`, `sky`, `glacier`, `sakura`.
- New pages should support theme changes automatically by using CSS variables such as `--bg-card`, `--border`, `--accent`, `--text-secondary`, and shared classes like `data-panel`, `primary-action`, `secondary-action`, `chip-action`, `toggle-control`, `quiet-scrollbar`, `field-input`, `status-badge`, and `link-action`.
- Interactive controls must use control-specific tokens such as `--control-on-bg`, `--control-on-border`, and `--control-on-thumb`; do not bind switches directly to `--accent` when that creates poor contrast in light themes.
- Desktop WebUI layouts should use proportional columns instead of fixed pixel sidebars. Prefer shared classes such as `proportional-layout`, `proportional-layout-three`, and page-specific proportional variants; mobile layouts remain single-column unless a page has a deliberate mobile card/table pattern.
- Do not reintroduce fixed desktop sidebar columns such as `320px`, `360px`, or `xl:grid-cols-[minmax(0,1fr)_320px]` for main page structure. If a control needs a fixed intrinsic size, keep it inside the proportional column rather than making the page layout fixed-width.
- WebUI changes should include a basic mobile/responsive pass. If proper mobile adaptation would materially expand the change, split it into a separate task or PR and record that follow-up instead of burying the gap.
- In this project, "small screen" means a 12-14 inch laptop browser window, not a phone. Treat "large screen" as 27/31 inch desktop or wider. Only interpret "phone", "mobile", or "手机屏/移动端" as phone-sized layouts.
- Mobile WebUI must remain inspectable after layout changes: the app shell should not rely on a permanent desktop sidebar below tablet width, tables should have a card or otherwise readable mobile representation when they are central to the workflow, and action buttons must wrap or stack without being clipped.
- Dashboard, Projects, and Tasks should continue moving toward the engineering testing console direction: Dashboard shows current operating state, Projects show integration readiness and next action, and Tasks show execution queue health before raw rows.
- After WebUI layout, theme, or responsive changes, use `docs/webui-visual-checklist.md` and `docs/webui-visual-checklist.zh-CN.md` as the visual acceptance checklist. Keep the checklist aligned when validation expectations change.
- Theme token work should distinguish between page theme brightness and actual component background. If a component uses a dark action background inside a light theme, use light foreground text; if it uses a light action background, use dark foreground text. Prefer semantic tokens such as `--action-primary-bg`, `--action-primary-text`, `--action-selected-bg`, `--action-selected-text`, and `--accent-solid-text`.
- UI changes must be implemented together with the locale content they display. When adding or changing labels, headings, empty states, helper text, table headers, buttons, status text, or user-facing fallback messages, update `apps/web/content/i18n.ts` in the same change and consume the value through `getDictionary()` or `useLocale()`.
- Do not merge UI-only wording changes that bypass the i18n layer. Hard-coded UI text is only acceptable for stable product names, technical identifiers, user data, route names, or third-party names.
- Browser-facing routes, forms, API responses, AI prompts, and exports must use public references or DTO/View Model fields, not raw database UUIDs. Use `projects.key`, `suite_key`, `tasks.display_id`, `app_builds.display_id`, and `executors.name`; resolve internal IDs only inside server routes, Supabase queries, or the private Agent.
- Do not return raw Supabase rows from API routes. Shape browser responses through explicit DTOs and keep `id`, `*_id`, and `user_id` out of browser payloads unless there is a deliberate admin-only debug surface.
- Web-side automation and validation scripts should use TypeScript (`.ts` or `.mts`) when project tooling allows it. Avoid adding ad hoc `.js` or `.mjs` scripts for Web work unless the file is a framework-required config file or there is a documented runtime constraint.

## Internationalization Direction

MeteorTest Web UI uses a typed content-configuration i18n layer, following the approach used by `JunchenMeteor/junchen-meteor`.

- Keep locale copy in typed content modules instead of scattering bilingual string literals across components.
- Start with `zh-CN` and `en`.
- Define supported locales through a shared `supportedLocales` list and normalize unknown values through a generic helper. Do not hard-code binary language checks such as `value === 'en' ? 'en' : 'zh-CN'`.
- Server components should use `getLocale()` and `getDictionary()` from `apps/web/lib/i18n.ts`.
- Client components should use `useLocale()` from `apps/web/lib/useLocale.ts`.
- The selected language is stored in the `meteortest.locale` cookie and controlled from Settings.
- Page metadata, navigation labels, settings labels, AI templates, empty states, form labels, table headers, status labels, and user-visible fallback messages should all use the locale source.
- When adding or changing user-visible UI copy, update `apps/web/content/i18n.ts` first and then consume the key from code. Do not add new inline Chinese/English UI literals except stable product names, user data, or technical identifiers.
- When refactoring UI layout or interaction, re-check both `zh-CN` and `en` copy paths. The layout must tolerate longer English strings and denser Chinese labels without overlap or clipped controls.
- When i18n behavior changes, update README files, `DESIGN.md`, `PROGRESS.md`, and this file in the same PR.

## Setup

### Web

```bash
cd apps/web
npm ci
```

For local development:

```bash
cd apps/web
npm run dev:local
```

MeteorTest WebUI local preview is fixed to `http://127.0.0.1:3000`. Use `npm run dev:local` after WebUI changes; it stops an existing process on port 3000, starts Next.js with public-preview/local-preview safety defaults, and writes logs to `apps/web/.next/dev-local.log`. Do not ask the user to remind you to restart port 3000 after WebUI changes.

The web app expects Supabase environment variables in `apps/web/.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
DEEPSEEK_API_KEY optional
```

Use `apps/web/.env.local.example` as the committed template. Do not commit `.env.local` or real keys.

For public Web preview work:

- Configure environment variables in the deployment provider, not in committed files.
- Treat `NEXT_PUBLIC_*` variables as browser-visible.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `DEEPSEEK_API_KEY`, local repository paths, and Agent runtime settings server-only or private.
- Do not expose the Local Agent or local executor endpoints directly to the public internet.
- Connected execution must use a private Agent polling the backend with scoped credentials.
- Update README files and `PROGRESS.md` in the same PR when deployment behavior or boundaries change.
- Follow the public preview deployment runbook in `apps/web/README.md` before opening a live public URL. Do not skip directly to connected execution.
- For Vercel deployment, follow `docs/vercel-public-preview.md` and `docs/vercel-public-preview.zh-CN.md`.
- The current public preview URL is `https://meteortest.jcmeteor.com/`.
- Current status is recorded in `PROGRESS.md`; detailed public preview and private Agent steps live in the docs runbooks.
- Public preview deployments should set `METEORTEST_AGENT_DISABLED=1` and `METEORTEST_PUBLIC_PREVIEW=1`.
- Public preview access control is handled by Supabase Auth and RLS. Do not reintroduce a separate shared preview-token gate unless the access model is redesigned and documented.
- In public preview mode, `/api/agent/status` and the Executors page must never attempt to start a machine-local Agent. They should show a clear disabled/unavailable state and instruct the operator to run the Agent privately.
- Do not add public Web preview links to the personal website without preserving this boundary: Web preview is online, Local Agent execution is private, and public connected execution is deferred.

### Agent

```bash
python -m pip install -r agent/requirements.txt
```

Agent config is based on:

```text
agent/config.example.yaml
```

For local use, copy it to `agent/config.yaml` and edit local paths or Supabase settings. Do not commit local machine paths or service-role secrets.

## Validation Commands

Run the smallest meaningful validation for the change.

### Web changes

```bash
cd apps/web
npm run lint
npm run build
```

Use `npm ci` rather than `npm install` when installing dependencies for verification.

### Agent changes

```bash
python -m compileall agent
python -m pytest agent/tests -q
```

### Shared protocol or cross-cutting changes

Run both Web and Agent validation:

```bash
cd apps/web
npm run lint
npm run build
cd ../..
python -m compileall agent
python -m pytest agent/tests -q
```

### CI reference

GitHub Actions uses:

- Node.js `22`
- Python `3.12`
- `npm ci`
- `npm run lint`
- `npm run build`
- `python -m compileall agent`
- `python -m pytest agent/tests -q`

Keep local validation aligned with `.github/workflows/ci.yml`.

## Harness Engineering Practices

Treat this repository as a platform plus execution harness. Changes should improve repeatability, observability, controllability, or validation.

Use these principles:

1. **Make context explicit**
   - Put durable project rules in this file, `README.md`, `DESIGN.md`, or protocol examples.
   - Do not leave important setup knowledge only in chat.

2. **Prefer reproducible commands**
   - Add or update scripts, tests, examples, or docs when a workflow requires exact steps.
   - Avoid one-off manual instructions when the same check will be needed again.

3. **Protect contracts**
   - Treat `meteortest.yml` as an external integration contract.
   - Preserve backward compatibility unless the task explicitly requests a breaking protocol change.
   - Update `docs/meteortest.example.yml`, shared types, import code, and docs together when protocol fields change.

4. **Close the validation loop**
   - For bug fixes, identify the failing path or add a focused regression test when practical.
   - For feature work, define the observable behavior and run the relevant validation command.
   - Report any validation you could not run and why.

5. **Improve observability**
   - Agent and task-flow changes should preserve or improve status, logs, artifacts, errors, and report metadata.
   - Prefer structured states and explicit error messages over silent fallbacks.

6. **Keep execution controlled**
   - The Local Agent runs commands from test project contracts. Treat command execution paths, artifact downloads, and environment variables as security-sensitive.
   - Do not add broad remote execution, credential exposure, or arbitrary filesystem access without explicit design.

7. **Separate control plane from executors**
   - Web/Supabase owns task state and metadata.
   - Local Agent owns local execution.
   - Test repositories own test commands and app-specific automation.
   - Avoid moving responsibilities across these boundaries without updating design docs.

## Editing Rules

- Keep changes scoped to the user request.
- Prefer existing project patterns over introducing new frameworks.
- Do not reformat unrelated files.
- Do not commit generated reports, local artifacts, `.env*`, `.meteortest-agent/`, or machine-specific config.
- Do not add new dependencies unless necessary; explain why in the final response or PR description.
- When changing database shape, add a new migration under `supabase/migrations/`; do not edit already-applied migrations unless the user explicitly asks for a history rewrite.
- When changing API response shapes, check affected UI components, shared types, and Agent clients.
- When changing Agent task lifecycle behavior, check local JSON mode and Supabase mode where applicable.
- Destructive project-management actions must be explicit in the UI, require user confirmation, and stay disabled in `METEORTEST_PUBLIC_PREVIEW=1` unless a separate access-control design is implemented.
- Keep `README.md` and `README.zh-CN.md` aligned. `README.md` is the English primary README, and `README.zh-CN.md` is the Simplified Chinese mirror. When updating either file, keep structure, claims, setup steps, limitations, roadmap, diagrams, and validation instructions equivalent. If a Chinese phrasing does not translate well, adjust the Chinese text too instead of letting the two versions diverge.

## GitHub Workflow Rules

Before creating a new work branch, sync the latest `main` first.

For repositories where the active GitHub account only has fork access:

```bash
git switch main
git fetch origin main
git merge origin/main
git push fork main
git switch -c dev/v-peq/changeName
```

For repositories where the active GitHub account can push branches directly:

```bash
git switch main
git pull origin main
git switch -c dev/v-peq/changeName
```

Release policy:

- `main` is the integration and Tencent preview deployment branch.
- `release` is the Tencent production deployment branch.
- Keep feature work flowing into `main` first, then promote `main` to `release` through a PR after validation.
- Do not cherry-pick selectively into `release` unless the user explicitly requests an emergency hotfix; sync any hotfix back to `main`.
- Tencent Docker deployment mapping and PM2 migration are documented in `docs/tencent-docker-deployment.md`.

Branch names should use:

```text
dev/v-peq/<lowerCamelOrSnakeName>
```

When direct pushes to `main` are not allowed:

- Create a feature branch.
- Push the branch to the fork or writable remote.
- Create the issue and pull request in the upstream repository.
- Do not push directly to upstream `main`.

Issue and PR titles should start with one of the repository type prefixes below. Use the closest existing type instead of inventing a new prefix:

- `[Feature]` for new features, improvements, refactors, maintenance, and platform capability changes.
- `[Bug]` for defects and regressions.
- `[Test]` for test coverage, validation, fixtures, and CI test behavior.
- `[Documentation]` for README, architecture notes, setup guides, and agent instructions.
- `[Security]` for dependency or security hardening changes.
- `[Smoke test]` for smoke-test work.
- `[Known Issues]` for known issue tracking.

Use the same prefix family for the tracking issue and its PR when they describe the same work. If a change spans multiple areas, choose the dominant user-visible intent. For example, docs plus workflow guidance should usually be `[Documentation]`; protocol/runtime behavior plus docs should usually be `[Feature]`.

Add GitHub labels to issues according to the selected prefix when the authenticated account has permission:

- `[Feature]` issues must use `enhancement`.
- `[Bug]` issues must use `bug`.
- `[Test]` and `[Smoke test]` issues must use `test`.
- `[Documentation]` issues must use `documentation`.
- `[Security]` issues must use `security`.
- `[Known Issues]` issues must use `known issue`.

If label permission is missing, state that limitation in the handoff instead of silently claiming the rule was fully applied.

Issue and PR descriptions should use English. Use simple section headings such as `## Summary`, `## Proposed Changes`, and `## Test Plan`.

When an issue tracks the PR work, link it from the PR body with:

```text
Closes #<issue-number>
```

Place the `Closes #<issue-number>` line at the end of the PR description, after the test plan or validation section.

Do not add `Related PR: #<number>` to the issue body.

Use fresh GitHub data when checking issue or PR state. Prefer `gh api --cache 0s` or direct `gh api` calls before deciding whether an issue or PR already exists.

Do not add `Co-Authored-By` or AI attribution to commit messages.

Git authors and committers must use an approved human identity (`Connor`, `ConnorQi`, or `JunchenMeteor`). Bot, automation, AI-tool, and agent identities such as `github-actions[bot]` are forbidden. Automated commits must use `JunchenMeteor <15767428+JunchenMeteor@users.noreply.github.com>`.

## Security And Secrets

Never commit or print real values for:

- Supabase service-role keys
- Supabase anon keys if they belong to a real non-demo project
- DeepSeek or OpenAI API keys
- App artifact private URLs
- Local device identifiers that should remain private
- Internal build URLs

Use placeholder values in docs and examples.

## Supabase Notes

Migrations are ordered:

```text
supabase/migrations/001_init.sql
supabase/migrations/002_app_builds.sql
supabase/migrations/003_constraints.sql
```

When adding migrations:

- Use a new numbered migration.
- Keep schema changes compatible with existing Web and Agent code.
- Update README setup instructions if manual migration steps change.
- Consider Storage bucket behavior for reports and artifacts.

## Local Agent Notes

Before changing Agent behavior, inspect:

```text
agent/agent.py
agent/services/
agent/executors/
agent/reporters/
agent/tests/
```

Agent behavior should preserve:

- executor registration or status updates
- queued task polling
- task locking before execution
- artifact preparation
- suite command execution
- logs and report artifact capture
- final task/report state updates

Handle failures explicitly. A failed suite, missing artifact, contract parse error, and platform update error should be distinguishable in logs or state when practical.

## Web Notes

Before changing Web behavior, inspect the related page/component/API route under:

```text
apps/web/app/
apps/web/components/
apps/web/lib/
```

Supabase access is split between client and server helpers:

```text
apps/web/lib/supabase/client.ts
apps/web/lib/supabase/server.ts
```

Keep UI text and workflows consistent with the Chinese product name:

```text
星流测试台
```

Keep `MeteorTest` as the engineering/product English name.

### Next.js Route File Structure

Next.js App Router requires route entry files such as `page.tsx`; do not rename those files directly or routes will break.

For app-wide request interception in Next.js 16, use `apps/web/proxy.ts`. Do not add new `middleware.ts` files; that convention is deprecated in the current Next.js version.

For non-trivial pages, keep `page.tsx` as a thin route entry and move business UI into a named sibling component, for example:

```text
apps/web/app/tasks/page.tsx        route entry only
apps/web/app/tasks/TasksPage.tsx   page implementation
```

Use this pattern when a page grows beyond a small route wrapper, or when searchability suffers from many same-named `page.tsx` files. Do not mix broad file-structure moves into feature PRs unless the user explicitly asks for that refactor.

New or refactored route pages should follow this structure from the start: route-level `page.tsx` remains a thin entry, while the actual implementation lives in a named page component such as `ReportsPage.tsx`, `ProjectDetailPage.tsx`, or `NewTaskPage.tsx`.

## AI Assistant Notes

The AI assistant should operate through platform context and tools rather than guessing.

When changing AI assistant behavior:

- Keep project/task/report operations auditable.
- Avoid exposing secrets or large raw logs unnecessarily.
- Prefer task IDs, project IDs, and summarized failure context over dumping full logs.
- Preserve user confirmation for actions with side effects when appropriate.

## Final Response Expectations

When finishing a task, report:

- What changed.
- Which files were touched.
- Which validation commands ran.
- Any validation that could not run.
- Any compatibility or migration risk.

Keep the response concise, but do not hide skipped checks or unresolved risks.
