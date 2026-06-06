# Tencent Release Deployment

MeteorTest uses two server-side Tencent deployments:

```text
release branch -> /srv/meteortest-release -> 127.0.0.1:3200 -> meteortest.jcmeteor.com / mt-cn.jcmeteor.com
main branch    -> /srv/meteortest         -> 127.0.0.1:3201 -> mt-pre.jcmeteor.com / mt-pre-cn.jcmeteor.com
```

The public Nginx entry point is port `80`. App ports are bound to `127.0.0.1` only and must not be opened in the Tencent security group.

## GitHub Setup

- Branches:
  - `main`: integration and preview deployment branch.
  - `release`: production release branch.
- Rulesets:
  - `Protect main`: existing main protection.
  - `Protect release`: requires the `CI` status check and prevents deletion/non-fast-forward updates.
- Runner:
  - Repository runner: `tencent-meteortest`
  - Labels: `self-hosted`, `linux`, `x64`, `tencent`, `meteortest`
- Workflow:
  - `.github/workflows/ci.yml`: validates `main`, `release`, and `dev/v-peq/**`.
  - `.github/workflows/deploy-tencent.yml`: deploys `main` and `release`.

## Server Environment

Runtime environment variables live on the Tencent server:

```text
/etc/meteortest/meteortest-web.env
```

Do not commit real values. The deploy workflow sources this file before building and starting the Next.js app.

## Release Flow

1. Merge feature work into `main`.
2. Let `main` deploy to the preview endpoint:
   ```text
   mt-pre.jcmeteor.com
   mt-pre-cn.jcmeteor.com
   ```
3. Open a PR from `main` into `release`.
4. Wait for `CI`.
5. Merge into `release`.
6. The Tencent deploy workflow updates:
   ```text
   /srv/meteortest-release
   meteortest-release
   127.0.0.1:3200
   ```
7. Create a GitHub Release tag from `release`.

## Release Baselines

The first branch baseline is:

```text
v0.1.0
```

It marks the initial release branch creation point.

The current Tencent deployment baseline is:

```text
v0.1.2
```

It includes the protected release branch, self-hosted Tencent runner deployment, production/preview split, and the `3200/3201` MeteorTest port alignment.
