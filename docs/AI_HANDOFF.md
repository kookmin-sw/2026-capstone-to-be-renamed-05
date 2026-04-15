# AI Session Handoff Guide

This document is for a new AI session (or a new teammate) to quickly understand what to do next.

## 1) Read Order (Fast Onboarding)
1. `docs/PROJECT_OVERVIEW.md`
2. `docs/ARCHITECTURE.md`
3. `backend/README.md`
4. `backend/src/app.module.ts`
5. Target module controller + DTOs

## 2) Current Truth
- Backend API contracts are broadly defined.
- Swagger docs are live when backend runs.
- Many endpoints currently return stub/sample payloads.
- Validation + common error schema are implemented and should be preserved.

## 3) Run Commands
From repo root:

```bash
cd backend
npm install
npm run start:dev
```

Docs:
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs-json`

## 4) Important Constraints
- Do not silently change route paths or DTO field names without updating docs and consumers.
- Preserve the unified error response shape:
  - `statusCode`, `errorCode`, `message`, `details`, `path`, `timestamp`
- Prefer adding service/repository layers rather than adding logic directly into controllers.

## 5) Integration Priorities
1. Connect Auth session/token verification.
2. Replace repository refresh stubs with real GitHub data ingestion.
3. Persist work items to DB and serve dashboard from real data.
4. Replace summary stubs with aggregated query results.

## 6) Definition of "Real Endpoint"
An endpoint is considered production-ready when:
- Reads/writes real persisted data or provider data.
- Handles failure paths with explicit error codes.
- Has validation, tests, and contract-consistent response.

## 7) Handoff Checklist (Before Ending Session)
- Update docs if route/DTO changed.
- Confirm `npm run build` passes.
- Confirm `/docs-json` still generates.
- Summarize what remains stub vs real in PR description.
