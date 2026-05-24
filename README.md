# Avtive UI - Multi-Org Data Transfer System

Live Preview: https://avtive-855nufokf-labib-7610s-projects.vercel.app/

## How To Run This Project

This project is a Next.js 16 application that uses Neon Postgres, Drizzle ORM, and SMTP email delivery through Nodemailer.

### Prerequisites

- Node.js `20.9.0` or newer
- `npm`
- A Neon Postgres database
- SMTP credentials for OTP and transfer emails

### 1. Install dependencies

```bash
npm install
```

### 2. Create the environment file

Create `.env.local` in the project root and use the following values:

```env
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
EMAIL_FROM=no-reply@example.com
EMAIL_PASS=your-smtp-password
EMAIL_USER=your-smtp-user
NODE_ENV=development
SESSION_SECRET=replace-with-at-least-32-characters
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
```

### 3. Run database migrations

```bash
npm run db:migrate
```

### 4. Optional: seed demo data

This creates:

- `Organization A`
- `Organization B`
- one user for each organization
- `500` initial rows for Organization A

```bash
npm run db:seed
```

### 5. Start the development server

```bash
npm run dev
```

Open `http://localhost:3000`.

### 6. Run tests

```bash
npm test
```

You can also run scenario-specific suites:

```bash
npm run test:auth
npm run test:onboard
npm run test:transfer
npm run test:lib
npm run test:smoke
```

### 7. Production build

```bash
npm run build
npm run start
```


## Project Description

This project is a functional prototype of a multi-organization data management and transfer system. The system allows organizations to onboard themselves, authenticate with an email OTP flow, manage their own rows, and transfer a copy of their visible data to another registered organization together with a message.

The main requirement behind the implementation is isolation. After a transfer, the recipient gets its own independent copy of the rows. Future additions or deletions in the sender organization do not mutate the recipient organization’s dataset.

## Core Features

- Organization onboarding with optional seed data
- Email OTP authentication
- HttpOnly session cookie authentication
- Add row with default `unlisted` values
- Delete row from the current organization view
- Transfer current visible rows to another organization
- Attach a custom transfer message
- Send transfer notification email to the recipient organization
- Row-level organization isolation using Postgres RLS plus application-level checks
- Route-handler based backend under `src/app/api`
- Jest scenario-based tests

## Technologies Used

### Frontend

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- shadcn-style UI primitives
- Lucide React icons

### Backend

- Next.js Route Handlers
- Drizzle ORM
- Neon Postgres
- Jose for signed session tokens
- Nodemailer for SMTP email delivery
- Zod-style server-side validation patterns

### Testing

- Jest
- React Testing Library

## Architecture Overview

The application is split into three main layers:

### 1. UI layer

Located in `src/components`.

This layer is intentionally presentational. Components render the interface and submit forms to backend routes, but the business logic is not implemented inside the components.

### 2. Page layer

Located in `src/app`.

This layer fetches server-side data for rendering pages such as login, onboarding, and transfer. Pages do not contain mutation logic. They only pass data and action URLs into components.

### 3. Backend/business layer

Located in:

- `src/app/api`
- `src/lib`

The route handlers in `src/app/api` are the HTTP entry points. They parse form submissions, validate them, call business logic from `src/lib`, set cookies where needed, and redirect back to UI routes.

This structure was chosen because it cleanly separates:

- presentation
- request handling
- business logic
- database access

It also makes the system easier to test and easier to extend later for external clients if a public API is needed.

## Why This Design Approach Was Chosen


### Why a copy-based transfer model

Transferred data is copied into the recipient organization instead of sharing the same rows across organizations.

This was chosen because the task requires post-transfer independence:

- Organization A can add rows later without affecting Organization B
- Organization B receives an owned snapshot at the time of transfer
- deletion and future edits stay isolated per organization

For this assessment, copy-on-transfer was the most pragmatic implementation because it gave the strongest guarantees with the lowest risk:

- simple to reason about during review
- easy to test and verify
- avoids subtle cross-tenant mutation bugs
- makes post-transfer isolation explicit in both the schema and the code
- reduces the chance of delivering an overengineered but fragile solution under time constraints

In other words, this approach was chosen intentionally for correctness, clarity, and reliability in an MVP/test-task setting, not because it is the only possible production design.

### Why RLS plus application checks

The app uses both:

- database row-level security on `data_rows`
- application-level authorization checks in route handlers and library functions

RLS reduces the chance of accidental cross-organization row access. The application layer still performs explicit checks because RLS alone is not enough to express the full business workflow.

## Database Design

The database schema is defined in [src/db/schema.ts](/home/labib-kamran/Desktop/GitHub/avtive-ui/src/db/schema.ts).

### Tables

#### `organizations`

Stores each registered organization.

Fields:

- `id`
- `name`
- `slug`
- `notification_email`
- `created_at`

Reasoning:

- `slug` provides a stable organization identifier for UI and internal references
- `notification_email` is used for transfer notifications

#### `users`

Stores users that belong to organizations.

Fields:

- `id`
- `organization_id`
- `email`
- `name`
- `created_at`

Reasoning:

- each user belongs to exactly one organization
- `email` is unique because the OTP flow is email-based

#### `otp_codes`

Stores login/onboarding OTP challenges.

Fields:

- `id`
- `user_id`
- `email`
- `code_hash`
- `expires_at`
- `attempts`
- `used_at`
- `created_at`

Reasoning:

- the OTP itself is never stored in plain text
- only the hash is stored
- attempts and expiration support brute-force protection

#### `transfers`

Stores transfer events between organizations.

Fields:

- `id`
- `from_organization_id`
- `to_organization_id`
- `created_by_user_id`
- `message`
- `row_count`
- `created_at`

Reasoning:

- provides an auditable record of data movement
- preserves sender, recipient, row count, and attached message

#### `data_rows`

Stores the business rows owned by each organization.

Fields:

- `id`
- `organization_id`
- `field_one`
- `field_two`
- `field_three`
- `source_transfer_id`
- `deleted_at`
- `created_at`

Reasoning:

- rows belong to a single organization
- transferred rows point back to the transfer event through `source_transfer_id`
- soft deletion is implemented through `deleted_at`

#### `rate_limits`

Stores request tracking data for throttling sensitive flows.

Fields:

- `id`
- `key`
- `action`
- `created_at`

Reasoning:

- used for login OTP requests
- used for OTP verification
- used for onboarding
- used for transfer actions

## Multi-Organization Isolation Model
- route handlers are a clearer fit for auth, onboarding, transfer, and session management when the project should read like a backend-enabled product instead of a UI-only prototype

The system is designed so that each organization has an independent working dataset.

### Behavior

1. Organization A owns its own rows.
2. When Organization A transfers data to Organization B, the visible rows are copied.
3. The copied rows become owned by Organization B.
4. If Organization A adds rows later, those rows stay only in Organization A.
5. If Organization B deletes rows from its own copy, Organization A is unaffected.

This approach matches the task requirement that transferred data must become separate after transfer.

## Production-Scale Alternative

If this system needed to scale beyond the assessment scope, the stronger long-term approach would be a snapshot/versioned dataset model instead of immediate row duplication.

### Recommended model

Possible tables:

- `datasets`
- `dataset_versions`
- `dataset_rows`
- `organization_dataset_access`
- `row_overrides`

### How it would work

1. Organization A works on a current dataset version.
2. A transfer creates a frozen snapshot/version of that dataset.
3. Organization B receives access to that frozen version instead of a full physical copy of every row.
4. If Organization B edits data later, the system creates org-specific overrides or forks a new version.
5. New rows added by Organization A after the transfer do not appear in Organization B because the recipient is pinned to the transferred snapshot.

### Why this is better at scale

- lower storage duplication
- faster transfers for large datasets
- stronger audit/version history
- cleaner transfer lineage
- better support for repeated transfers of large row sets

### Why it was not implemented here

That design is more powerful, but it is also significantly more complex:

- reads need to resolve base rows plus overrides
- transfer logic becomes version-aware
- authorization rules become harder to reason about
- testing surface increases substantially

For a hiring task, the better decision was to implement the simpler model completely and correctly, then document the more scalable production design explicitly. This demonstrates both delivery discipline and architectural awareness.

## Row Level Security

RLS is enabled on `data_rows`.

The application sets a transaction-scoped Postgres setting named `app.allowed_organization_ids` and queries `data_rows` inside that context. This allows the database itself to enforce which organization rows are accessible during row operations.

This was implemented to reduce the risk of accidental cross-tenant reads or writes if application logic is changed later.

## API Routes

The backend mutation layer is implemented with route handlers:

- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/logout`
- `POST /api/onboard`
- `POST /api/transfer/add-row`
- `POST /api/transfer/delete-row`
- `POST /api/transfer/submit`

These routes:

- parse incoming form data
- validate input
- enforce rate limits
- authenticate the current user where required
- call business logic from `src/lib`
- redirect back to the correct page with success or error query params

## Authentication Flow

### Login

1. The user enters an email on `/login`.
2. `POST /api/auth/request-otp` validates the email.
3. A rate-limit check is applied.
4. The corresponding user is loaded from the database.
5. A 6-digit OTP is generated.
6. The OTP is hashed and stored in `otp_codes`.
7. The OTP is emailed to the user.
8. In development and test, the OTP is also printed to the console.
9. The user is redirected back to `/login` in OTP mode.

### Verify OTP

1. The user submits the 6-digit code.
2. `POST /api/auth/verify-otp` validates the format.
3. A rate-limit check is applied.
4. The newest valid unused OTP is loaded.
5. The submitted code is hashed and compared.
6. Failed attempts increment the `attempts` count.
7. Successful verification marks the OTP as used.
8. A signed session token is stored in an HttpOnly cookie.
9. The user is redirected to `/transfer`.

## Onboarding Flow

1. A new organization is created from `/onboard`.
2. The system validates organization name, user name, and email.
3. A rate-limit check is applied.
4. The system ensures the email is not already registered.
5. A slug is generated from the organization name.
6. If the slug already exists, a randomized suffix is added.
7. The organization is inserted into the database.
8. The first user for that organization is created.
9. If selected, `500` random rows are seeded for the new organization.
10. An OTP is generated, hashed, stored, emailed, and printed to the console in development/test.
11. The user is redirected to the login verification step.

## Transfer Flow

1. An authenticated user opens `/transfer`.
2. The page loads rows owned by the current organization.
3. The page also loads all other registered organizations as possible recipients.
4. The user selects a recipient and enters a message.
5. `POST /api/transfer/submit` validates the input.
6. A transfer-specific rate-limit check is applied.
7. The selected recipient is verified against registered organizations.
8. The current visible rows are loaded.
9. A transfer record is created in `transfers`.
10. The visible rows are copied into the recipient organization.
11. The recipient organization receives an email notification with the sender name and attached message.
12. The sender is redirected back to `/transfer` with a success message.

## Row Management Rules

### Add Row

New rows are created with:

- `field_one = "unlisted"`
- `field_two = "unlisted"`
- `field_three = "unlisted"`

### Delete Row

Deletion is soft deletion through `deleted_at`.

### UI protection

The delete button disables itself and shows `Deleting...` while the request is in progress. This prevents duplicate submission caused by repeated clicks.

## Security Considerations

- OTP codes are stored as HMAC hashes, not plain text
- session tokens are signed and stored in HttpOnly cookies
- server-side validation is applied before all sensitive mutations
- route handlers re-check authentication and authorization
- rate limiting is applied to OTP, onboarding, and transfer flows
- row-level security is enabled on row data
- SMTP and database credentials are stored in environment variables
- transfer recipients are validated server-side instead of trusting client input

## Testing

The project uses Jest and React Testing Library.

Current coverage is split by scenario:

- `__tests__/auth`
- `__tests__/onboard`
- `__tests__/transfer`
- `__tests__/lib`
- `__tests__/smoke`

The test suite currently covers:

- auth routes
- onboarding route behavior
- transfer route behavior
- helper utilities
- smoke rendering checks

At the moment there are `41` passing tests across `7` suites.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:generate
npm run db:migrate
npm run db:seed
npm test
npm run test:auth
npm run test:onboard
npm run test:transfer
npm run test:lib
npm run test:smoke
```

## Deployment

Live Preview:

https://avtive-855nufokf-labib-7610s-projects.vercel.app/

The application is deployment-friendly because:

- it uses Neon serverless Postgres
- the backend is implemented with route handlers
- SMTP configuration is environment-based
- the UI and backend are both App Router compatible

## Future Improvements

- add integration tests against a dedicated test database
- add transfer history UI
- add organization member management
- add audit log UI for row creation, deletion, and transfers
- add resend OTP flow and OTP expiration countdown on the UI
- add stronger observability and structured logging

## Project Structure

```text
src/
  app/
    api/
      auth/
      onboard/
      transfer/
    login/
    onboard/
    transfer/
  components/
  db/
  lib/
__tests__/
scripts/
drizzle/
```

## Summary

This project was implemented as a backend-enabled multi-tenant prototype with strong separation between presentation, request handling, business logic, and persistence. The design favors clarity, testability, and safe organization isolation over shortcut implementations, which is the right tradeoff for the task this repository is solving.
