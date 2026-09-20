# NPM Stats

Explore npm download totals for a package or an author's most popular packages over the months you choose. No account or API key is required.

## What you can do

- **Look up a package:** See total downloads for names such as `react`, `express`, or `@szhsin/react-menu`.
- **Explore an author:** View up to 10 popular packages, their individual download counts, and a combined total.
- **Choose your period:** Search a single month, a full year, or several years using the **From** and **To** month selectors.
- **Share a search:** Copy the page address to share or bookmark a package or author with the selected months. Use your browser's Back and Forward buttons to revisit searches.
- **Use it on any screen:** Browse on desktop or mobile with a theme that follows your device's light or dark setting, including changes while the page is open. The theme button overrides it until you refresh the page.

## Getting started

1. Choose the **Package** or **Author** tab.
2. Enter a package name, such as `react`, or an npm author username, such as `sindresorhus`.
3. Choose the **From** and **To** months. The default range runs from the same month last year through the current month.
4. Click **Get Total Downloads** or **Get Downloads by Author** to view the results.

Click any package in an author's results to open its download total for the same month range.

In a package's results, click **View on npm** to open its npm page in a new tab.

## Understanding the results

**Date coverage.** All download counts come from npm. You can search history from January 2015 onward. Both selected months are included; the current month covers only the days available so far. Results indicate when a range includes a partial month.

**Author rankings.** The app selects up to 10 packages using npm's popularity ranking, then orders those packages by downloads in your chosen period. The combined total covers the displayed packages, and the page shows how many were included out of the matching packages.

**Repeat searches.** Recent results may be reused for up to 24 hours, including after a page refresh, to make repeat searches faster and reduce requests to npm.

**Trying again.** If npm temporarily limits requests, wait before clicking **Try again**. If any package in an author search fails to load, the app asks you to retry before showing a combined total.

## Run locally

With Node.js 24 installed, run:

```bash
npm ci
npm run dev
```

Open the local address shown in your terminal. For contributors, `npm test` runs the tests, `npm run lint` checks the code, and `npm run build` creates a production build.

## AI-assisted development

This project was built using an AI-assisted development workflow with OpenAI Codex.

AI agents helped with:

- **Interface:** Building the React and TypeScript app, responsive layouts, light and dark themes, and reusable search forms.
- **Download statistics:** Integrating npm APIs for package totals and author rankings, with month-range selection and partial-month reporting.
- **Navigation and reliability:** Adding shareable search URLs, browser history support, a persistent 24-hour cache, response validation, and error and retry states.
- **Code organization:** Refactoring the app into focused pages, shared components, hooks, and API utilities.
- **Testing:** Adding automated tests for download calculations, author results, caching, and search routes.
- **Documentation and deployment:** Writing the README and configuring GitHub Actions to lint, test, build, and deploy the app to GitHub Pages.

## License

This project is licensed under the [MIT License](LICENSE).
