# CoinGecko API

## Purpose

This project serves the circulating and total supply of OHM to CoinGecko, so that it can be displayed accurately on the [token page](https://www.coingecko.com/en/coins/olympus).

## Architecture

This is a very simple app, architected in the following way:

- treasury-subgraph API endpoint. See: [treasury-subgraph](https://github.com/OlympusDAO/treasury-subgraph)
- Firestore database
- Serverless function (in GCP)
- Hosting in Firebase, so that the URL endpoint is static
  - A custom domain under olympusdao.finance is also manually mapped to the production URL endpoint

When the function's trigger URL is hit, the following are performed:

1. Check if there is a value in the cache (Firestore) and returns it, if so.
   - Values are currently cached for 1 hour, in order to reduce queries to the GraphQL endpoint (which incur a charge).

1. If there is no valid cached value, an API query is performed. If successful, the cache is updated and the value is returned.
1. If no value is returned by the API query, HTTP status 500 is returned by the function.

## Requirements

- Node.js 22 or newer. The expected version is recorded in `.nvmrc` and `.node-version`.
- pnpm 10.33.0 or newer. The exact package manager version is recorded in `package.json`.
- Pulumi CLI access for deployment tasks.
- GCP credentials for the target stack when previewing or deploying infrastructure.

## Common Tasks

Install dependencies:

```sh
pnpm install
```

Run the TypeScript build:

```sh
pnpm run build
```

Check lint without writing fixes:

```sh
pnpm run lint:check
```

Run lint and apply automatic fixes:

```sh
pnpm run lint
```

Run the local CLI:

```sh
pnpm start
```

The CLI calls the circulating-supply path and uses the Firestore cache helper. For local runs, provide `FIRESTORE_COLLECTION` and `FIRESTORE_DOCUMENT`; set `API_ENDPOINT` only when overriding the default treasury-subgraph client endpoint. The Firestore client also needs usable local Google credentials, such as Application Default Credentials or a service account configured in the environment.

This repository does not currently define a `test` script. Use `pnpm run lint:check` and `pnpm run build` as the baseline validation commands unless tests are added later.

## Service Account

A GCP service account is required for deployment. The name of the file should correspond to the name specified in the Pulumi config file (e.g. `Pulumi.prod.yaml`). The role of the service account should be set to "Owner" for the project.

TODO: determine if a more restrictive role can be used.

A key then needs to be created for the service account and saved to a JSON file. This can then be referenced in the Pulumi config file. The JSON file should NOT be committed to the repo.

## Deployment

Deployment is handled by Pulumi, with hosting on GCP.

This repo uses pnpm with `nodeLinker: hoisted` in `pnpm-workspace.yaml` to avoid Pulumi closure loading errors like `Error: package.json export path for ".pnpm/..." not found`. If you hit that issue in another Pulumi repo using pnpm, try the hoisted linker layout before changing application code.

Stack config is kept in:

- `Pulumi.dev.yaml`: development stack, GCP project `coingecko-api-dev`, region `us-central1`, credentials file `gcp_credentials_dev.json`
- `Pulumi.prod.yaml`: production stack, GCP project `coingecko-api-382821`, region `us-central1`, credentials file `gcp_credentials.json`

To deploy:

1. Install dependencies with `pnpm install`.
1. Obtain the JSON credentials file for the project's service account and save it at the path referenced by the target stack config. Firebase requires a service account for deployment, hence the need to jump through this hoop.
1. Run `pulumi stack select dev` or `pulumi stack select prod`.
1. Run `pulumi refresh` to sync Pulumi state with GCP.
1. Run `pulumi preview` and review the planned changes.
1. Run `pulumi up` to deploy.

The Pulumi program deploys two Cloud Functions and Firebase Hosting rewrites:

- `circulating-supply`: serves OHM circulating supply.
- `total-supply`: serves OHM total supply.

Production custom domains use `*.api.olympusdao.finance`; development custom domains use `*.staging.api.olympusdao.finance`.

If the GCP project is shared between stacks, you may need to import the default Firestore database: `pulumi import gcp:firestore/database:Database default "(default)"`

## Notes

- To force the deployed function to ignore the cache, append `?cache=false` to the URL
- The Cloud Functions runtime is pinned to `nodejs22` because this project uses Cloud Functions v1 resources.
