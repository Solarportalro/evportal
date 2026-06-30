# EV Portal QA Checklist

Use this checklist to verify the core EV Portal marketplace flow on a local development environment.

## Local Setup

```sh
npm install
docker compose up -d postgres
npm run prisma:migrate -w apps/api
npm run seed -w apps/api
npm run seed:demo -w apps/api
npm run dev
```

## Demo Accounts

- Platform admin: `admin@evportal.local` / `Admin12345!`
- Customer: `customer@evportal.local` / `Customer12345!`
- Active company 1: `company1@evportal.local` / `Company12345!`
- Active company 2: `company2@evportal.local` / `Company12345!`
- Pending company 3: `company3@evportal.local` / `Company12345!`

## A. Public Request Flow

1. Open `/request/new`.
2. Submit a request with contact information and no password.
3. Confirm the request is created as `SUBMITTED`.
4. Login as admin and confirm the request appears in `/admin/vehicle-requests`.
5. Login as an active company and confirm the submitted request is hidden until approval.

## B. Admin Request Approval

1. Login as `admin@evportal.local`.
2. Open `/admin/vehicle-requests`.
3. Approve a submitted request.
4. Confirm the request status becomes `ACTIVE`.

## C. Company Offer Flow

1. Login as `company1@evportal.local`.
2. Open company requests and confirm active requests are visible.
3. Submit an offer for an active request.
4. Confirm company users cannot see competitor offers.

## D. Customer Offer Comparison

1. Login as `customer@evportal.local`.
2. Open the demo BYD Atto 3 request offers.
3. Compare offer cards for price, delivery, warranty, financing, charger, and included costs.
4. Select one offer.
5. Confirm the contact reveal consent prompt appears and is clear.
6. Confirm the selected offer state is shown after selection.

## E. Company Contact Access

1. Login as the selected company.
2. Confirm the selected customer contact is visible from the contact endpoint/page.
3. Login as a non-selected company.
4. Confirm customer contact is not visible.

## F. Company Approval Flow

1. Login as `company3@evportal.local`.
2. Confirm pending company cannot see customer requests or submit offers.
3. Login as admin and approve `Hybrid Motors`.
4. Login as company3 again.
5. Confirm company3 can now see active requests.

## G. Admin Reporting

1. Login as admin.
2. Open `/admin/reports`.
3. Confirm overview, funnel, demand, offers, company performance, and solar/EV sections render.
4. Confirm reports do not expose customer contact details.

## H. Admin User Management

1. Open `/admin/users`.
2. Disable a non-critical test user.
3. Confirm the disabled user cannot login.
4. Re-enable the user.
5. Confirm the user can login again.

## I. Admin Vehicle Catalog

1. Open `/admin/vehicle-catalog`.
2. Add or edit a test make/model.
3. Deactivate and reactivate the make/model.
4. Confirm public request forms hide inactive catalog items.

## J. Smoke Checks

1. Verify `GET /api/health` returns success.
2. Verify `GET /api/ready` returns success when the database is reachable.
3. Run `npm run smoke -w apps/api` while the API is running.
4. Confirm no console/runtime crash in core pages.
5. Check public request, customer request, company offer, company profile, admin dashboard, and reports pages at mobile width.
