# MeteorTest

<p align="center">
  <strong>面向多项目、多套件、本地执行器和 AI 辅助分析的自动化测试平台</strong>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img alt="Python" src="https://img.shields.io/badge/Python-Local_Agent-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img alt="AI" src="https://img.shields.io/badge/AI-DeepSeek-4B7BFF?style=for-the-badge" />
  <br />
  <a href="https://github.com/JunchenMeteor/iOS-Automation-Framework"><img alt="Related iOS Framework" src="https://img.shields.io/badge/Related-iOS%20Framework-555555" /></a>
  <a href="https://github.com/JunchenMeteor/MeteorTest/issues"><img alt="Issues" src="https://img.shields.io/badge/Links-Issues-1F6FEB" /></a>
  <a href="#路线规划"><img alt="Roadmap" src="https://img.shields.io/badge/Links-Roadmap-8957E5" /></a>
  <br />
  <a href="README.md"><img alt="Docs English" src="https://img.shields.io/badge/Docs-English-black" /></a>
  <a href="README.zh-CN.md"><img alt="Docs 中文" src="https://img.shields.io/badge/Docs-%E4%B8%AD%E6%96%87-red" /></a>
</p>

MeteorTest 是一个通用自动化测试平台，用来管理多个测试项目、导入测试套件、创建测试任务、调度本地执行器、收集测试报告，并通过 AI 辅助分析测试结果和失败原因。

当前产品中文名是 **星流测试台**。`MeteorTest` 是工程和产品英文名。`meteortest.yml` 是自动化测试仓库接入平台时使用的测试项目协议文件。

## 目录

- [维护者](#维护者)
- [背景](#背景)
- [核心能力](#核心能力)
- [能力概览](#能力概览)
- [系统架构](#系统架构)
- [项目结构](#项目结构)
- [本地启动 Web 控制台](#本地启动-web-控制台)
- [接入测试项目](#接入测试项目)
- [运行 Local Agent](#运行-local-agent)
- [推荐验证流程](#推荐验证流程)
- [验证和 CI](#验证和-ci)
- [成本说明](#成本说明)
- [路线规划](#路线规划)

文档入口：

- [文档索引](docs/README.zh-CN.md)
- [当前进度索引](PROGRESS.md)

## 维护者

MeteorTest 由 **流星（Meteor）** 发起和维护。

这个项目关注客户端工程质量、自动化测试、iOS 工程体系、测试平台化和 AI 辅助研发。目标不是做一个只展示数据的后台页面，而是把测试工程、测试任务、执行器、报告和 AI 分析连接成一个可以真实落地的执行闭环。

## 背景

很多自动化测试项目一开始可以顺利运行，但后续会遇到一些反复出现的问题：

- 测试脚本散落在不同仓库，缺少统一入口。
- 测试任务靠人工命令触发，执行记录和报告难以追踪。
- App 构建产物、测试环境、测试套件之间没有结构化关联。
- 本地 Mac、真机、模拟器等执行资源无法被平台感知。
- 失败日志持续增长，但定位原因仍然依赖人工阅读日志。
- AI 可以辅助分析问题，但如果不能读取平台上下文、不能创建任务、不能查看报告，就只能停留在聊天层面。

MeteorTest 的设计思路是：平台负责控制面和数据层，真实测试执行留在本地 Local Agent；测试项目通过标准协议文件暴露能力，平台不直接耦合具体项目的测试代码。

```mermaid
sequenceDiagram
    participant Repo as 测试项目
    participant Platform as MeteorTest 平台
    participant Agent as Local Agent

    Repo->>Platform: 提供 meteortest.yml
    Platform->>Platform: 导入项目 / suites
    Platform->>Platform: 创建 queued 任务
    Agent->>Platform: 轮询任务
    Agent->>Repo: 执行 pytest / Appium / Locust
    Agent->>Platform: 回传日志 / 报告 / 状态
    Platform->>Platform: AI 分析失败原因
```

## 核心能力

- 项目管理：将每个产品或 App 绑定到一个或多个自动化测试仓库。
- 套件管理：通过 `meteortest.yml` 导入 API、UI、性能等 suite。
- 构建产物管理：登记 `.ipa`、`.apk`、`.app` 或其他构建 URL。
- 任务调度：从 Web 控制台或 AI 助手创建任务，Agent 轮询并执行。
- 执行器管理：查看 Local Agent 在线状态、能力标签、心跳和启动入口。
- 报告中心：记录日志、Allure 产物、执行摘要和任务状态。
- AI 助手：支持上下文问答、项目创建、任务创建、任务详情查询和结果分析。
- 设置中心：配置平台名称、界面语言、主题、信息密度、AI 模型、默认环境、通知策略和 Agent 启动策略。
- 账号权限：支持用户名/手机号密码登录、个人信息页、反馈入口和 viewer/operator/admin 角色边界。

## 能力概览

MVP 围绕一条完整测试闭环组织，而不是平铺功能页面：

```mermaid
flowchart LR
    Project[项目中心<br/>项目 / suite 导入]
    Build[构建产物<br/>ipa / apk / app / URL]
    Task[任务中心<br/>创建任务 / 选择环境]
    Agent[执行器<br/>Local Agent 领取并执行]
    Report[报告中心<br/>日志 / Allure / 摘要]
    AI[AI 助手<br/>失败分析 / 任务查询]

    Project --> Task
    Build --> Task
    Task --> Agent
    Agent --> Report
    Report --> AI
```

围绕这条闭环，当前能力包括：

- **项目中心**：创建项目、查看项目详情、导入 `meteortest.yml` suites。
- **构建产物**：管理 `.ipa`、`.apk`、`.app` 和构建 URL。
- **任务中心**：创建任务，并关联 suite、环境和构建产物。
- **执行器**：查看 Local Agent 状态、能力标签、心跳和启动入口。
- **报告中心**：查看执行日志、Allure 产物、执行摘要和任务结果。
- **AI 助手**：创建任务、查询任务详情、分析结果和进行上下文问答。
- **账号权限**：用户名/手机号密码登录、个人信息、反馈和角色权限边界。

辅助管理能力：

- **Dashboard**：平台概览和关键入口。
- **设置页**：平台名称、界面语言、主题、信息密度、AI 模型、默认环境、通知策略和 Agent 启动策略。

## 系统架构

```mermaid
flowchart TB
    Web[MeteorTest Web 控制台<br/>Next.js]

    subgraph Platform[平台控制面]
        Supabase[Supabase<br/>Auth / DB / Storage]
        AI[AI API<br/>DeepSeek / context + tools]
        AgentAPI[Agent API<br/>local spawn / status]
    end

    subgraph Data[平台数据]
        Projects[projects / suites]
        Builds[builds / tasks]
        Reports[reports / analyses]
    end

    subgraph Executor[本地执行层]
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

职责边界：

- `MeteorTest`：平台中心，负责任务、数据、报告、AI 和执行器状态。
- `Local Agent`：执行器，负责领取任务、准备构建产物、执行命令并回写结果。
- 测试项目：负责测试代码和 `meteortest.yml`，例如 [`iOS-Automation-Framework`](https://github.com/JunchenMeteor/iOS-Automation-Framework)。
- App 构建产物：被测对象，例如 `.ipa`、`.apk`、`.app` 或内部构建链接。

## 项目结构

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

按职责看：

- `apps/web/`：Next.js Web 控制台，包含页面、组件、API routes 和 Supabase 访问。
- `agent/`：Python Local Agent，负责轮询任务、执行 suite、收集日志并回传结果。
- `docs/`：文档索引、路线规划、部署 runbook、Agent 运维、数据安全和测试项目接入协议。
- `packages/shared/`：共享的 TypeScript 协议类型。
- `supabase/migrations/`：按顺序执行的数据库迁移 SQL。
- `DESIGN.md`：产品边界、架构设计和长期方向。
- `PROGRESS.md`：当前实现进度索引；详细执行计划按主题放在 `docs/` 下。

## 本地启动 Web 控制台

```bash
cd apps/web
npm ci
cp .env.local.example .env.local
npm run dev:local
```

打开：

```text
http://127.0.0.1:3000
```

`.env.local` 需要配置 Supabase URL、Anon Key、Service Role Key，以及可选的 `DEEPSEEK_API_KEY`。完整环境变量说明见 `apps/web/README.md`，Supabase SQL 执行顺序见 `docs/supabase-account-data-runbook.zh-CN.md`。

## 接入测试项目

测试项目需要在仓库根目录提供 `meteortest.yml`。协议示例见：

```text
docs/meteortest.example.yml
```

平台通过这个文件识别项目 key、测试范围、执行命令、依赖和报告产物。测试命令的运行时解析、Allure 输出和 Agent 执行细节见 `agent/README.md` 与 `docs/private-agent-preview-loop.zh-CN.md`。

## 运行 Local Agent

```bash
python -m pip install -r agent/requirements.txt
cp agent/config.example.yaml agent/config.yaml
./scripts/start-local-agent.sh
```

如果希望 Agent 常驻，macOS 推荐安装用户级 `launchd` 服务：

```bash
./scripts/install-local-agent-launchd.sh
```

完整配置、心跳、任务检查频率、日志和排障见 `docs/local-agent-operations.zh-CN.md`。公网 Web 场景下，Agent 必须保持私有，通过受控凭据主动轮询后端，不直接暴露端点。

## 公网 Web 预览部署

MeteorTest Web 需要能运行 Next.js 服务端路由的托管平台。GitHub Pages 不适合，因为 `/api/*` 需要服务端运行时。

公网预览部署步骤统一见 `docs/vercel-public-preview.zh-CN.md`。公网 Web + 私有 Agent 的联通验证统一见 `docs/private-agent-preview-loop.zh-CN.md`。

## 腾讯云 Release 部署

腾讯云部署使用 `main` 作为预发分支，`release` 作为生产分支：

```text
main    -> mt-pre.jcmeteor.com
release -> meteortest.jcmeteor.com
```

runner、分支、ruleset、环境变量和端口映射详见 `docs/tencent-release-deployment.zh-CN.md`。

生产发布通过 GitHub Actions 的 `Release Manager` workflow 自动化：

```text
GitHub -> Actions -> Release Manager -> Run workflow
```

选择 `action=full`，输入类似 `0.1.3` 的语义化版本号。workflow 会准备 release 文件、将 `main` 提升到 `release`、等待腾讯云部署、验证公网 URL，并创建 GitHub Release。详细操作和中断恢复步骤见 `docs/release-manager.md`。

## 推荐验证流程

1. 执行 Supabase 迁移。
2. 启动 Web 控制台。
3. 创建项目，例如 `yunlu-ios`。
4. 打开项目详情，粘贴测试项目的 `meteortest.yml` 并导入 suites。
5. 在 Builds 页面登记 `.ipa`、`.apk`、`.app` 或构建 URL。
6. 打开 Executors 页面，确认 Local Agent 正在运行。
7. 在 Tasks 页面或 AI 助手中创建任务，选择项目、suite、环境和构建产物。
8. 等待 Agent 执行。
9. 打开任务详情，查看状态、日志、Allure 产物和 AI 分析。

## 验证和 CI

本仓库包含 GitHub Actions CI：

```text
.github/workflows/ci.yml
```

Pull request 会运行：

```bash
cd apps/web
npm ci
npm run lint
npm run build
```

以及：

```bash
python -m pip install -r agent/requirements.txt
python -m compileall agent
python -m pytest agent/tests -q
```

本地手动验证：

```bash
python -m pytest agent/tests -q
python -m compileall agent
cd apps/web
npm run lint
npm run build
```

## 成本说明

MVP 按低运行成本设计：

- Web 控制台可以部署在 Vercel 免费额度内。
- 数据库和 Storage 可以先使用 Supabase 免费额度。
- iOS UI 自动化优先使用本地 Mac Agent，不依赖云真机。
- AI 能力按量调用，建议只对 failed 或 timeout 任务触发分析。

需要关注的成本来源：

- 报告和日志的 Storage 体积。
- AI 分析调用次数，以及发送给 AI 的日志文本长度。
- 云真机、专用 CI runner、团队级 Vercel 或 Supabase 套餐。

成本控制建议：

- 数据库保存报告索引，不保存大文件正文。
- 日志上传前截断或压缩，AI 分析只发送相关失败片段。
- 定期清理旧报告和临时构建产物。
- 本地 Agent 闭环稳定后，再考虑云真机和高级调度。

## 路线规划

```mermaid
flowchart LR
    MVP[MVP<br/>项目 / suite / 任务 / Agent / 报告 / AI 分析闭环]
    Beta[Beta<br/>执行器稳定性 / 重试 / 报告聚合 / 权限]
    Team[Team<br/>团队协作 / 审计日志 / 通知 / 更多执行资源]
    Cloud[Cloud<br/>远程执行器 / 云真机 / 分布式调度 / 插件化]

    MVP --> Beta --> Team --> Cloud
```
