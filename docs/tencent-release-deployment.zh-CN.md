# 腾讯云 Release 部署

MeteorTest 在腾讯云上使用两套服务端部署：

```text
release 分支 -> /srv/meteortest-release -> 127.0.0.1:3200 -> meteortest.jcmeteor.com / mt-cn.jcmeteor.com
main 分支    -> /srv/meteortest         -> 127.0.0.1:3201 -> mt-pre.jcmeteor.com / mt-pre-cn.jcmeteor.com
```

公网 Nginx 入口只开放 `80`。应用端口只绑定 `127.0.0.1`，不要在腾讯云安全组中开放。

## GitHub 配置

- 分支：
  - `main`：集成和预发部署分支。
  - `release`：生产发布分支。
- Rulesets：
  - `Protect main`：已有 main 保护。
  - `Protect release`：要求 `CI` 状态检查，禁止删除和非快进更新。
- Runner：
  - 仓库 runner：`tencent-meteortest`
  - 标签：`self-hosted`、`linux`、`x64`、`tencent`、`meteortest`
- Workflow：
  - `.github/workflows/ci.yml`：验证 `main`、`release` 和 `dev/v-peq/**`。
  - `.github/workflows/deploy-tencent.yml`：部署 `main` 和 `release`。
  - `.github/workflows/release-manager.yml`：编排版本准备、release PR、腾讯云部署验证和 GitHub Release 发布。

## 服务器环境变量

运行时环境变量放在腾讯云服务器：

```text
/etc/meteortest/meteortest-web.env
```

不要提交真实值。部署 workflow 会在构建和启动 Next.js 前读取这个文件。

## 发布流程

正常发布使用 `GitHub -> Actions -> Release Manager -> Run workflow`，选择 `action=full`。自动化细节和中断恢复命令见 `docs/release-manager.md`。

底层发布流程是：

1. 功能变更先合入 `main`。
2. `main` 自动部署到预发入口：
   ```text
   mt-pre.jcmeteor.com
   mt-pre-cn.jcmeteor.com
   ```
3. 从 `main` 向 `release` 开 PR。
4. 等待 `CI` 通过。
5. 合入 `release`。
6. 腾讯云部署 workflow 更新：
   ```text
   /srv/meteortest-release
   meteortest-release
   127.0.0.1:3200
   ```
7. 从 `release` 创建 GitHub Release tag。

## Release 基线

第一个分支基线是：

```text
v0.1.0
```

它标记 release 分支建立时的初始位置。

当前腾讯云部署基线是：

```text
v0.1.2
```

它包含受保护的 release 分支、腾讯云 self-hosted runner 部署、生产/预发拆分，以及 MeteorTest `3200/3201` 端口对齐。
