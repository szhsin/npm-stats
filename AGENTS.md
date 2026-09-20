# Repository guidance

## Project

NPM Stats is a client-side React and TypeScript app built with Vite and deployed
to GitHub Pages. See the README for features and usage. Use Node.js 24 and npm.

## Git and commits

- Create commits only when requested.
- Stage only files or hunks relevant to the task. Preserve unrelated changes
  and the user's existing staging choices; review the staged diff before committing.
- Write concise commit messages using Conventional Commits.
- Preserve the repository owner's configured Git identity as the commit author.
  Never invent or override an identity. If none is configured, ask the user.
- For commits containing Codex-assisted changes, append this trailer after a
  blank line:

  ```text
  Co-authored-by: Codex <codex@openai.com>
  ```

- Do not amend existing commits unless requested.
- Do not push changes to GitHub without approval. A request to commit does not
  authorize a push.

## Development

- Install with `npm ci`; start the app with `npm run dev`.
- Format with `npm run format`.
- Keep changes focused and follow the surrounding code style. Reuse existing
  components, hooks, API helpers, and CSS tokens before adding abstractions or dependencies.
- Keep `package-lock.json` in sync with package changes. Do not commit generated
  builds, dependencies, or temporary verification artifacts.
- Update the README when behavior or setup changes; keep implementation details
  in the relevant code and tests.

## Important constraints

- Never present incomplete download totals as successful results when a request fails.
- Preserve UTC date boundaries, inclusive month ranges, and partial-month reporting.
- Preserve shareable search URLs and Back/Forward navigation.
- Keep routes and assets working under a GitHub Pages repository subpath,
  including direct visits and refreshes.
- Pushes to `master` or `next` can deploy the site. Manual deployments also require approval.

## Validation

- For logic or dependency changes, run `npm run lint`, `npm test`, and `npm run build`.
- Add focused tests for changed behavior; mock npm responses and use fixed dates.
- For CSS changes, run lint and build and inspect the affected UI in a browser.
- Check UI changes on both tabs, in both themes, and at mobile and desktop widths.
  Preserve accessible labels, keyboard operation, and visible focus indicators.
  Check Safari/WebKit for native control changes when available; state testing limits.
- For documentation-only changes, check accuracy, links, and whitespace; skip app tests.
- Run `npm run format:check` and `git diff --check`; report changes, verification, and unresolved issues.
