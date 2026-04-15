# ADR-0001: API Contract-First with NestJS Code-First OpenAPI

- Date: 2026-04-15
- Status: Accepted

## Context
Team members are implementing in parallel:
- API definitions
- GitHub Auth
- GitHub API integration

Without an explicit contract, parallel work causes integration friction.

## Decision
Use NestJS code-first Swagger/OpenAPI as the contract source of truth:
- DTO + controller decorators define the API contract.
- Swagger UI and OpenAPI JSON are generated from code.

## Consequences
Positive:
- Fast contract visibility and frontend alignment.
- Reduced ambiguity in request/response fields.
- Immediate manual testing via Swagger UI.

Trade-offs:
- Stub behavior can diverge from real behavior unless tracked.
- Contract changes require disciplined documentation updates.

## Follow-up
- Replace stub payloads with service + DB implementation while preserving contract compatibility.
