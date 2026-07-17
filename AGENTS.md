# AGENTS.md

## Project Overview

This repository provides a thin API layer for serving Olympus OHM circulating-supply and total-supply values to CoinGecko. It fetches values from the treasury-subgraph client, caches results in Firestore, and deploys Cloud Functions behind Firebase Hosting rewrites.

## Node and Tooling

- Node.js must use version 22+ because the deployed Cloud Functions runtime is pinned to `nodejs22`.
- Use `.nvmrc` and `.node-version` files for version alignment.
- Use pnpm 11.13.0 or newer. The exact package manager version is recorded in `package.json`.
- Shared pnpm policy lives in `pnpm-workspace.yaml`, including `nodeLinker: hoisted` for Pulumi closure compatibility and `preferFrozenLockfile: true` for frozen lockfile installs.
- Run `pnpm install` before dependency-dependent work.

## Common Commands

- `pnpm install`: install dependencies
- `pnpm run lint:check`: run lint checks without applying fixes
- `pnpm run lint`: run ESLint and apply automatic fixes under `src/**/*.ts`
- `pnpm run build`: run the TypeScript build
- `pnpm start`: run the local CLI path for circulating supply

There is no `test` script at the moment. Use `pnpm run lint:check` and `pnpm run build` as the baseline validation commands unless tests are added.

## Runtime Configuration

- `API_ENDPOINT`: optional treasury-subgraph client endpoint override.
- `FIRESTORE_COLLECTION`: required by the cache helper when running the app path.
- `FIRESTORE_DOCUMENT`: required by the cache helper when running the app path.
- Local runs also need working Google credentials for Firestore access, such as Application Default Credentials or a service account configured in the environment.

## Deployment

Deployment is managed by Pulumi from `src/index.ts`.

- `Pulumi.dev.yaml`: development stack using GCP project `coingecko-api-dev`, region `us-central1`, credentials file `gcp_credentials_dev.json`.
- `Pulumi.prod.yaml`: production stack using GCP project `coingecko-api-382821`, region `us-central1`, credentials file `gcp_credentials.json`.

Deployment checklist:

1. Run `pnpm install`.
1. Place the target stack's GCP service account JSON file at the path referenced by the Pulumi config. Do not commit credential files.
1. Run `pulumi stack select dev` or `pulumi stack select prod`.
1. Run `pulumi refresh`.
1. Run `pulumi preview` and review the plan.
1. Run `pulumi up` to deploy.
