# EV Portal by SolarPortal

EV Portal is a reverse vehicle marketplace for Armenia. Customers will submit vehicle needs, and vehicle companies will submit structured offers.

This repository currently contains only the technical foundation for the future marketplace.

## Workspaces

- `apps/web`: React, Vite, TypeScript frontend
- `apps/api`: Node.js, Express, TypeScript, Prisma API
- `packages/shared`: Shared TypeScript enums and API types
- `docs`: Project documentation

## Local Development

Install dependencies:

```sh
npm install
```

Start PostgreSQL:

```sh
docker compose up -d postgres
```

Generate Prisma Client:

```sh
npm run prisma:generate -w apps/api
```

Run the web app:

```sh
npm run dev -w apps/web
```

Run the API:

```sh
npm run dev -w apps/api
```
