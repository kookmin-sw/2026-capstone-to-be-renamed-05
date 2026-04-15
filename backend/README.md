# TidyX Backend

NestJS backend skeleton with OpenAPI (Swagger) in code-first mode.

## Quick Start

```bash
npm install
npm run start:dev
```

Default server URL: `http://localhost:3000`

## OpenAPI Docs

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs-json`

## Implemented API Specification (Swagger)

- Auth/Menu
  - `GET /auth/github/login`
  - `GET /auth/github/callback`
  - `POST /auth/logout`
  - `POST /auth/switch-account`
  - `GET /me`
- Dashboard
  - `GET /dashboard/items`
  - `GET /dashboard/items/:itemId`
  - `GET /dashboard/items/:itemId/diff`
  - `POST /dashboard/items/:itemId/conversations`
  - `PATCH /dashboard/items/:itemId/conversations/:conversationId`
  - `POST /dashboard/items/:itemId/labels/recommendations/apply`
  - `POST /dashboard/items/:itemId/duplicates/resolve`
  - `POST /dashboard/items/:itemId/close`
- Repositories
  - `GET /repos`
  - `POST /repos`
  - `DELETE /repos/:id`
  - `POST /repos/:id/refresh`
  - `GET /repos/:id/refresh/:runId`
  - `POST /repos/:id/switch`
- Projects
  - `GET /projects`
  - `GET /projects/:id`
  - `POST /projects`
  - `PATCH /projects/:id`
  - `DELETE /projects/:id`
- Labels
  - `GET /labels`
  - `GET /labels/settings`
  - `PATCH /labels/settings`
  - `POST /labels/sync`
- Summary
  - `GET /summary`
