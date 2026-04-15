# TidyX Project Overview

## 1) What TidyX Is
TidyX is a SaaS product for maintainers and contributors who manage large volumes of GitHub Issues and Pull Requests.

Core value:
- Personalized prioritization for triage.
- Duplicate detection support.
- Label recommendation/automation.
- In-app actions (comment, label, close) without context switching.

## 2) Problem Statement
Open source repositories receive many incoming items that are often:
- Unlabeled.
- Duplicated.
- Mixed in urgency and ownership relevance.

Maintainers spend significant time deciding:
- "Is this important for me now?"
- "Is this duplicate?"
- "How should this be labeled?"

## 3) Current Repository State (2026-04-15)
Backend:
- NestJS + Swagger (OpenAPI, code-first) scaffold is implemented.
- API contracts are defined across Dashboard, Repositories, Projects, Labels, Summary, Auth/Menu.
- Most endpoints currently return stub/sample data.
- Validation and common error response shape are implemented globally.

Frontend:
- Placeholder directories only (`frontend/homepage`, `frontend/console`).

## 4) Current API Scope
High-level endpoint groups:
- Auth/Menu
- Dashboard
- Repositories
- Projects
- Labels
- Summary
- Health

For full list, see:
- `backend/README.md`
- Swagger UI at `/docs` when backend is running

## 5) Next Milestones
1. Replace stub responses with real service + DB access.
2. Integrate teammate's GitHub Auth/OAuth flow.
3. Integrate teammate's GitHub API sync flow.
4. Persist refresh runs and work items in PostgreSQL.
5. Implement real priority/duplicate/label pipelines.

## 6) Working Agreement (Recommended)
- Keep API contracts stable (DTO + Swagger annotations) while implementation evolves.
- If contract changes are necessary, update Swagger and docs in the same PR.
- Separate "contract changes" PRs from "behavior/data" PRs when possible.
