# Agent Rules

Rules for AI coding agents working on the eDM Helper project.

## Scope & Authority

- **The user's request is the source of truth.** Do not invent requirements or assume behavior that was not requested.
- **Make the smallest change necessary** to complete the task.
- **Do not fix unrelated bugs**, perform unrelated cleanup, refactor unrelated code, redesign unrelated UI, or rename unrelated files or variables.
- **Do not add dependencies** unless genuinely necessary and approved.
- **Do not change architecture, API contracts, database/storage behavior, or data flow** unless required by the task.
- **Inspect existing implementation and usages** before modifying shared code.
- **Reuse existing functions, utilities, CSS tokens, and patterns** before creating new ones.
- **Prefer extending existing code** over creating duplicate implementations.
- **Never overwrite, discard, or reset the user's uncommitted work.**
- **Ask before destructive or broad architectural changes.**
- **Validate only what is relevant** to the actual changes.
- **Clearly report anything discovered but intentionally left untouched.**

## Commit Policy

- **Only commit when explicitly asked by the user.**
- When the user says "commit", update before committing:
  1. `CHANGELOG.md` with user-facing changes
  2. `content/home.md` Recent Updates section
  3. `js/tool-versions.js` version if a tool version changed
  4. Cache-busters in affected HTML files when CSS or JavaScript changes
- Include documentation updates in the same commit.
- Never commit without explicit user request.
- Do not run `git push --force` or destructive git operations unless explicitly asked.

## Release Hygiene

See `STYLE-GUIDE.md` section "Release Hygiene" for the full checklist. Key items:

- Update `content/home.md` Recent Updates.
- Update `CHANGELOG.md`.
- Update `js/tool-versions.js` for tool-specific user-facing changes.
- Refresh cache-busters in affected HTML files when CSS or JavaScript changes.
- Run `git diff --check` before handing work back.

## Coding Rules

- Make minimal changes to achieve the goal.
- Follow existing code style in the project.
- Refer to `STYLE-GUIDE.md` for design tokens, UI patterns, and CSS conventions.
- Run `node --check <file>` and `node --test tests/*.test.js` after JavaScript changes.
- Use the dedicated Read/Write/Edit tools for file operations; avoid Shell for file content changes.
- Prefer editing existing files over creating new ones unless explicitly required.
- Keep it stupidly simple; do not overcomplicate.

## Project Context

- eDM Helper is a static web application hosted on GitHub Pages.
- Branch: `dev`.
- Main technologies: vanilla HTML/CSS/JS, no build step.
- Runtime integrations are local-only; no Supabase or external service is used.

## Communication

- Respond in the same language as the user (Indonesian for this project).
- Be concise and accurate.
- Ask for clarification when requirements are unclear.

## Documentation Hierarchy

- `README.md` → project/setup/development overview
- `STYLE-GUIDE.md` → UI/design rules and release hygiene
- `TOOLS_AND_FUNCTIONS.md` → tool/function documentation
- `CHANGELOG.md` → change history
- `AGENTS.md` → rules for AI agents (this file)

Do not duplicate detailed documentation from those files.
