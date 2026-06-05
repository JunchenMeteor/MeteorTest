# MeteorTest Documentation Index

Updated: 2026-05-15

This is the single entry point for MeteorTest documentation. Start here for new sessions, AI agent handoffs, and manual lookup.

## Read Order

1. `../AGENTS.md`: repository rules, PR/issue rules, UI/i18n/DTO/security boundaries.
2. `../README.md`: what the project is, what it can do, and the shortest local setup path.
3. `../PROGRESS.md`: current state and next work entry points.
4. Read the topic-specific doc below.

## Document Roles

| Type | Document | Role |
| --- | --- | --- |
| Project entry | `../README.md` / `../README.zh-CN.md` | User-facing overview, core capabilities, shortest setup path. |
| Status index | `../PROGRESS.md` | Current state, active direction, future capability pool. |
| Long-term design | `../DESIGN.md` | Product positioning, architecture intent, object model, long-term direction. |
| Agent rules | `../AGENTS.md` | Mandatory engineering rules for AI coding agents. |
| AI orchestration plan | `ai-langchain-modernization-plan.md` / `ai-langchain-modernization-plan.zh-CN.md` | AI Chat split, SQL Q&A, LangChain, RAG, evaluation. |
| Supabase runbook | `supabase-account-data-runbook.md` / `supabase-account-data-runbook.zh-CN.md` | Auth/RLS, preferences, AI history, display refs SQL execution and verification. |
| Local Agent operations | `local-agent-operations.md` / `local-agent-operations.zh-CN.md` | Agent daemon, check interval, heartbeat, logs, OpenClaw checks. |
| Public preview deployment | `vercel-public-preview.md` / `vercel-public-preview.zh-CN.md` | Vercel public preview deployment and safety checks. |
| Tencent release deployment | `tencent-release-deployment.md` / `tencent-release-deployment.zh-CN.md` | Tencent main/release deployment, runner, branch, and port mapping. |
| Private Agent loop | `private-agent-preview-loop.md` / `private-agent-preview-loop.zh-CN.md` | Validation flow for public Web plus private Agent execution. |
| Data exposure boundary | `internal-id-exposure-hardening.md` / `internal-id-exposure-hardening.zh-CN.md` | Internal UUIDs, public refs, DTO/View Model rules. |
| UI validation | `webui-visual-checklist.md` / `webui-visual-checklist.zh-CN.md` | Theme, layout, responsive, screenshot checklist. |
| Integration contract | `meteortest.example.yml` | Test project contract example. |

## Lookup By Scenario

- Project capability and architecture: `../README.md`, then `../DESIGN.md`.
- Current state: `../PROGRESS.md`.
- AI Chat or LangChain work: `ai-langchain-modernization-plan.md`.
- Supabase SQL execution: `supabase-account-data-runbook.md`.
- Agent startup, daemon, or troubleshooting: `local-agent-operations.md`.
- Public preview deployment: `vercel-public-preview.md`.
- Public Web plus private Agent validation: `private-agent-preview-loop.md`.
- UUID exposure or API DTO work: `internal-id-exposure-hardening.md`.
- UI, responsive, or theme checks: `webui-visual-checklist.md`.

## De-Duplication Rules

- README is for entry points and the shortest path, not full runbooks.
- PROGRESS is for state and next entry points, not detailed implementation plans.
- DESIGN is for long-term design, not execution logs.
- Roadmaps are for plans and acceptance criteria, not account-console click paths.
- Runbooks are for exact operating steps, not repeated architecture explanations.
- AGENTS is for hard engineering rules, not product narrative.
- Paired Chinese and English docs stay, but their structure should match.

Before adding a new doc, check whether it fits an existing category. Do not add parallel docs unless there is a new long-lived topic.
