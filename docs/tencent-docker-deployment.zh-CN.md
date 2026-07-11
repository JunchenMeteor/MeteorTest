# 腾讯云 Docker 部署

本文定义 MeteorTest Web Console 在现有腾讯云服务器上的目标 Docker 部署方式。私有 Python Local Agent、托管 Supabase 和宿主机 Nginx 不进入 Web 容器。

> 状态：目标设计。完成本文迁移验收清单之前，腾讯云当前仍使用 PM2 部署。

## 环境映射

| 分支 | 环境 | 域名 | 宿主机端口 | Compose 项目 | 运行时环境文件 |
| --- | --- | --- | ---: | --- | --- |
| `main` | 预览 | `mt-pre.jcmeteor.com` / `mt-pre-cn.jcmeteor.com` | `3201` | `meteortest-preview` | `/etc/meteortest/meteortest-web.env` |
| `release` | 生产 | `meteortest.jcmeteor.com` / `mt-cn.jcmeteor.com` | `3200` | `meteortest-production` | `/etc/meteortest/meteortest-web.env` |

Nginx MUST 继续监听公网 80/443 端口。容器 MUST 只发布到 `127.0.0.1`。

## 目标交付流程

1. GitHub 托管 Runner 检出目标提交。
2. CI 在 `apps/web` 安装依赖并执行 lint 和生产构建；仓库级验证继续单独覆盖 Python Agent。
3. CI 将多阶段 Next.js standalone 镜像导出为压缩的 Docker 镜像制品。
4. 镜像使用不可变 commit SHA 标签；分支和版本标签 MAY 作为别名，但部署 MUST 最终解析到 SHA 标签。
5. MeteorTest 专属腾讯 Runner 下载 Artifact、将不可变镜像加载到 Docker，并只更新对应 Compose 项目。
6. Runner 等待容器健康并验证公网域名。
7. 健康检查失败时 MUST 恢复上一镜像 SHA。

迁移完成后，服务器 MUST 不再复制源码、安装 npm 依赖或构建 Next.js。

## 镜像契约

- 镜像标签：`meteortest-web:<commit-sha>`。
- 构建上下文：默认使用 `apps/web`；如果实施验证发现仓库根依赖，再调整到根目录。
- Next.js MUST 使用 `output: 'standalone'`。
- 运行阶段 MUST 只包含 standalone server、静态资源和必要 public 文件。
- 运行进程 MUST 使用非 root 用户。
- 密钥 MUST NOT 复制进镜像或通过 Docker build argument 传入。
- `.dockerignore` MUST 排除 `.git`、`.env*`、本地构建输出、日志、报告和私有 Agent 配置。

## Web 与 Local Agent 边界

本次 Docker 迁移只覆盖 `apps/web`。私有 Python Local Agent MUST 继续独立运行，MUST NOT 嵌入公网 Web 镜像。

- 公共预览继续设置 `METEORTEST_AGENT_DISABLED=1` 和 `METEORTEST_PUBLIC_PREVIEW=1`。
- `/api/agent/status` 和 Executors UI MUST NOT 从容器启动服务器本地 Agent。
- Agent 凭据、仓库路径和 `agent/config.yaml` MUST NOT 进入 Web 镜像。
- 如果未来容器化 Agent，必须另行设计执行隔离和安全边界。

## 配置与密钥

真实 Web 凭据继续保存在 `/etc/meteortest/meteortest-web.env`，由 Compose 在容器启动时注入。GitHub 托管 Runner 使用只允许写入指定目录的 SSH 密钥，将压缩镜像直传到腾讯云制品收件箱；自托管 Runner 只负责加载和部署。该通道不需要镜像仓库密码，上传账号也不能获得交互式 Shell。Supabase service-role、AI provider、Agent 和项目执行密钥 MUST NOT 进入镜像制品。

## Compose 要求

预览和生产 MUST 使用不同的 Compose 项目名、容器和网络。每个服务 MUST 定义：

- `restart: unless-stopped`；
- Web 健康检查；
- JSON 日志轮转（`max-size: 10m`、`max-file: 3`）；
- 适配当前 3.6 GiB 服务器的内存限制；
- 不可变镜像 SHA；
- `127.0.0.1:3201` 或 `127.0.0.1:3200` 绑定。

部署元数据 MAY 放在 `/srv/containers/meteortest/{preview,production}`；应用密钥 MUST 保留在 `/etc/meteortest`。

## 首次从 PM2 迁移

每次只迁移一个环境，必须先预览后生产。

1. 记录当前 Git commit、PM2 进程、Nginx 配置和公网健康结果。
2. 构建并推送候选镜像，不改变当前运行状态。
3. 在未使用的 localhost 端口启动影子容器，验证主要页面、认证、API 路由和公共预览 Agent 禁用行为。
4. 只将当前环境的 Nginx upstream 切到影子容器并执行公网检查。
5. 只停止 `meteortest-web` 或 `meteortest-release`。
6. 在原 `3201` 或 `3200` 端口启动最终 Compose 项目，并将 Nginx 恢复指向该端口。
7. 观察日志和健康状态后，再迁移下一个环境。

禁止执行 `pm2 kill`。两个环境完成观察期之前，保留 PM2 定义和源码目录。

## 日常部署

1. 解析新的不可变镜像 SHA；
2. 记录当前运行 SHA；
3. 下载并加载镜像 Artifact；
4. 使用本地不可变镜像更新对应 Compose 项目；
5. 等待容器健康；
6. 验证 localhost 端口和公网域名；
7. 保留上一 SHA 用于回滚。

## 回滚

普通回滚应部署上一镜像 SHA 并重复健康检查。首次迁移期间，应停止失败的 Compose 项目，必要时恢复 Nginx，只重启对应 PM2 进程，并验证原端口和域名。

## 验收清单

- CI 构建、标记和部署的是同一个 commit。
- 镜像历史、构建日志和 Artifact 元数据中不存在应用或 Agent 密钥。
- 预览与生产可独立部署、独立回滚。
- 容器只绑定 localhost。
- reload 前 Nginx 配置通过 `nginx -t`。
- 删除 PM2 定义前完成 PM2 回滚验证。
- 预览和生产域名均返回 HTTP 200。
- 完成认证、项目/任务/报告 API、AI 功能和公共预览安全检查。
- 私有 Local Agent 继续独立可用。
- Docker 日志已轮转，旧镜像有明确保留策略。

## 相关文档

- `docs/release-manager.md`：发布自动化。
- `docs/private-agent-preview-loop.zh-CN.md`：公网 Web 与私有 Agent 验证。
- `docs/local-agent-operations.zh-CN.md`：Local Agent 运维。
- `docs/vercel-public-preview.zh-CN.md`：托管公网预览边界。
