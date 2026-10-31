# Playwright Automation Framework

> **Full guide:** [docs/FRAMEWORK_GUIDE.md](docs/FRAMEWORK_GUIDE.md) — setup, step-by-step local and CI runs, and every page, fixture and utility explained.
>
> **Interview prep:** [docs/INTERVIEW_PREP.md](docs/INTERVIEW_PREP.md) — pitch, architecture, Q&A, real problem-solving stories, and exercises based on this project.

Enterprise-grade UI + API automation framework built on `@playwright/test` and
TypeScript, using the Page Object Model. Designed for multiple engineers
working in parallel and execution through CI/CD.

## Getting started

```bash
npm install
npx playwright install --with-deps
cp .env.example .env          # fill in BASE_URL, API_URL, USERNAME, PASSWORD
```

## Running tests

```bash
npm test                 # full suite, ENV=dev (default)
npm run test:smoke       # only @smoke-tagged tests
npm run test:regression  # only @regression-tagged tests
npm run test:e2e         # only @e2e-tagged tests
npm run test:api         # only @api-tagged tests
npm run test:headed      # headed browser, useful while authoring
npm run test:ui          # Playwright's interactive UI mode
npm run test:debug       # PWDEBUG=1, opens the inspector
npm run report           # open the last HTML report
```

Against QA or Stage:

```bash
cp .env.qa.example .env.qa       # or .env.stage.example -> .env.stage
npm run test:qa                  # cross-env ENV=qa playwright test
npm run test:stage
```

`ENV` selects which `.env*` file `playwright.config.ts` loads (`.env` for
`dev`, `.env.<env>` otherwise). Nothing in the test code ever hardcodes a
URL, username, or password — see [Environment management](#9-environment-management).

Combine env and tag selection freely, e.g. `ENV=qa npx playwright test --grep @smoke`.

## Code quality

```bash
npm run lint
npm run lint:fix
npm run format
npm run typecheck
```

---

## 1. Folder responsibilities

| Folder | Responsibility |
|---|---|
| `tests/ui` | Browser-only specs, authenticated via the shared `storageState`. |
| `tests/api` | Pure `APIRequestContext` specs — no browser, no `storageState`. |
| `tests/e2e` | Cross-layer specs that chain API setup, UI actions, and API/DB validation. |
| `pages` | One class per application page: locators + page-level actions. No assertions, no full scenarios. |
| `components` | Reusable page fragments (header, nav) that appear on more than one page. |
| `fixtures` | Wires pages/components/API client into `test.extend`, so specs receive ready-to-use objects. |
| `utils` | Stateless helpers: API client, date/file helpers, random test-data builders, DB client. |
| `types` | Shared TypeScript interfaces for test data (`User`, `Credentials`). |
| `test-data` | Static, non-secret JSON fixtures. Never credentials. |
| `config` | Environment resolution — the single place that reads `process.env`. |
| `auth` | `auth.setup.ts` (logs in once) and the generated `storageState.json` (gitignored). |
| `.github/workflows` | CI pipeline definition. |

## 2. Page Object Model rules applied here

- Page classes hold **locators + actions**, never `expect(...)`. Assertions
  live in the spec so failures point at the test's intent, not a buried
  helper.
- `BasePage` is intentionally thin — see [Section 20](#20-basepage-design-decision).
- Components (`HeaderComponent`, `NavigationComponent`) exist because the
  header/nav appear on every authenticated page; without them, "logout"
  locators would be duplicated in `DashboardPage`, `UsersPage`, etc.
- Constructors take `Page` by dependency injection — nothing internally
  calls `chromium.launch()` or manages browser lifecycle. Playwright's test
  runner owns that; page objects only consume it.

## 3. Locator strategy

`UsersPage.rowFor()` demonstrates the required pattern for dynamic tables:

```typescript
private rowFor(userName: string): Locator {
  return this.userTable.getByRole('row').filter({ hasText: userName });
}
```

This resolves by **visible content**, not row index — it survives sorting,
pagination, and rows being added/removed. Every locator in `pages/` and
`components/` follows the priority `getByRole` → `getByLabel` →
`getByPlaceholder` → `getByText` → `getByTestId` → stable CSS → XPath
(never used here). None of the generated code indexes the DOM by structural
position (`nth-child`).

## 4. Fixtures — why not `new LoginPage(page)` in every test?

`fixtures/testFixtures.ts` extends `base.test` with one fixture per page
object/component/client. Three concrete benefits over constructing objects
inline:

1. **No repeated boilerplate.** Every spec that needs `usersPage` just
   declares it as a parameter; the wiring (`new UsersPage(page)`) lives in
   exactly one place.
2. **Lazy instantiation.** A fixture only runs if a test actually asks for
   it — a login-only spec never pays for a `UsersPage` instance.
3. **Lifecycle management.** `apiClient` disposes its `APIRequestContext`
   after each test automatically (`await client.dispose()` after `use()`).
   A test author cannot forget cleanup because the fixture owns it.

## 5. Authentication strategy

- `auth/auth.setup.ts` runs once as its own Playwright **project**
  (`setup`), logs in through the real UI, and writes
  `auth/storageState.json`.
- The `chromium`, `firefox`, `webkit`, and `e2e-chromium` projects declare
  `dependencies: ['setup']` and load that `storageState` — so a normal UI
  test starts already authenticated and never repeats a UI login.
- **When to reuse storage state:** any test whose purpose is *not* to
  validate the login flow itself (users, dashboard, e2e user-management).
- **When not to:** `tests/ui/login.spec.ts` and the full workflow test in
  `tests/e2e/user-management.spec.ts` override with
  `test.use({ storageState: { cookies: [], origins: [] } })` because they
  are specifically testing sign-in and sign-out.

**Approach selected:** one shared `storageState.json` regenerated by a
setup project. **Why:** logging in through the UI once instead of before
every test removes the single biggest source of suite runtime and
UI-login flakiness. **Alternative:** authenticate via API and inject a
token/cookie directly. **Trade-off:** API-based auth is faster still, but
only works if the app's session mechanism is simple to replicate outside
the browser; UI-based `storageState` is the more portable default and is
what's implemented here — swap in an API-token approach if your app
supports it cheaply.

## 6. Environment management

`config/environment.ts` is the **only** file that reads `BASE_URL`,
`API_URL`, `USERNAME`, `PASSWORD` from `process.env`, and it throws
immediately if one is missing — failing fast at startup instead of with a
confusing timeout deep inside a test. `playwright.config.ts` loads the
right `.env*` file based on `ENV` before the config body runs, so
`use.baseURL` and the `api` project's `baseURL` are populated correctly no
matter which environment is targeted.

Real `.env` files are gitignored; only `.env.example`, `.env.qa.example`,
and `.env.stage.example` are committed. Secrets for CI live in GitHub
Actions secrets (see the workflow file), never in the repo.

## 7. Test data management

- **Static, non-secret fixtures** → `test-data/*.json` (e.g. the named
  user used by the full login-driven scenario in
  `tests/e2e/user-management.spec.ts`).
- **Dynamic/random data** → `utils/testDataUtils.ts#buildRandomUser`, backed
  by `@faker-js/faker`, typed against the `User` interface in
  `types/testData.types.ts`.
- **API-created prerequisite data** → `tests/ui/users.spec.ts` and
  `tests/e2e/user-management.spec.ts` both create a user via `apiClient`
  before touching the UI, then delete it in a `finally` block.

**Parallel-safety trade-off called out explicitly:** `users.spec.ts`
originally could have reused the single named fixture user (as shown in
the prompt's own example) for both search *and* edit. That was changed
here to seed a fresh random user per test via the API instead, because two
parallel workers editing the same row is exactly the kind of shared
mutable state that causes intermittent failures (see
[Section 12](#12-flaky-test-prevention)). The one place a static named user
is still used — the full login→logout workflow test — is deliberately the
single exception, because that scenario is validating the literal
UI-driven flow end to end; in a real project, that account should be a
dedicated, reset-per-run seed record (or excluded from parallel sharding)
rather than a general-purpose fixture.

## 8. API + UI (and DB) layering

`tests/e2e/user-management.spec.ts` implements the full pattern:

```text
API (create user) -> UI (search, edit) -> UI assert (toast) -> API assert (GET reflects change) -> API (delete/cleanup)
```

Database validation is deliberately **not** mixed into page objects.
`utils/dbClient.ts` is a standalone service layer (using `mssql`) that a
test can import directly when it needs to assert against the database —
UI page objects never import it, so a plain UI/API test suite never needs
DB credentials or the `mssql` dependency on its path:

```text
Test
 ├── Page Objects → UI
 ├── ApiClient    → API
 └── DbClient     → Database
```

## 9. Error handling & debugging

`playwright.config.ts`:

```typescript
use: {
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

No spec uses `try/catch` to swallow a failing assertion — the only
`try/finally` blocks in this repo are for **cleanup** (deleting an
API-created user), never for hiding a failure.

## 10. Reporting

Three reporters run on every invocation:

- `list` — readable terminal output while iterating locally.
- `html` (`reports/html`) — the report developers/testers open with
  `npm run report` to inspect traces, screenshots, and videos per test.
- `junit` (`reports/junit/results.xml`) — machine-readable output CI tools
  (GitHub Actions, Jenkins, Azure DevOps) parse to show pass/fail counts
  and trends without opening a browser.

Both output folders are uploaded as CI artifacts (see the workflow file)
with a 14-day retention.

## 11. Parallel execution & isolation

- `fullyParallel: true` — every test file, and every test within a file,
  can run concurrently; nothing assumes execution order.
- `workers` is unset locally (Playwright picks based on CPU cores) and
  fixed at `4` in CI, where resources are constrained and predictable.
- Test isolation comes from Playwright itself (each test gets a fresh
  browser context) plus this framework's rule that **no test shares
  mutable data** with another — see Section 7's trade-off above.

## 12. Retry strategy

```typescript
retries: process.env.CI ? 2 : 0,
```

Retries exist to absorb genuine CI-environment transience (a slow cold
start, a momentary network blip) — not to paper over a flaky test. Locally,
retries are off on purpose: a flaky test should fail loudly the first time
a developer runs it, not quietly pass on attempt two.

## 13. Browser coverage

`chromium`, `firefox`, and `webkit` projects all run `tests/ui`. Smoke
tests are tagged `@smoke` and can be restricted to Chromium only in CI for
fast PR feedback (`npx playwright test --project=chromium --grep @smoke`),
while full regression runs the tagged `@regression` suite across all three
projects on a schedule or on merge to `main`.

## 14. Tagging convention

Tags are plain substrings in the test/describe title — Playwright's
`--grep` matches on title text, no extra plugin required:

| Tag | Meaning |
|---|---|
| `@smoke` | Small, fast, must-pass-on-every-PR set. |
| `@regression` | Broader functional coverage, run on merge/nightly. |
| `@e2e` | Cross-layer (API+UI+DB) scenarios. |
| `@api` | Pure API specs, no browser. |
| `@critical` | Business-critical paths, regardless of layer. |

```bash
npx playwright test --grep @smoke
npx playwright test --grep "@e2e|@critical"
```

## 15. CI/CD

`.github/workflows/playwright.yml`: checkout → setup Node with npm cache →
`npm ci` → install browsers with OS deps → lint → run tests (grep `@smoke`
on pull requests, `@regression` on `main`) → upload HTML + JUnit reports as
artifacts regardless of outcome (`if: always()`). Secrets are injected via
GitHub Actions repository secrets, matching the environment-variable
contract in `config/environment.ts`.

## 16. Flaky-test prevention checklist (all applied in this repo)

- No `page.waitForTimeout()` anywhere — only web-first `expect(...)` and
  Playwright's built-in auto-waiting (`waitForResponse` is used once, for a
  real network signal, not a fixed delay).
- No locator indexes by DOM position.
- No test depends on another test's side effects or run order.
- Every API-created record is deleted in a `finally` block.
- The one static fixture account is scoped to a single, clearly-labeled
  scenario instead of being reused/mutated across the suite.

## 17. Network handling & mocking

`tests/ui/advanced-patterns.spec.ts` demonstrates `page.route()` (mocking
an empty-state response) and `page.waitForResponse()` (waiting on a real
network round-trip before asserting). **Mock** when the test's purpose is
the UI's own reaction to a response shape that's hard to produce for real
(empty states, error states). **Hit the real API** for anything validating
actual integration behavior — most of this suite intentionally does the
latter, using `apiClient` against the real backend.

## 18. File upload/download

Same spec file shows `setInputFiles()` against a placeholder fixture
(`test-data/sample-upload.txt` — swap for a real file matching what your
app accepts) and `page.waitForEvent('download')` with filename validation
via `utils/fileUtils.ts#assertFileNameMatches`.

## 20. BasePage design decision

`pages/BasePage.ts` only exposes things this specific application shares
across pages (`successToast`, `errorToast`, `waitUntilReady`,
`dismissToastIfPresent`). It does **not** wrap `click()`/`fill()`/etc. —
doing so would just reproduce Playwright's own API with an extra layer of
indirection and no behavioral difference, which is a maintenance cost with
no benefit.

---

## Architecture (for an interview-style walkthrough)

Primary execution path:

```text
Tests → Fixtures → Page Objects / Components → Playwright → Application
```

Supporting layers:

```text
                Test Data (test-data/, testDataUtils.ts)
                        |
Tests → Fixtures → Page Objects → Application
  |          |
  |        config/environment.ts
  |
  ├── ApiClient → REST API → Backend
  └── DbClient  → SQL      → Database
```

A spec never talks to `page.locator(...)` raw, never reads
`process.env` directly, and never opens a SQL connection itself — each of
those concerns is isolated in exactly one layer, which is what makes the
framework safe for many engineers to extend concurrently without stepping
on each other.

## Scaling from ~100 to 1,000+ tests

- **Page objects and components stay flat in growth cost.** Adding the
  201st test against `UsersPage` costs nothing in `pages/` unless the UI
  itself changes — the object is already there.
- **Fixtures are the extension point**, not the spec files. A new shared
  dependency (e.g., a `ReportsPage`) is added once to
  `fixtures/testFixtures.ts` and every future spec can request it.
- **Tags, not folders-per-team, control what runs where.** As suites grow,
  `--grep` selection (`@smoke`, `@regression`, `@critical`) keeps PR
  feedback fast without needing to reorganize `tests/`.
- **Sharding.** Playwright's `--shard=<i>/<n>` splits a large suite across
  CI runners; because every test here is parallel-safe and isolated (no
  shared mutable fixtures), sharding is safe to turn on without further
  changes.
- **Per-domain subfolders under `tests/ui`, `tests/api`, `tests/e2e`**
  (e.g. `tests/ui/users/`, `tests/ui/billing/`) keep ownership clear as
  more engineers contribute, without changing the fixture or config layer.
- **The DB/API layers absorb most of the growth.** As coverage deepens,
  most new specs reuse existing `ApiClient`/`DbClient` methods rather than
  growing the page-object surface, which is what keeps a 1,000+ test suite
  maintainable instead of becoming 1,000 bespoke scripts.

---

## SauceDemo module (runnable demo against a public app)

The rest of this framework targets a private application configured through
`.env`. The SauceDemo module runs the same patterns against the public practice
store at <https://www.saucedemo.com>, so it works **with no setup or secrets**.

```bash
npm run test:saucedemo                # Chromium, all SauceDemo specs
npm run test:saucedemo:smoke          # @smoke only
npm run test:saucedemo:cross-browser  # Chromium + Firefox
npm run report                        # HTML report (each test has an execution-log attachment)
```

| Layer | Files |
|---|---|
| Config | `config/saucedemo.config.ts` (env-overridable defaults), `config/global-setup.ts` (resets logs per run) |
| Auth | `auth/saucedemo.setup.ts` → `auth/saucedemo.storageState.json` (git-ignored) |
| Page objects | `pages/saucedemo/` — `SauceBasePage`, `SauceLoginPage`, `InventoryPage`, `CartPage`, `CheckoutPages` |
| Components | `components/saucedemo/SauceHeaderComponent.ts` (cart + burger menu) |
| Fixtures | `fixtures/sauceFixtures.ts` — page objects + auto `logger` fixture |
| Test data | `test-data/saucedemo/products.json` (catalog), `utils/sauceDataUtils.ts` (faker customers, price parsing) |
| Specs | `tests/saucedemo/` — login, inventory, cart, checkout |

Locators prefer user-facing roles/placeholders; data elements use
`getByTestId()`, which the SauceDemo projects map to SauceDemo's `data-test`
attribute via `testIdAttribute`.

### Logging

`utils/logger.ts` is a small, dependency-free structured logger
(`debug` / `info` / `warn` / `error`, scoped via `logger.child()`). It covers
the **whole framework** — SauceDemo and the original app's UI, API and e2e
suites alike.

- **Per test:** `fixtures/loggerFixture.ts` is the shared base of both
  `testFixtures.ts` and `sauceFixtures.ts`. Its auto `logger` fixture logs
  START/END with status and duration, and the full log is attached to the test
  in the HTML report. It also wraps the built-in `page` fixture to capture
  browser console errors, uncaught page errors and failed or 4xx/5xx requests —
  so API-only tests are logged without launching a browser.
- **Per action:** `loggedStep()` in `utils/step.ts` wraps each page and
  component action in `test.step` (named, timed nodes in the report/trace) and
  logs it with duration and, on failure, the error. `BasePage.step()` and
  `SauceBasePage.step()` both delegate to it.
- **API and DB:** `ApiClient` logs `METHOD path → status (ms)` and network
  failures; `DbClient` logs connections and each query's row count.
- **Never logged:** passwords, tokens, request/response bodies, DB credentials
  and query parameter values.
- **Per run:** every worker appends to `reports/logs/execution.log`; each line
  carries a timestamp, level, worker index and `test › PageObject` scope.

| Variable | Default | Controls |
|---|---|---|
| `LOG_LEVEL` | `debug` | What reaches the log file and report attachment |
| `LOG_CONSOLE_LEVEL` | `warn` | What is echoed to the terminal |

```text
2026-10-29T11:31:00.499Z [INFO ] [w13] [SauceDemo login › login fails with unknown user @regression > SauceLoginPage] → Log in as "no_such_user" (password provided)
```
