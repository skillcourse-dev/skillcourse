---
name: hello-skillcourse
description: A 3-chapter intro to authoring your first agent skill on the skillcourse platform.
license: MIT
---

## 1. What is an agent skill?

An agent skill is a folder of markdown and supporting files that an AI agent loads into its context to gain a focused capability. The folder contains a `SKILL.md` with YAML frontmatter (name, description, license) and a markdown body that the agent reads as instructions. Optional `references/` and `scripts/` directories hold supporting material.

Skills follow the Anthropic Skills spec. They are installable in Claude Code today. A course in this platform IS a valid skill, byte-compatible with any host that speaks the spec.

## 2. Anatomy of SKILL.md

A SKILL.md has two parts: frontmatter and body.

The frontmatter contains exactly three fields:

- `name`: a kebab-case identifier.
- `description`: one sentence explaining what the skill does.
- `license`: an SPDX identifier such as `MIT` or `Apache-2.0`.

The body is plain markdown. In a course, each `## ` heading marks one chapter. The platform parses these headings to build the chapter list. Sub-sections (`### ` and below) belong to the parent chapter.

A final `## Companion skills` section lists skills the learner may want alongside this one. Bullets in that section are parsed by the platform and rendered as install cards.

## 3. Publishing your first skill

To publish a skill, you scaffold the folder with the CLI, write the body, validate, and push to a git remote. The platform discovers courses either from the local `courses/` directory or from a configured git registry.

A minimal publication flow:

1. Run `npx @skillcourse-dev/cli init my-course`.
2. Edit `SKILL.md`. Add chapters as H2 headings.
3. Run `npx @skillcourse-dev/cli validate`.
4. Commit and push.

That is the entire publication loop. There is no review board, no judge step, no proprietary gating in this open-source platform. Quality is governed by the author, the validator, and reviewers on the destination repo.

## Companion skills

- [skill-creator](https://github.com/skillcourse-dev/skill-creator): `npx @skillcourse-dev/cli add skill-creator`
- [skill-linter](https://github.com/skillcourse-dev/skill-linter): `npx @skillcourse-dev/cli add skill-linter`
