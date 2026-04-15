# TidyX Architecture (Current)

## 1) Runtime Components
- Console Frontend (planned)
- Backend API (NestJS, implemented)
- GitHub Auth/API (partially implemented by another teammate, integration pending)
- Database (planned, not yet connected)

## 2) Backend Structure
Root backend module:
- `backend/src/app.module.ts`

Current controller modules:
- `health`
- `auth` + `menu`
- `dashboard`
- `repos`
- `projects`
- `labels`
- `summary`

Common layers currently present:
- DTO contracts: request/response schemas with Swagger decorators.
- Global validation: `ValidationPipe`.
- Common API error format via exception filter.

## 3) API Contract-First Approach
Design choice:
- We use NestJS code-first OpenAPI generation (`@nestjs/swagger`).

Why:
- Single source of truth from DTO + controller annotations.
- Faster alignment between frontend/backend.
- Contract is visible immediately in Swagger UI.

## 4) Request Handling Flow
Current generic flow:
1. Request enters controller route.
2. DTO validation runs globally.
3. On validation error, unified error response is returned.
4. Controller returns response payload (currently often stub data).

Future flow (target):
1. Controller
2. Service layer (business logic)
3. Repository/DB layer
4. Optional GitHub provider client
5. Domain response mapping DTO

## 5) Known Limitations
- No real persistence yet (stub-first).
- No real auth guard/session enforcement in API behavior yet.
- GitHub sync logic not wired into these controller responses yet.

## 6) Integration Entry Points
When integrating teammate work:
- Auth integration: `backend/src/auth/*`
- GitHub sync integration: `backend/src/repos/*`, `backend/src/dashboard/*`
- Summary aggregation: `backend/src/summary/*`

Keep stable during integration:
- DTO field names/types already used as contract.
- Existing route paths/methods unless coordinated contract change.
