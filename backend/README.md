# TidyX Prototype Backend

## Environment Variables
Create `.env` from `.env.example`.

Required for full prototype:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_REDIRECT_URI`
- `OPENAI_API_KEY`

Optional:
- `PORT` (default `3000`)
- `CORS_ORIGIN` (default `http://localhost:5173`)
- `GITHUB_OAUTH_SCOPES` (default `repo,read:user,user:email`)
- `FRONTEND_OAUTH_SUCCESS_URL` (default `http://localhost:5173/console`)
- `OPENAI_MODEL` (default `gpt-4.1-mini`)
- `COOKIE_SECURE` (`true` or `false`)

## Setup
```bash
npm install
npm run prisma:generate
npm run db:init
npm run start:dev
```

`prisma db push` may fail on some local macOS/runtime combinations due Prisma schema-engine runtime issues.  
For this prototype, `db:init` creates the SQLite schema compatible with the Prisma models used by the app.

## Swagger
- `http://localhost:3000/docs`
- `http://localhost:3000/docs-json`

## Main Endpoints
- Auth
  - `GET /auth/github/login`
  - `GET /auth/github/callback`
  - `GET /auth/me`
  - `POST /auth/logout`
- GitHub
  - `GET /github/repos`
- Repositories
  - `GET /repos`
  - `POST /repos`
  - `DELETE /repos/:id`
  - `POST /repos/:id/sync`
  - `POST /repos/:id/sync-jobs`
  - `GET /repos/:id/sync-jobs/latest`
  - `GET /repos/:id/sync-jobs/:jobId`
  - `GET /repos/:id/items`
- Items
  - `POST /items/:id/close`
- Analysis
  - `POST /repos/:id/analyze`
  - `GET /repos/:id/duplicates`
  - `GET /repos/:id/priorities`
  - `GET /repos/:id/label-recommendations`
