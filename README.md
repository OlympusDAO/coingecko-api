# CoinGecko API

## Purpose

This project serves the circulating supply of OHM to CoinGecko, so that it can be displayed accurately on the [token page](https://www.coingecko.com/en/coins/olympus).

## Architecture

This is a very simple app, architected in the following way:

- GraphQL endpoint for the protocol-metrics subgraph. See: [olympus-protocol-metrics-subgraph](https://github.com/OlympusDAO/olympus-protocol-metrics-subgraph)
- Firestore database
- Serverless function (in GCP)
- Hosting in Firebase, so that the URL endpoint is static
  - A custom domain under olympusdao.finance is also manually mapped to the production URL endpoint

When the function's trigger URL is hit, the following are performed:

1. Check if there is a value in the cache (Firestore) and returns it, if so.

    - Values are currently cached for 1 hour, in order to reduce queries to the GraphQL endpoint (which incur a charge).

1. If there is no valid cached value, a GraphQL query is performed. If successful, the cache is updated and the value is returned.
1. If no value is returned by the GraphQL query, HTTP status 500 is returned by the function.

## Deployment

Deployment is handled by Pulumi, with hosting on GCP.

To deploy:

1. Copy the `.env.sample` file and fill in any variables
1. Obtain the JSON credentials file for the project's service account and save as `gcp_credentials.json`. Firebase requires a service account for deployment, hence the need to jump through this hoop.
1. Run `pulumi stack select` and select/create the required stack
1. Run `pulumi refresh` to grab the current state from GCP
1. Run `pulumi up` to deploy.

If the GCP project is shared between stacks, you may need to import the default Firestore database: `pulumi import gcp:firestore/database:Database default "(default)"`
