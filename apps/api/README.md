# @skillcourse-dev/api

NestJS HTTP API for skillcourse. Serves courses + chapters from the configured `CourseRegistryAdapter` (filesystem default).

## Dev

```bash
pnpm --filter @skillcourse-dev/api dev    # tsx watch, hot reload
pnpm --filter @skillcourse-dev/api test
pnpm --filter @skillcourse-dev/api build
```

Default port: `3000`. Override via `PORT` env var.
