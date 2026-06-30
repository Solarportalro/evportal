# EV Portal Deployment Prep

This project is not deployed yet. Use this checklist when preparing a production environment.

## Local Development

```sh
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
docker compose up -d postgres
npm run prisma:migrate -w apps/api
npm run seed -w apps/api
npm run dev
```

Useful checks:

```sh
npm run prisma:generate -w apps/api
npm run build
npm run typecheck
npm run lint
```

## Production Checklist

1. Create a production PostgreSQL database.
2. Set `DATABASE_URL` to the production database connection string.
3. Set `NODE_ENV=production`.
4. Set strong unique values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
5. Set `FRONTEND_URL` to the production frontend URL.
6. Set `CORS_ORIGIN` to the allowed production frontend origin.
7. Build all workspaces with `npm run build`.
8. Run Prisma migrations against production.
9. Seed the vehicle catalog.
10. Create the first platform admin.
11. Start the API service.
12. Serve the web frontend.
13. Verify `GET /api/health`.
14. Verify `GET /api/ready`.
15. Verify login and the admin dashboard.

## Required Environment Variables

API:

```sh
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=strong-random-secret
JWT_REFRESH_SECRET=another-strong-random-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SET_PASSWORD_TOKEN_EXPIRES_IN=1h
FRONTEND_URL=https://example.com
CORS_ORIGIN=https://example.com
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=strong-temporary-password
ADMIN_PHONE=
ADMIN_FULL_NAME=Admin User
```

Web:

```sh
VITE_API_BASE_URL=https://api.example.com/api
```

## Database Commands

Development migration:

```sh
npm run prisma:migrate -w apps/api
```

Production migration:

```sh
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
```

Seed vehicle catalog:

```sh
npm run seed -w apps/api
```

Create or update the first platform admin:

```sh
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='strong-password' npm run admin:create -w apps/api
```

The admin creation command is idempotent and does not print the password.

## DigitalOcean Notes

Recommended options:

- App Platform for the API and frontend, or a Droplet for manual control.
- Managed PostgreSQL is preferred over running PostgreSQL on the app host.
- The frontend can be served separately as a static site if needed.

Deployment order:

1. Configure production env variables.
2. Run `npm install` or the platform build step.
3. Run `npm run build`.
4. Run `npx prisma migrate deploy --schema apps/api/prisma/schema.prisma`.
5. Run `npm run seed -w apps/api`.
6. Run `ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run admin:create -w apps/api`.
7. Start the API with `node apps/api/dist/server.js`.
8. Serve `apps/web/dist` from the selected static hosting service.

## Security Checklist

- Never commit real `.env` files.
- Rotate secrets immediately if leaked.
- Use strong, unique JWT secrets.
- Use `NODE_ENV=production` in production.
- Restrict CORS to the production frontend origin.
- Use HTTPS only.
- Back up the production database.
- Use managed database backups where available.
- Keep admin credentials limited and rotate temporary passwords.
