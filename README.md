# MeteorTest

<p align="center">
  <strong>An automation testing platform for multiple projects, suites, local executors, and AI-assisted analysis</strong>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img alt="Python" src="https://img.shields.io/badge/Python-Local_Agent-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img alt="AI" src="https://img.shields.io/badge/AI-DeepSeek-4B7BFF?style=for-the-badge" />
  <br />
  <a href="https://github.com/JunchenMeteor/iOS-Automation-Framework"><img alt="Related iOS Framework" src="https://img.shields.io/badge/Related-iOS%20Framework-555555" /></a>
  <a href="https://github.com/JunchenMeteor/MeteorTest/issues"><img alt="Issues" src="https://img.shields.io/badge/Links-Issues-1F6FEB" /></a>
  <a href="#roadmap"><img alt="Roadmap" src="https://img.shields.io/badge/Links-Roadmap-8957E5" /></a>
  <br />
  <a href="README.md"><img alt="Docs English" src="https://img.shields.io/badge/Docs-English-black" /></a>
  <a href="README.zh-CN.md"><img alt="Docs 中文" src="https://img.shields.io/badge/Docs-%E4%B8%AD%E6%96%87-red" /></a>
</p>

MeteorTest is a general-purpose automation testing platform for managing multiple test projects, importing test suites, creating test tasks, scheduling local executors, collecting reports, and using AI to assist with result and failure analysis.

`MeteorTest` is the product and engineering name. `meteortest.yml` is the test-project integration contract used by automation repositories.

## Table of Contents

- [Maintainer](#maintainer)
- [Background](#background)
- [Core Capabilities](#core-capabilities)
- [Capability Overview](#capability-overview)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Start the Web Console Locally](#start-the-web-console-locally)
- [Connect a Test Project](#connect-a-test-project)
- [Run the Local Agent](#run-the-local-agent)
- [Recommended Validation Flow](#recommended-validation-flow)
- [Validation and CI](#validation-and-ci)
- [Cost Notes](#cost-notes)
- [Roadmap](#roadmap)

Documentation entry:

- [Documentation index](docs/README.md)
- [Current progress index](PROGRESS.md)

## Maintainer

MeteorTest is initiated and maintained by **Meteor**.

The project focuses on client-side engineering quality, automation testing, iOS engineering systems, test platform engineering, and AI-assisted development. The goal is not to build a dashboard that only displays data, but to connect test projects, tasks, executors, reports, and AI analysis into a practical execution loop.

## Background

Many automation projects can run successfully at the beginning, but later run into recurring problems:

- Test scripts are scattered across repositories without a unified entry point.
- Test tasks are triggered manually, making execution history and reports hard to track.
- App artifacts, environments, and test suites are not linked through structured data.
- Local Macs, devices, and simulators are not visible to a central platform.
- Failure logs keep growing, while root-cause analysis still depends on manual log reading.
- AI can help analyze issues, but without platform context, task creation, and report access, it remains limited to chat.

MeteorTest uses the platform as the control plane and data layer, while actual test execution stays in a local Local Agent. Test projects expose a standard contract file, and the platform avoids coupling itself to project-specific test code.

```mermaid
sequenceDiagram
    participant Repo as Test Project
    participant Platform as MeteorTest Platform
    participant Agent as Local Agent

    Repo->>Platform: Provide meteortest.yml
    Platform->>Platform: Import project / suites
    Platform->>Platform: Create queued task
    Agent->>Platform: Poll tasks
    Agent->>Repo: Run pytest / Appium / Locust
    Agent->>Platform: Upload logs / reports / status
    Platform->>Platform: Analyze failures with AI
```

## Core Capabilities

- Project management: bind each product or app to one or more automation repositories.
- Suite management: import API, UI, performance, and other suites from `meteortest.yml`.
- Build artifact management: register `.ipa`, `.apk`, `.app`, or other build URLs.
- Task scheduling: create tasks from the Web console or AI assistant; agents poll and execute them.
- Executor management: view Local Agent status, capability tags, heartbeats, and launch entry points.
- Report center: record logs, Allure artifacts, execution summaries, and task status.
- AI assistant: support contextual Q&A, project creation, task creation, task detail lookup, and result analysis.
- Settings: configure platform name, UI language, theme, information density, AI model, default environment, notification strategy, and Agent launch behavior.
- Account access: supports username or phone password sign-in, profile management, feedback, and viewer/operator/admin role boundaries.

## Capability Overview

The MVP is organized around one complete testing loop rather than a flat list of screens:

```mermaid
flowchart LR
    Project[Project Center<br/>Projects / suite import]
    Build[Build Artifacts<br/>ipa / apk / app / URL]
    Task[Task Center<br/>Create task / select environment]
    Agent[Executor<br/>Local Agent claims and runs tasks]
    Report[Report Center<br/>Logs / Allure / summaries]
    AI[AI Assistant<br/>Failure analysis / task lookup]

    Project --> Task
    Build --> Task
    Task --> Agent
    Agent --> Report
    Report --> AI
```

Current capabilities around this loop:

- **Project Center**: create projects, view project details, and import `meteortest.yml` suites.
- **Build Artifacts**: manage `.ipa`, `.apk`, `.app`, and build URLs.
- **Task Center**: create tasks and link suites, environments, and build artifacts.
- **Executors**: view Local Agent status, capability tags, heartbeats, and launch entry points.
- **Report Center**: view execution logs, Allure artifacts, summaries, and task results.
- **AI Assistant**: create tasks, query task details, analyze results, and answer contextual questions.
- **Account access**: username or phone password sign-in, profile, feedback, and role boundaries.

Supporting management capabilities:

- **Dashboard**: platform overview and key entry points.
- **Settings**: platform name, UI language, theme, information density, AI model, default environment, notification strategy, and Agent launch behavior.

## System Architecture

```mermaid
flowchart TB
    Web[MeteorTest Web Console<br/>Next.js]

    subgraph Platform[Platform control plane]
        Supabase[Supabase<br/>Auth / DB / Storage]
        AI[AI API<br/>DeepSeek / context + tools]
        AgentAPI[Agent API<br/>local spawn / status]
    end

    subgraph Data[Platform data]
        Projects[projects / suites]
        Builds[builds / tasks]
        Reports[reports / analyses]
    end

    subgraph Executor[Local execution layer]
        LocalAgent[Local Agent<br/>Python]
        Contract[meteortest.yml<br/>suite metadata]
        Artifacts[app artifacts<br/>ipa / apk / app]
        Command[test command<br/>pytest / Appium / Locust]
    end

    Web --> Supabase
    Web --> AI
    Web --> AgentAPI
    Supabase --> Projects
    Supabase --> Builds
    Supabase --> Reports
    Builds --> LocalAgent
    AgentAPI --> LocalAgent
    LocalAgent --> Contract
    LocalAgent --> Artifacts
    LocalAgent --> Command
    LocalAgent --> Reports
```

Responsibility boundaries:

- `MeteorTest`: the platform center for tasks, data, reports, AI, and executor status.
- `Local Agent`: the executor that claims tasks, prepares artifacts, runs commands, and writes results back.
- Test projects: own test code and `meteortest.yml`, for example [`iOS-Automation-Framework`](https://github.com/JunchenMeteor/iOS-Automation-Framework).
- App artifacts: the tested targets, such as `.ipa`, `.apk`, `.app`, or internal build links.

## Project Structure

```text
MeteorTest/
├── apps/web/
├── agent/
├── docs/
├── packages/shared/
├── supabase/migrations/
├── DESIGN.md
└── PROGRESS.md
```

By responsibility:

- `apps/web/`: Next.js Web console, including pages, components, API routes, and Supabase access.
- `agent/`: Python Local Agent for polling tasks, running suites, collecting logs, and reporting results.
- `docs/`: documentation index, roadmaps, deployment runbooks, Agent operations, data-safety notes, and the test-project contract.
- `packages/shared/`: shared TypeScript protocol types.
- `supabase/migrations/`: ordered database migration SQL files.
- `DESIGN.md`: product boundaries, architecture design, and long-term direction.
- `PROGRESS.md`: current progress index; detailed execution plans live in focused `docs/` files.

## Start the Web Console Locally

```bash
cd apps/web
npm ci
cp .env.local.example .env.local
npm run dev:local
```

Open:

```text
http://127.0.0.1:3000
```

`.env.local` must contain Supabase URL, Anon Key, Service Role Key, and optional `DEEPSEEK_API_KEY`. See `apps/web/README.md` for Web environment notes and `docs/supabase-account-data-runbook.md` for SQL execution order.

## Connect a Test Project

A test project should provide `meteortest.yml` at its repository root. Contract example:

```text
docs/meteortest.example.yml
```

MeteorTest uses this file to identify project key, test scopes, commands, dependencies, and report artifacts. Runtime resolution, Allure output, and Agent execution details live in `agent/README.md` and `docs/private-agent-preview-loop.md`.

## Run the Local Agent

```bash
python -m pip install -r agent/requirements.txt
cp agent/config.example.yaml agent/config.yaml
./scripts/start-local-agent.sh
```

To keep the Agent running on macOS, install the user-level `launchd` service:

```bash
./scripts/install-local-agent-launchd.sh
```

Full configuration, heartbeat, task check interval, logs, and troubleshooting live in `docs/local-agent-operations.md`. For public Web use, keep the Agent private and let it poll the backend with scoped credentials.

## Public Web Preview Deployment

MeteorTest Web needs a host that can run Next.js server routes. GitHub Pages is not enough because `/api/*` requires a server runtime.

Public preview deployment steps live in `docs/vercel-public-preview.md`. Public Web plus private Agent validation lives in `docs/private-agent-preview-loop.md`.

## Tencent Release Deployment

Tencent deployment uses `main` for preview and `release` for production:

```text
main    -> mt-pre.jcmeteor.com
release -> meteortest.jcmeteor.com
```

The detailed runner, branch, ruleset, environment, and port mapping lives in `docs/tencent-release-deployment.md`.

Production publishing is automated by the GitHub Actions `Release Manager` workflow:

```text
GitHub -> Actions -> Release Manager -> Run workflow
```

Use `action=full` with a semantic version such as `0.1.3`. The workflow prepares release files, promotes `main` to `release`, waits for Tencent deployment, verifies public URLs, and creates the GitHub Release. Detailed operation and recovery steps live in `docs/release-manager.md`.

## Recommended Validation Flow

1. Run Supabase migrations.
2. Start the Web console.
3. Create a project, for example `yunlu-ios`.
4. Open the project detail page, paste the test project's `meteortest.yml`, and import suites.
5. Register an `.ipa`, `.apk`, `.app`, or build URL on the Builds page.
6. Open the Executors page and confirm the Local Agent is running.
7. Create a task from the Tasks page or AI assistant, selecting project, suite, environment, and build artifact.
8. Wait for the Agent to execute it.
9. Open task details to inspect status, logs, Allure artifacts, and AI analysis.

## Validation and CI

This repository includes GitHub Actions CI:

```text
.github/workflows/ci.yml
```

Pull requests run:

```bash
cd apps/web
npm ci
npm run lint
npm run build
```

And:

```bash
python -m pip install -r agent/requirements.txt
python -m compileall agent
python -m pytest agent/tests -q
```

Local manual validation:

```bash
python -m pytest agent/tests -q
python -m compileall agent
cd apps/web
npm run lint
npm run build
```

## Cost Notes

The MVP is designed with low operating cost in mind:

- The Web console can be deployed within Vercel's free tier.
- Database and Storage can start on Supabase's free tier.
- iOS UI automation should prefer a local Mac Agent first, without depending on cloud devices.
- AI usage is pay-as-you-go; triggering analysis only for failed or timeout tasks is recommended.

Cost areas to watch:

- Storage size for reports and logs.
- Number of AI analysis calls and the amount of log text sent for analysis.
- Cloud devices, dedicated CI runners, and team-level Vercel or Supabase plans.

Cost control suggestions:

- Store report indexes in the database instead of large file bodies.
- Truncate or compress logs before upload, and send only relevant failure snippets to AI analysis.
- Clean up old reports and temporary build artifacts regularly.
- Consider cloud devices and advanced scheduling only after the local Agent loop is stable.

## Roadmap

```mermaid
flowchart LR
    MVP[MVP<br/>Projects / suites / tasks / Agent / reports / AI analysis loop]
    Beta[Beta<br/>Executor stability / retries / report aggregation / permissions]
    Team[Team<br/>Collaboration / audit logs / notifications / more execution resources]
    Cloud[Cloud<br/>Remote executors / cloud devices / distributed scheduling / plugins]

    MVP --> Beta --> Team --> Cloud
```
