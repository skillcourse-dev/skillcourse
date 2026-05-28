# @skillcourse-dev/web

Vite + React 19 + Tailwind 4 SPA. Consumes the [@skillcourse-dev/api](../api) HTTP service.

## Dev

```bash
pnpm --filter @skillcourse-dev/api dev        # terminal 1: API on :3000
pnpm --filter @skillcourse-dev/web dev        # terminal 2: Vite on :5173
```

Vite's dev server proxies `/api/*` to `http://localhost:3000`, so no CORS config is needed in dev.

## Build

```bash
pnpm --filter @skillcourse-dev/web build
pnpm --filter @skillcourse-dev/web preview
```
