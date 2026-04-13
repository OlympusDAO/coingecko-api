# AGENTS.md

## Project Overview

This repository provides a thin API layer for fetching and normalizing CoinGecko price and market metadata for Olympus tooling and jobs.

## Node and Tooling

- Node.js must use version 22+.
- Use `.nvmrc` and `.node-version` files for version alignment.
- Run `pnpm install --frozen-lockfile` before dependency-dependent work.

## Common Commands

- `pnpm install --frozen-lockfile`: install dependencies
- `pnpm run lint` or repository lint equivalent: run project lint checks
- `pnpm run build` or repository build equivalent: validate builds succeed
- `pnpm test` or repository test equivalent: validate behavior changes
