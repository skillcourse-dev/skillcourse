# Contributing

Thanks for your interest in skillcourse.

## Setup

```bash
git clone https://github.com/skillcourse-dev/skillcourse.git
cd skillcourse
pnpm install
pnpm -r test
```

Node 22 and pnpm 9 are required (see `.nvmrc` and `packageManager`).

## Development loop

1. Fork the repo and create a topic branch from `main`.
2. Write a failing test for the behavior you want.
3. Make it pass with the minimum code.
4. `pnpm -r typecheck && pnpm -r test` locally.
5. Open a PR. CI runs typecheck + test + build + CodeQL + dependency-review.

## Conventions

- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`).
- No em-dashes anywhere in code or docs. Use commas, colons, or periods.
- ESM only. NodeNext modules. Strict TypeScript.

## Questions

Open a "Feature request" issue with the question, or start a GitHub Discussion.
