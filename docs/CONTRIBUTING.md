# Contributing to RunPod Stack Launcher SDK

Thank you for considering contributing! We welcome PRs from the community and enterprise partners.

## Coding Style
- Use TypeScript (strict mode)
- 2 spaces for indentation
- Prefer named exports
- Use async/await for async code
- Use logger helpers (not raw console.log)
- Keep functions small and focused

## Commit Messages
- Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `test:` for tests
  - `refactor:` for refactoring
  - `chore:` for build, CI, or tooling
- Example: `feat: add support for custom GPU pools`

## Semantic Versioning
- Follows [semver.org](https://semver.org/)
- Major: breaking changes
- Minor: new features, backwards compatible
- Patch: bug fixes, docs, tests

## Running Tests

```bash
npm install
npm run build
npm test
```

- All new code must be covered by unit or integration tests.
- Use [Vitest](https://vitest.dev/) for unit tests.
- Use [execa](https://github.com/sindresorhus/execa) for CLI integration tests.

## Pull Requests
- Fork the repo and create a feature branch
- Add/modify tests for your changes
- Ensure `npm run test` passes
- Open a PR with a clear description

Thank you for helping make this project better! 