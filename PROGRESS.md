# MeteorTest 进度索引

更新时间：2026-05-15

`PROGRESS.md` 只记录项目状态和下一步入口，不承载详细方案。详细计划、实施步骤和专项说明统一放在 `docs/`。

## 文档入口

- 文档总索引：`docs/README.zh-CN.md`
- 产品与架构意图：`DESIGN.md`
- AI 编排与 LangChain 计划：`docs/ai-langchain-modernization-plan.zh-CN.md`
- Supabase 执行手册：`docs/supabase-account-data-runbook.zh-CN.md`
- Local Agent 运维：`docs/local-agent-operations.zh-CN.md`
- 公网预览部署：`docs/vercel-public-preview.zh-CN.md`
- 腾讯云 Release 部署：`docs/tencent-release-deployment.zh-CN.md`
- 私有 Agent 闭环验证：`docs/private-agent-preview-loop.zh-CN.md`
- 内部 ID / DTO 边界：`docs/internal-id-exposure-hardening.zh-CN.md`

## 当前定位

MeteorTest 当前是早期 Beta 形态的通用自动化测试平台，已经跑通：

```text
项目接入
-> 测试范围导入
-> Web / AI 创建任务
-> 私有 Local Agent 执行
-> 回写任务状态、日志、报告和 AI 分析
-> Web 查看和导出分析上下文
```

公网 Web 预览地址：`https://meteortest.jcmeteor.com/`

腾讯云部署已拆分为 main 预发和 release 生产：

```text
main    -> mt-pre.jcmeteor.com
release -> meteortest.jcmeteor.com
```

公网 Web 只作为控制台入口；Local Agent 继续在私有机器或可信 runner 上主动轮询后端，不暴露到公网。

## 已完成能力

- 项目中心：项目创建、详情查看、`meteortest.yml` 测试范围导入、项目编辑和删除。
- 构建产物：登记 App/Web 构建，任务可关联构建产物。
- 任务中心：创建任务、状态查询、任务详情、公开任务 display id。
- Local Agent：轮询 Supabase、锁定任务、执行命令、上传日志和 Allure 产物、回写状态。
- 报告中心：任务摘要、日志、Allure 链接、失败分类、AI 分析、Markdown 分析包导出。
- AI 中枢：平台上下文问答、创建任务、创建项目、查询任务、历史会话、结构化行动卡片。
- 账号权限：Supabase Auth、用户名/手机号登录策略、个人信息、反馈、viewer/operator/admin 角色边界、RLS。
- 账号级数据：用户偏好、AI 会话历史、平台级 webhook 通知配置。
- 安全边界：public preview 禁止公网启动本机 Agent；浏览器侧逐步使用 DTO 和公开引用，避免暴露内部 UUID。
- Web 体验：多语言、主题、响应式基础布局、设置页、执行器页和本地预览脚本。
- 发布体系：`release` 分支、`Protect release` ruleset、`v0.1.0` 初始发布基线、腾讯云 self-hosted runner 和 main/release 自动部署入口。

## 当前主线

下一阶段会继续围绕测试质量、AI 修复、任务操作和报告分析能力推进。详细阶段计划应放在对应 roadmap 文档中，本文件只保留状态和入口。

## 后续能力池

- 项目级权限、团队/组织模型、反馈管理后台。
- AI Chat 模块拆分、SQL 型报告问答、LangChain JS 局部接入、pgvector/RAG。
- 多 Agent 注册、能力调度、Agent 独立仓库或安装包。
- 云真机、CI/CD 深度集成、质量门禁。
- 报告可视化增强、失败趋势、flaky 用例识别。
- 移动端细节验收和 WebView 封装。

## 维护规则

- 已完成/待完成状态更新到本文件。
- 阶段计划更新到 `docs/*roadmap*.md`。
- 具体操作步骤更新到对应 runbook。
- 长期产品和架构判断更新到 `DESIGN.md`。
- AI agent 工作规则更新到 `AGENTS.md`。
