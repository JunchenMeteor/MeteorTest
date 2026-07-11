# MeteorTest 文档索引

更新时间：2026-05-15

这里是 MeteorTest 文档唯一入口。新会话、AI agent 接手、或者人工查找资料时，先从这里开始。

## 阅读顺序

1. `../AGENTS.md`：仓库规则、PR/issue 规则、UI/i18n/DTO/安全边界。
2. `../README.zh-CN.md`：项目是什么、能做什么、怎么本地启动。
3. `../PROGRESS.md`：当前状态和下一步入口。
4. 按任务类型阅读下面对应文档。

## 文档职责

| 类型 | 文档 | 职责 |
| --- | --- | --- |
| 项目入口 | `../README.zh-CN.md` / `../README.md` | 面向使用者的项目简介、核心能力、最短启动路径。 |
| 状态索引 | `../PROGRESS.md` | 当前完成情况、当前主线、后续能力池。 |
| 长期设计 | `../DESIGN.md` | 产品定位、架构意图、对象模型和长期方向。 |
| Agent 规则 | `../AGENTS.md` | AI coding agent 必须遵守的工程规则。 |
| AI 编排计划 | `ai-langchain-modernization-plan.zh-CN.md` / `ai-langchain-modernization-plan.md` | AI Chat 拆分、SQL 问答、LangChain、RAG 和评估。 |
| Supabase 手册 | `supabase-account-data-runbook.zh-CN.md` / `supabase-account-data-runbook.md` | Auth/RLS、账号偏好、AI 历史、display refs 的 SQL 执行与验证。 |
| Local Agent 运维 | `local-agent-operations.zh-CN.md` / `local-agent-operations.md` | Agent 常驻、检查频率、心跳、日志、OpenClaw 巡检。 |
| 公网预览部署 | `vercel-public-preview.zh-CN.md` / `vercel-public-preview.md` | Vercel 公网预览部署和安全检查。 |
| 腾讯云 Docker 部署 | `tencent-docker-deployment.zh-CN.md` / `tencent-docker-deployment.md` | Docker + 源码 Artifact 架构、main/release 映射、PM2 迁移和回滚。 |
| 发布自动化 | `release-manager.md` | GitHub Actions 发布入口、release PR 自动化和中断恢复命令。 |
| 私有 Agent 闭环 | `private-agent-preview-loop.zh-CN.md` / `private-agent-preview-loop.md` | 私有 Agent 连接公网 Web 后端的验证流程。 |
| 数据暴露边界 | `internal-id-exposure-hardening.zh-CN.md` / `internal-id-exposure-hardening.md` | 内部 UUID、公开引用、DTO/View Model 规则。 |
| UI 验收 | `webui-visual-checklist.zh-CN.md` / `webui-visual-checklist.md` | WebUI 主题、布局、响应式和截图验收清单。 |
| 接入协议 | `meteortest.example.yml` | 测试项目接入协议示例。 |

## 按场景查找

- 想知道项目能力和架构：读 `../README.zh-CN.md`，再读 `../DESIGN.md`。
- 想知道现在做到哪了：读 `../PROGRESS.md`。
- 要改 AI Chat 或 LangChain：读 `ai-langchain-modernization-plan.zh-CN.md`。
- 要执行 Supabase SQL：读 `supabase-account-data-runbook.zh-CN.md`。
- 要启动、常驻或排查 Agent：读 `local-agent-operations.zh-CN.md`。
- 要部署公网预览：读 `vercel-public-preview.zh-CN.md`。
- 要做生产发布：读 `release-manager.md`。
- 要验证公网 Web + 私有 Agent 闭环：读 `private-agent-preview-loop.zh-CN.md`。
- 要处理 UUID 暴露或 API DTO：读 `internal-id-exposure-hardening.zh-CN.md`。
- 要做 UI / 响应式 / 主题检查：读 `webui-visual-checklist.zh-CN.md`。

## 去重规则

- README 只写入口和最短路径，不写完整 runbook。
- PROGRESS 只写状态和下一步入口，不写详细实施方案。
- DESIGN 只写长期设计，不记录执行流水账。
- roadmap 写计划和验收，不写账号后台点击步骤。
- runbook 写具体操作步骤，不重复解释长期架构。
- AGENTS 写硬规则，不重复产品说明。
- 中英文成对文档保留，但结构应一致。

新增文档前，先判断是否能放进现有分类。除非出现新的长期主题，否则不要新增平行文档。
