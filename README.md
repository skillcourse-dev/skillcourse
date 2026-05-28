# skillcourse

[![ci](https://github.com/skillcourse-dev/skillcourse/actions/workflows/ci.yml/badge.svg)](https://github.com/skillcourse-dev/skillcourse/actions/workflows/ci.yml)
[![codeql](https://github.com/skillcourse-dev/skillcourse/actions/workflows/codeql.yml/badge.svg)](https://github.com/skillcourse-dev/skillcourse/actions/workflows/codeql.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![node](https://img.shields.io/badge/node-22-brightgreen.svg)](.nvmrc)

Open-source pedagogical layer for Anthropic Skills. Turn skill folders into chat-driven courses with chapters, progress, and quizzes.

Status: **pre-release**. v0.1.0 in active development.

## What works today

- `@skillcourse-dev/shared` zod schemas for `metadata.json` and `quiz.json`.
- Pure-function parsers for SKILL.md frontmatter, H2 chapters, companion-skills section, and estimated minutes.
- `loadCourse(dir)` returns a fully-typed `Course`.
- `@skillcourse-dev/cli` with `init`, `validate`, `bump`, `quiz init` commands.
- `@skillcourse-dev/api` NestJS HTTP service with `GET /health`, `GET /courses`, `GET /courses/:slug`, `GET /courses/:slug/chapters/:index`.
- `@skillcourse-dev/web` Vite + React 19 + Tailwind 4 SPA with course list, course detail, and chapter view (markdown rendering with GFM + syntax highlighting).
- `DatabaseAdapter` (SQLite default, file at `./data/skillcourse.db`).
- `CourseRegistryAdapter` (filesystem default, reads `./courses/`, mtime-keyed in-memory cache).
- Sample course at `courses/hello-skillcourse/` with 3 chapters, 2 companion skills, and a 3-question quiz.
- CI: typecheck, test, build, CodeQL, dependency-review.
- Dependabot, branch protection, issue + PR templates, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY.

## Layout

```
skillcourse/
├── apps/
│   ├── api/                 # NestJS HTTP service
│   └── web/                 # Vite + React + Tailwind SPA
├── packages/
│   ├── shared/              # zod schemas + course parser
│   └── cli/                 # authoring CLI
├── courses/
│   └── hello-skillcourse/   # sample course
└── docs/                    # spec (coming in a later milestone)
```

## Development

```bash
pnpm install
pnpm -r typecheck
pnpm -r test
pnpm -r build
pnpm --filter @skillcourse-dev/api dev   # NestJS dev server on :3000
pnpm --filter @skillcourse-dev/web dev   # Vite dev server on :5173 (proxies /api to :3000)
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full development loop and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) for community norms.

## Updating a course

A course is a real Anthropic Skill folder; updates are just edits to that folder:

1. Edit `courses/<slug>/SKILL.md` (or `quiz.json`, or `metadata.json`).
2. `npx @skillcourse-dev/cli bump <patch|minor|major>` (Plan 2 ships this).
3. `npx @skillcourse-dev/cli validate` (Plan 2).
4. Commit and push. The platform picks up changes via filesystem hot-reload in dev or git webhook in production (Plan 3).

## Roadmap

- Plan 2: `@skillcourse-dev/cli` (init / validate / bump / quiz init)
- Plan 3: NestJS API skeleton + adapters
- Plan 4: Vite + React + Tailwind web app
- Plan 5: Progress tracking + Better-Auth
- Plan 6: Chat runtime via AI SDK v6
- Plan 7: Quiz feature
- Plan 8: CLI completion + Docker image + v0.1.0 release + docs site at skillcourse.dev

## License

MIT. Built and maintained by [skills-il](https://github.com/skills-il).
