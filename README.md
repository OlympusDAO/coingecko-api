# CoinGecko API

## Purpose

This project serves the circulating supply of OHM to CoinGecko, so that it can be displayed accurately on the [token page](https://www.coingecko.com/en/coins/olympus).

## Architecture

This is a very simple app, architected in the following way:

- GraphQL endpoint for the protocol-metrics subgraph. See: [olympus-protocol-metrics-subgraph](https://github.com/OlympusDAO/olympus-protocol-metrics-subgraph)
- Firestore database
- Serverless function (in GCP)

When the function's trigger URL is hit, the following are performed:

1. Check if there is a value in the cache (Firestore) and returns it, if so.

    - Values are currently cached for 1 hour, in order to reduce queries to the GraphQL endpoint (which incur a charge).

1. If there is no valid cached value, a GraphQL query is performed. If successful, the cache is updated and the value is returned.
1. If no value is returned by the GraphQL query, HTTP status 500 is returned by the function.

## Deployment

Deployment is handled by Pulumi, with hosting on GCP.

To deploy:

1. Copy the `.env.sample` file and fill in any variables
1. Run `pulumi stack select` and select/create the required stack
1. Run `pulumi refresh` to grab the current state from GCP
1. Run `pulumi up` to deploy.
