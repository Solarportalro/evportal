# EV Portal by SolarPortal

EV Portal is a reverse vehicle marketplace for Armenia. Customers submit vehicle needs, and vehicle companies submit structured offers. The repository contains the React frontend, Express/Prisma API, and shared TypeScript package for the marketplace foundation.

## Workspaces

- `apps/web`: React, Vite, TypeScript frontend
- `apps/api`: Node.js, Express, TypeScript, Prisma API
- `packages/shared`: Shared TypeScript enums and API types
- `docs`: Project documentation

## Local Setup

```sh
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
docker compose up -d postgres
npm run prisma:generate -w apps/api
npm run prisma:migrate -w apps/api
npm run seed -w apps/api
```

## Development

Run both apps:

```sh
npm run dev
```

Or run them separately:

```sh
npm run dev -w apps/api
npm run dev -w apps/web
```

Health checks:

```sh
curl http://localhost:4000/api/health
curl http://localhost:4000/api/ready
```

## Main Scripts

```sh
npm run build
npm run typecheck
npm run lint
npm run prisma:generate -w apps/api
npm run prisma:migrate -w apps/api
npm run seed -w apps/api
npm run admin:create -w apps/api
```

## Environment

Use `.env.example` files as templates. Real `.env` files are ignored by git and must not be committed.

- API env: `apps/api/.env.example`
- Web env: `apps/web/.env.example`

## Deployment Prep

Production deployment notes and checklists are in `docs/DEPLOYMENT.md`.
