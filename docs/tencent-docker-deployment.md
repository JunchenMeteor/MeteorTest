# Tencent Docker Deployment

This runbook defines the target Docker deployment for the MeteorTest Web Console on the existing Tencent server. The private Python Local Agent, hosted Supabase project, and host Nginx remain outside the Web container.

> Status: target design. The active Tencent deployment still uses PM2 until the migration acceptance checklist is complete.

## Environment mapping

| Branch | Environment | Domain | Host port | Compose project | Runtime env |
| --- | --- | --- | ---: | --- | --- |
| `main` | Preview | `mt-pre.jcmeteor.com` / `mt-pre-cn.jcmeteor.com` | `3201` | `meteortest-preview` | `/etc/meteortest/meteortest-web.env` |
| `release` | Production | `meteortest.jcmeteor.com` / `mt-cn.jcmeteor.com` | `3200` | `meteortest-production` | `/etc/meteortest/meteortest-web.env` |

Nginx MUST continue binding public ports 80/443. Containers MUST publish only to `127.0.0.1`.

## Target delivery flow

1. A GitHub-hosted runner checks out the requested commit.
2. CI installs dependencies in `apps/web`, then runs lint and the production build. Repository-wide validation continues to cover the Python Agent separately.
3. CI validates the Docker build on pull requests and uploads compact source as a GitHub Actions artifact after merge.
4. The image is tagged with an immutable commit SHA. Branch and release tags MAY be aliases, but deployment MUST resolve to the SHA tag.
5. The MeteorTest Tencent runner builds from the artifact with the server-side Docker layer cache and updates only the matching Compose project.
6. The runner waits for container health and verifies the public domain.
7. A failed health check MUST restore the previous image SHA.

The server MUST NOT copy source, install npm dependencies, or build Next.js after migration.

## Image contract

- Image tag: `meteortest-web:<commit-sha>`.
- Build context: `apps/web` unless implementation validation identifies a repository-root dependency.
- Next.js MUST use `output: 'standalone'`.
- The runtime stage MUST contain only the standalone server, static assets, and required public files.
- The runtime process MUST run as a non-root user.
- Secrets MUST NOT be copied or passed as Docker build arguments.
- `.dockerignore` MUST exclude `.git`, `.env*`, local build output, logs, reports, and private Agent configuration.

## Web and Local Agent boundary

Docker migration covers only `apps/web`. The private Python Local Agent MUST remain independently operated and MUST NOT be embedded in the public Web image.

- Public preview keeps `METEORTEST_AGENT_DISABLED=1` and `METEORTEST_PUBLIC_PREVIEW=1`.
- `/api/agent/status` and the Executors UI MUST NOT start a machine-local Agent from the container.
- Agent credentials, repository paths, and `agent/config.yaml` MUST NOT enter the Web image.
- A future Agent containerization requires a separate security and execution-isolation design.

## Configuration and secrets

Real Web credentials remain in `/etc/meteortest/meteortest-web.env`. Compose injects the file at container startup. The self-hosted runner downloads the validated source artifact, builds with the server-side Docker layer cache, and deploys it. It does not pull the Git repository and requires no container-registry password. Supabase service-role, AI provider, Agent, and project execution secrets MUST NOT enter the source artifact or image.

## Compose requirements

Preview and production MUST use separate Compose project names, containers, and networks. Each service MUST define:

- `restart: unless-stopped`;
- a Web health check;
- JSON log rotation (`max-size: 10m`, `max-file: 3`);
- a memory limit appropriate for the 3.6 GiB host;
- an immutable image SHA;
- `127.0.0.1:3201` or `127.0.0.1:3200` host binding.

Deployment metadata MAY live under `/srv/containers/meteortest/{preview,production}`. Application secrets MUST stay under `/etc/meteortest`.

## First migration from PM2

Migrate one environment at a time, preview before production.

1. Record the current Git commit, PM2 process, Nginx configuration, and public health result.
2. Build and push the candidate image without changing the active runtime.
3. Start a shadow container on an unused localhost port and verify primary pages, authentication, API routes, and public-preview Agent-disabled behavior.
4. Switch only the relevant Nginx upstream to the shadow container and run public checks.
5. Stop only `meteortest-web` or `meteortest-release`.
6. Start the final Compose project on the existing `3201` or `3200` port and return Nginx to that port.
7. Observe logs and health before migrating the next environment.

Do not run `pm2 kill`. Keep PM2 definitions and source directories until both environments pass the observation window.

## Routine deployment

1. resolve the immutable image SHA;
2. record the currently running SHA;
3. download the source artifact and build the image with Docker layer cache;
4. update the matching Compose project from the local immutable image;
5. wait for container health;
6. verify the localhost port and public domain;
7. retain the previous SHA for rollback.

## Rollback

For a normal rollback, deploy the previous image SHA and repeat health checks. During the first migration, stop the failed Compose project, restore Nginx if required, restart only the matching PM2 process, and verify the original port and domain.

## Acceptance checklist

- CI builds the same commit that is tagged and deployed.
- No application or Agent secret exists in image history, build logs, or artifact metadata.
- Preview and production deploy and roll back independently.
- Containers bind only to localhost.
- Nginx passes `nginx -t` before reload.
- PM2 rollback works before definitions are removed.
- Preview and production domains return HTTP 200.
- Authentication, project/task/report APIs, AI surfaces, and public-preview safety checks pass.
- The private Local Agent remains independently operable.
- Docker logs rotate and old images have a retention policy.

## Related documentation

- `docs/release-manager.md`: release automation.
- `docs/private-agent-preview-loop.md`: public Web and private Agent validation.
- `docs/local-agent-operations.md`: Local Agent operations.
- `docs/vercel-public-preview.md`: hosted public preview boundary.
