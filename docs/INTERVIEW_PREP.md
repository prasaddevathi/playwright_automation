# Interview Preparation: Playwright + TypeScript Framework

Use this file to explain **this project** in an interview. Every answer points to real code you can open and show. Answers are written to be said out loud: short, concrete, and ending with *why*.

Pitched at mid-level (about 2–5 years of experience). Questions marked **[Senior]** go deeper.

**How to use it**

1. Learn the 2-minute pitch in section 1 until you can say it without notes.
2. Practise drawing the architecture in section 2 from memory.
3. Read sections 3–8 and answer each question aloud *before* reading the answer.
4. Do at least two exercises from section 9. Having code you wrote yourself is the best proof.
5. Review the quick-fire list in section 10 the day before.

**Contents**

1. [Your 2-minute pitch](#1-your-2-minute-pitch)
2. [Whiteboard the architecture](#2-whiteboard-the-architecture)
3. [Design decisions in this framework](#3-design-decisions-in-this-framework)
4. [Playwright core concepts](#4-playwright-core-concepts)
5. [TypeScript in the framework](#5-typescript-in-the-framework)
6. [Logging and reporting](#6-logging-and-reporting)
7. [CI/CD](#7-cicd)
8. [Real problems you solved (STAR stories)](#8-real-problems-you-solved-star-stories)
9. [Scenario questions](#9-scenario-questions)
10. [Hands-on exercises](#10-hands-on-exercises)
11. [Quick-fire answers](#11-quick-fire-answers)
12. [Day-before checklist](#12-day-before-checklist)

---

## 1. Your 2-minute pitch

> "I built a UI test automation framework in Playwright and TypeScript. It tests SauceDemo, a public e-commerce demo app: login, product listing and sorting, the cart, and the full checkout.
>
> It uses the Page Object Model. Each screen is a class that owns its locators and actions, and a shared header is modelled as a component. Tests never create page objects themselves; Playwright fixtures inject them, so a test just declares what it needs.
>
> Login happens once per run in a setup project. The session is saved as storageState, so every test starts already signed in, but in its own isolated browser context. That keeps tests fast and independent, and they all run in parallel.
>
> I added a structured logger. Every page action is wrapped in a step that logs its duration and any error, and an automatic fixture captures browser console errors and failed network requests. Each test's log is attached to its entry in the HTML report.
>
> Test data is kept out of the specs: the expected catalog is a JSON file, and customer details come from faker. Tests are tagged smoke and regression, and negative cases are data-driven.
>
> It runs in GitHub Actions on every push and pull request: type check, then the suite in Chromium, and the HTML report and logs are uploaded as artifacts. There are 20 tests, and the CI job takes under a minute."

**Numbers to remember:** 20 tests · 4 spec files · 7 page/component classes · 8 fixtures · ~40 s locally · ~55 s in CI · 2 retries in CI, 0 locally.

---

## 2. Whiteboard the architecture

Be ready to draw this in under a minute:

```text
   Test data ───────▶  Specs (tests/saucedemo/*.spec.ts)
 (products.json,              │  ask for fixtures by name
  faker)                      ▼
                        Fixtures (sauceFixtures.ts) ──────────▶ Logger (auto fixture)
                              │  build page objects                 ▲        │
                              ▼                                     │        ▼
                   Page objects + components ─── step() logs ───────┘   execution.log
                   (SauceBasePage, InventoryPage, ...)                  report attachment
                              │  drive                                  console (warn+)
                              ▼
   Config + auth ───▶  Playwright BrowserContext (isolated, pre-signed-in)
 (saucedemo.config,           │
  storageState)               ▼
                        SauceDemo app
```

**Talking points while you draw:**

- Dependencies point **one way, downward**. A spec never touches `page.locator` directly, and a page object never asserts.
- The logger is **cross-cutting**: it plugs in at the fixture and page-object layers, so specs need no logging code.
- Config is the only place a URL or credential lives.

Files to have open: [sauceFixtures.ts](../fixtures/sauceFixtures.ts), [SauceBasePage.ts](../pages/saucedemo/SauceBasePage.ts), [checkout.spec.ts](../tests/saucedemo/checkout.spec.ts).

---

## 3. Design decisions in this framework

**Q: Why the Page Object Model?**
It separates *what* a test checks from *how* the UI is driven. When a locator changes, I fix it in one page class, not in every test. Tests read like user journeys, for example `inventoryPage.addToCart(...)`, then `header.openCart()`, then `cartPage.checkout()`.

**Q: Do your page objects contain assertions? Why not?**
No. Page objects expose locators and actions; tests assert. If a page object asserted, one method would mix "do" and "check", hide what a test verifies, and make the method unusable for negative tests. The one exception is a *query* such as `getTotals()`, which returns data for the test to assert on.

**Q: Why a component for the header?**
The header (cart icon, burger menu) appears on every signed-in page, but it isn't a page: it has no URL. Modelling it once in [SauceHeaderComponent.ts](../components/saucedemo/SauceHeaderComponent.ts) avoids copying its locators into four page classes.

**Q: Why inject page objects with fixtures instead of `new InventoryPage(page)` in each test?**
- There's no boilerplate; a test just lists what it needs.
- When the constructor gained a `logger` parameter, I changed one file instead of 20 tests.
- Fixtures are lazy: an object is built only if the test asks for it.
- Each test gets fresh instances bound to its own page, which is safe for parallel runs.
- Teardown code after `await use()` runs even when the test fails.

**Q: Your BasePage doesn't wrap `click()` or `fill()`. Why?**
Wrapping Playwright's API just re-implements it and hides its auto-waiting semantics. The base class holds only what is genuinely shared: the logger, the page title, `goto()`, and `step()`.

**Q: How do you handle login? [Senior]**
A `saucedemo-setup` project logs in once through the UI and saves cookies and local storage to a `storageState` file. Test projects declare `dependencies: ['saucedemo-setup']` and load that file. Every test gets a **new, isolated context that is already authenticated**: fast like a shared session, but isolated like a fresh one. Login tests opt out with an empty storageState, because they must start signed out. The file is git-ignored because it holds a live session.

**Q: What's your locator strategy?**
In priority order:
1. `getByRole` with an accessible name, for example `getByRole('button', { name: 'Login' })`.
2. `getByPlaceholder` or `getByLabel` for form fields.
3. `getByTestId` for data elements such as prices and names.

No CSS or XPath. Role locators match what the user sees, survive layout changes, and also check basic accessibility. SauceDemo uses `data-test` attributes, so I set `testIdAttribute: 'data-test'` in the project config instead of writing attribute selectors.

**Q: How do you keep tests independent?**
Each test gets its own browser context, starts from the saved session with an empty cart, and sets up its own data in `beforeEach` or Arrange. No test reads another's state. `fullyParallel: true` enforces this: an order-dependent test fails quickly.

**Q: How do you manage test data?**
Static expected data, the six-product catalog, is in [products.json](../test-data/saucedemo/products.json). Dynamic data, customer names and postcodes, comes from faker in [sauceDataUtils.ts](../utils/sauceDataUtils.ts). `buildCustomerInfo({ postalCode: '' })` uses overrides, so a negative case is one line. `getProduct(name)` throws on a typo instead of returning `undefined`.

**Q: What are data-driven tests here?**
A loop over a table of cases generates one named test per row. The four invalid-login cases, four sort orders, and three missing-field checkout cases work this way. A new case is one new row, and each row shows separately in the report.

**Q: How do you tag tests?**
Tags go in the title: `@smoke` (5 critical-path tests), `@regression` (all), `@e2e` (the full purchase). I run them with `--grep @smoke`. Smoke gives fast feedback; regression is the full gate.

---

## 4. Playwright core concepts

**Q: Explain Browser, BrowserContext and Page.**
A **Browser** is one launched browser process. A **BrowserContext** is an isolated session inside it, like an incognito profile with its own cookies and storage. A **Page** is a tab inside a context. Playwright gives each test a fresh context, which is why tests are isolated yet cheap: there's no browser restart per test.

**Q: What is auto-waiting?**
Before an action, Playwright checks that the element is attached, visible, stable (not animating), able to receive events, and enabled, and editable for `fill`. It retries until those hold or the action times out. That's why this suite has no manual waits.

**Q: What are web-first assertions?**
Assertions like `expect(locator).toHaveText()` retry until they pass or the expect timeout runs out (10 s here). Compare `expect(await locator.textContent()).toBe(...)`, which checks once and is flaky. ESLint's Playwright plugin is configured to forbid `waitForTimeout`.

**Q: Locator vs ElementHandle?**
A **Locator** is a lazy description that is re-resolved every time it's used, so it survives re-renders. An **ElementHandle** points at one specific DOM node and goes stale. Locators are the recommended API. They are also **strict**: an action fails if the locator matches more than one element, which catches ambiguous selectors early.

**Q: What are fixtures, and what scopes exist? [Senior]**
Fixtures are dependency-injected setup and teardown. **Test-scoped** fixtures (the default) are created per test; `page` and all page objects here are test-scoped. **Worker-scoped** fixtures are created once per worker process, which suits expensive shared resources such as a database connection. An **auto** fixture runs for every test without being requested; my `logger` is one.

**Q: What does `test.step` do, and what is `box: true`?**
`test.step` groups actions into a named, timed node in the report and trace. `box: true` makes an error inside the step point at the line that *called* the step, the test line, instead of the inside of the page object. That's why my failures point to the useful line.

**Q: What are projects and dependencies?**
A project is a named set of tests plus settings such as browser, baseURL and storageState. Here, `saucedemo-chromium` and `saucedemo-firefox` run the same specs in different browsers. `dependencies` makes a project wait for another; that's how the login setup runs first.

**Q: How do retries, traces, screenshots and videos work in your config?**
- `retries`: 2 in CI, 0 locally. A test that passes on retry is marked **flaky** in the report, not hidden.
- `trace: 'on-first-retry'`: records a full trace only when a retry happens.
- `screenshot: 'only-on-failure'` and `video: 'retain-on-failure'`: evidence only when needed.

This keeps passing runs fast and failing runs debuggable.

**Q: How do you run tests in parallel? How would you force serial?**
`fullyParallel: true` runs tests in parallel across workers (4 in CI). For a group that must share state, use `test.describe.configure({ mode: 'serial' })`, as a last resort. To spread tests across machines, use `--shard=1/4`.

**Q: How would you mock or wait for network calls?**
Use `page.route('**/api/products', route => route.fulfill({ json: [...] }))` to stub a response. Use `page.waitForResponse(url)` to wait for a real call. My logger listens to `response` and `requestfailed` to record network problems.

**Q: How do you handle a new tab, an iframe, a dialog, a file upload and a download?**
- **New tab:** `const [newPage] = await Promise.all([context.waitForEvent('page'), link.click()])`
- **iframe:** `page.frameLocator('#frame').getByRole(...)`
- **Dialog:** `page.on('dialog', d => d.accept())`, registered *before* the action that opens it
- **Upload:** `locator.setInputFiles('path')`
- **Download:** `const download = await page.waitForEvent('download')`, then `download.saveAs(...)`

**Q: Soft assertions?**
`expect.soft(...)` records a failure but lets the test continue, which is useful for checking many fields on one page. The test is still marked failed at the end.

**Q: How do you test APIs in Playwright?**
With the `request` fixture or `APIRequestContext`. The original framework in this repo has API specs in `tests/api/` and e2e specs that set up data through the API, then verify it in the UI.

---

## 5. TypeScript in the framework

**Q: Where do you use TypeScript's type system to prevent bugs?**
- `SortOption = 'az' | 'za' | 'lohi' | 'hilo'`: an invalid sort value is a **compile error**, not a runtime failure.
- `Partial<CustomerInfo>` in `fillCustomerInfo()`: any subset of fields can be passed, which enables the missing-field tests.
- `readonly` locators: tests can use them but cannot reassign them.
- An `abstract` base class with `protected abstract readonly path`: every page **must** declare its URL.
- `import type`: imports only types, so nothing extra is loaded at runtime.

**Q: Why are the config values getters instead of constants? [Senior]**
`playwright.config.ts` imports the config module, and ES imports are hoisted, so they run *before* the `dotenv.config()` line. A plain constant would read `process.env` before `.env` had loaded and silently ignore overrides. A getter reads the value when it's used. See [saucedemo.config.ts](../config/saucedemo.config.ts).

**Q: How do you catch type errors before CI?**
`npm run typecheck` (`tsc --noEmit`). CI runs it before any browser starts, so a type error fails fast and cheaply.

---

## 6. Logging and reporting

**Q: Playwright already has reports. Why add a logger?**
The report shows steps and errors. The logger adds:
- **Browser-side evidence**: console errors, uncaught page exceptions, failed or 4xx/5xx requests. These are often the real cause of a UI failure.
- **One chronological view** of the whole run across parallel workers.
- **Business context**, such as "Placing order" with the expected subtotal.
- **Plain text** that can be searched, archived by CI, or sent to a log platform.

**Q: Walk me through how the logger works.**
[logger.ts](../utils/logger.ts) has four levels (`debug`, `info`, `warn`, `error`) and `child(scope)`. An auto fixture in [loggerFixture.ts](../fixtures/loggerFixture.ts), the shared base of both fixture files, creates one logger per test. Each page object gets `logger.child('InventoryPage')`, which writes into the same buffer under its own name. Each line goes to an in-memory buffer (attached to the test's report entry at the end), to `reports/logs/execution.log`, and to the console if it meets `LOG_CONSOLE_LEVEL`. Every page and component action goes through one helper, `loggedStep()` in [step.ts](../utils/step.ts), and the API and database clients log each call.

**Q: Why do the browser listeners wrap the `page` fixture instead of living in the logger fixture? [Senior]**
An auto fixture runs for every test. If it depended on `page`, every test, including pure API tests, would launch a browser just to be logged. Wrapping Playwright's built-in `page` fixture attaches the listeners only when a test actually uses a browser. API tests stay fast but are still fully logged.

**Q: How did you avoid duplicating the logging code across two apps?**
One shared base fixture and one shared `loggedStep()` helper. Both `BasePage` and `SauceBasePage` delegate their `step()` to it, and both fixture files extend `loggerFixture.ts`. A new fixture file gets logging by extending that base instead of `@playwright/test`.

**Q: Why is the console level separate from the file level?**
With 4 parallel workers, step-level console lines interleave and bury the reporter's output. The file keeps full detail; the console shows only warnings and errors by default.

**Q: Why not use winston or pino?**
For a test framework the needs were small, and a dependency-free logger adds no install weight or supply-chain risk. The API matches theirs (levels plus `child`), so swapping one in later is a one-file change. *(Good answer: shows you weighed it, not that you didn't know.)*

**Q: How do you make sure secrets aren't logged?**
`SauceLoginPage.login()` logs the username and only *whether* a password was provided. Real `.env` files and the storageState file are git-ignored.

**Q: What reports do you produce?**
HTML (for people), JUnit XML (for CI dashboards), and the execution log. CI uploads the HTML report and the logs as an artifact, kept for 14 days.

---

## 7. CI/CD

**Q: Describe your pipeline.**
GitHub Actions, on every push and pull request to `main`, plus a manual trigger. The steps are: checkout, set up Node 20 with npm caching, `npm ci`, install Chromium with its system libraries, type check, run the suite, then upload the report and logs with `if: always()` so they're kept even on failure. See [playwright.yml](../.github/workflows/playwright.yml).

**Q: Why `npm ci` and not `npm install`?**
`npm ci` installs exactly what's in `package-lock.json` and fails if the lockfile and `package.json` disagree. CI gets reproducible versions.

**Q: What changes when `CI=true`?**
Retries go to 2, workers to 4, and `forbidOnly` turns on, so a stray `test.only` fails the build instead of silently skipping everything else.

**Q: Why only Chromium in CI?**
It was a deliberate trade-off: Chromium gives fast, stable feedback on every push. Firefox is available on demand with `npm run test:saucedemo:cross-browser`. In a real product, I'd add a nightly cross-browser run rather than slow down every PR.

**Q: How would you keep secrets out of the repo? [Senior]**
GitHub repository secrets, exposed to the job as environment variables (the original framework's job uses `QA_BASE_URL` and others this way). Locally, `.env` files are git-ignored, and only `.env.example` templates are committed.

**Q: How would you scale to 1,000+ tests? [Senior]**
- **Shard** across CI machines (`--shard=i/N`) and merge the blob reports.
- **Tag-based pipelines**: smoke on every PR, full regression nightly or before release.
- **Set up data through the API**, not the UI, to cut minutes per test.
- **Keep isolation strict**, with unique data per test, so parallelism stays safe.
- **Track flaky tests** from retry data and quarantine them, instead of letting retries hide them.

---

## 8. Real problems you solved (STAR stories)

Interviewers remember stories. Tell each one as Situation, Task, Action, Result in about 60 seconds.

**Story 1: Firefox timeouts**
- **Situation:** In the cross-browser run, about 10 Firefox tests timed out. Chromium passed everything.
- **Task:** Find out whether it was the tests or the environment.
- **Action:** I read the execution log. `page.goto` waited for the full `load` event, and the image-heavy inventory page stalled it. I switched navigation to `waitUntil: 'domcontentloaded'`, which is safe because web-first assertions wait for what each test needs. That fixed most failures. The remaining three each spent 10–76 seconds on a single click, and Firefox logged a `GraphicsCriticalError` from its software renderer. Rerunning with 2 workers showed the failures were consistent.
- **Result:** I identified a machine-specific graphics problem, not a test bug. I kept Chromium as the CI gate and made Firefox opt-in, and documented why.

**Story 2: Preventing a flaky sort test**
- **Situation:** Two products cost exactly $15.99.
- **Action:** Comparing the whole sorted list of `{name, price}` objects would fail at random, because the app can show tied items in either order. I compared only the sort key: names for name sorts, prices for price sorts.
- **Result:** The test is deterministic and still checks the order correctly. *(Shows you think about flakiness before it happens.)*

**Story 3: Environment overrides silently ignored**
- **Situation:** The config module was imported into `playwright.config.ts`, which loads `.env` with dotenv.
- **Action:** I noticed that ES imports are hoisted above `dotenv.config()`, so constants would read the environment too early. I made the config values getters.
- **Result:** `.env` overrides work as documented. *(Shows understanding of JavaScript module loading.)*

**Story 4: A broken type check**
- **Situation:** `npm run typecheck` failed on an existing spec.
- **Action:** It called `toBeunchecked()`, which is not a real matcher. From the test's intent, the correct assertion was `toBeVisible()`.
- **Result:** The type check passed, and CI now runs it before the tests, so this class of error can't reach the test stage again.

**Story 5: Debugging with logs instead of reruns**
- **Situation:** A test failed in a `beforeEach` hook.
- **Action:** The `execution-log` attachment showed the last action that started (`→ Add "Sauce Labs Backpack" to cart`), with no completion line and a timeout 30 s later.
- **Result:** I knew the exact failing step without rerunning anything. That's the value of step-level logging.

---

## 9. Scenario questions

**Q: A test passes locally but fails in CI. What do you do?**
1. Download the CI report and compare the test's `execution-log` with a local run.
2. Check the CI differences: `CI=true` (4 workers, retries), headless Linux, different fonts and screen size, slower network.
3. Reproduce locally with `CI=true` and `--workers=4`.
4. Open the trace from the retry to see the DOM, network and console at the failure.
5. The usual causes are timing assumptions, shared state between parallel tests, or data collisions.

**Q: A test is flaky. How do you fix it, not hide it?**
Find the root cause from the trace and logs. Typical fixes:
- Replace fixed waits with web-first assertions.
- Remove dependence on test order or shared data.
- Use unique data per test.
- Wait for a specific network response instead of a fixed delay.
- Don't assert on non-deterministic order (as in Story 2).

Retries are a safety net, not a fix; the report marks flaky tests so they can be tracked.

**Q: The developers changed the login page HTML. What breaks, and where do you fix it?**
Only the locators in [SauceLoginPage.ts](../pages/saucedemo/SauceLoginPage.ts) need to change, and no specs. If they kept the labels and roles, role- and placeholder-based locators probably still work.

**Q: How would you test the same flow for a different user type, for example `problem_user`?**
Add a storageState per role (one setup test per user) and a project or a `test.use({ storageState })` per role. Alternatively, log in through the UI inside the test for one-off cases.

**Q: The app is slow in one environment. Do you raise timeouts?**
Only scoped and justified, such as one slow action, never globally. First, confirm the slowness with logs and traces, since it might be a real performance bug worth reporting.

**Q: How would you add visual testing?**
`await expect(page).toHaveScreenshot()` with baselines committed to the repo. Mask dynamic areas, and run it in a single fixed environment (the CI Docker image) to avoid font and rendering differences.

**Q: How would you check accessibility?**
Role-based locators already enforce accessible names. For full checks, add `@axe-core/playwright` and assert there are no serious violations on key pages.

---

## 10. Hands-on exercises

Do these in the repository. Each one is something an interviewer might ask you to do live.

1. **Product details page.** Create `ProductDetailsPage`, register a fixture, and write a test that opens a product from the inventory and checks its name and price against `products.json`. *(The full guide's "Extending the framework" section has a worked example.)*
2. **Reset app state.** Add `resetAppState()` to the header component (the `resetAppStateLink` locator already exists). Write a test: add 2 items, reset, and assert that the badge is hidden.
3. **problem_user.** Log in as `problem_user` and write a test that documents a known defect, for example that product images are wrong. Use `test.fail()` so it is reported as an expected failure.
4. **Network mock.** Use `page.route` to block all `*.jpg` requests and check that the inventory still shows 6 products. Bonus: measure the speed-up.
5. **Soft assertions.** On the checkout overview, check item names, subtotal, tax and total with `expect.soft`, so that one wrong value doesn't hide the others.
6. **Sharding.** Run `npx playwright test --project=saucedemo-chromium --shard=1/2` and `--shard=2/2`, and explain how you would merge the reports in CI.

---

## 11. Quick-fire answers

| Question | One-line answer |
| --- | --- |
| Default test timeout here? | 30 s per test; 10 s for each `expect` |
| How do you run one test? | `npx playwright test -g "title"` or `file.spec.ts:line` |
| How do you debug? | `--debug` (Inspector), `--ui` (UI mode), `--headed`, trace viewer |
| Open a trace? | `npx playwright show-trace trace.zip` |
| `test.only` in CI? | `forbidOnly` fails the run |
| Codegen? | `npx playwright codegen <url>` records actions into code |
| Skip a test conditionally? | `test.skip(browserName === 'firefox', 'reason')` |
| Expected failure? | `test.fail()` |
| Mark slow? | `test.slow()` triples the timeout |
| Run headed? | `--headed` |
| Hooks? | `beforeAll`, `beforeEach`, `afterEach`, `afterAll` (prefer fixtures for reusable setup) |
| What does `npm ci` guarantee? | Exact versions from the lockfile |
| Why `getByRole` first? | User-facing, resilient, and checks accessibility |
| Strict mode? | An action fails if a locator matches more than one element |
| storageState holds? | Cookies and local storage for each origin |

---

## 12. Day-before checklist

- [ ] Say the 2-minute pitch aloud twice.
- [ ] Draw the architecture from memory.
- [ ] Run `npm run test:saucedemo` and `npm run report`, and know where the `execution-log` attachment is.
- [ ] Open the latest GitHub Actions run, and be ready to share your screen and show it.
- [ ] Rehearse Stories 1 and 2 (Firefox, flaky sort) in under 60 seconds each.
- [ ] Complete at least two exercises from section 10, and commit them.
- [ ] Have these files open in tabs: `sauceFixtures.ts`, `SauceBasePage.ts`, `logger.ts`, `checkout.spec.ts`, `playwright.config.ts`.
- [ ] Prepare one honest answer to "What would you improve?" For example: a nightly cross-browser run, API-based test setup, sharding, and visual tests.
