# playwright-toolshop-e2e

[![Playwright](https://github.com/ellaine22/playwright-toolshop-e2e/actions/workflows/playwright.yml/badge.svg)](https://github.com/ellaine22/playwright-toolshop-e2e/actions/workflows/playwright.yml)

End-to-end and API tests for the [Practice Software Testing Toolshop](https://practicesoftwaretesting.com), a demo e-commerce app for hand tools. Written in TypeScript with Playwright Test.

## What's covered

**UI** (Chromium and Firefox)

| Spec | Scenarios |
| --- | --- |
| `auth.spec.ts` | login, wrong password, client-side validation (asserts no request is sent), logout |
| `catalog.spec.ts` | search, empty results, price and name sorting, category filter cross-checked against the API, pagination, behavior when the API fails or returns modified data |
| `cart.spec.ts` | add from product page, line totals vs. cart total, removing items |
| `checkout.spec.ts` | the full four-step checkout as a signed-in customer, address validation |

**API**

| Spec | Scenarios |
| --- | --- |
| `products.spec.ts` | pagination math, response shape, sorting, search, 404s |
| `auth.spec.ts` | JWT issue and expiry, `/users/me`, missing and tampered tokens |
| `cart.spec.ts` | create, add, merge quantities, remove, 404 |

## Layout

```
src/
  api/          typed client for the REST API (ToolshopApi)
  data/         env config, test users, addresses
  fixtures/     custom `test` that injects page objects and the API client
  pages/        page objects
tests/
  setup/        auth setup project (saves a logged-in storage state)
  ui/
  api/
```

## How it works

**Auth happens once, through the API.** The `setup` project calls `POST /users/login`, writes the JWT into localStorage, and saves the storage state to `.auth/customer.json`. Specs that need a signed-in user opt in with `test.use({ storageState: AUTH_FILE })`. The login form is only exercised in `auth.spec.ts`.

**Fixtures instead of `new Page(page)` everywhere.** `src/fixtures/test.ts` extends Playwright's `test` so specs ask for what they need (`async ({ productList, api }) => ...`) and get page objects that are set up per test.

**API for setup, UI for behavior.** UI tests look up product ids through the API client and navigate straight to them, rather than searching through the catalog in every test. Wherever the UI depends on backend data, like the category filter, the test checks the UI against what the API returns instead of hard-coding product names.

**Waiting on network, not timeouts.** Sorting and filtering re-fetch the product list, so the page object waits for that response before reading the DOM. There isn't a single `waitForTimeout` in the suite.

**One stubbed call.** The demo backend validates billing addresses against an external geocoding service that is often unavailable, and when it's down, `POST /invoices` returns 422 for every address. The checkout test runs every step live against the real site. It intercepts only that final call, asserts the request payload the storefront sends, and returns a canned invoice. The test then checks the storefront's flow, not the third party's uptime.

**Selectors.** `testIdAttribute` is set to `data-test`, which the app uses throughout, so locators are `getByTestId('search-query')` rather than CSS chains. Role-based locators are used where an accessible name exists (the category checkboxes).

## Running

Requires Node 20+.

```bash
npm install
npx playwright install

npm test                 # everything
npm run test:api         # API only, no browser
npm run test:ui          # Chromium + Firefox
npm run test:smoke       # tests tagged @smoke
npm run test:headed      # watch it run in Chromium
npm run report           # open the last HTML report
```

To target another deployment, set environment variables:

```bash
BASE_URL=http://localhost:4200 API_URL=http://localhost:8091 \
CUSTOMER_EMAIL=me@example.com CUSTOMER_PASSWORD=secret npm test
```

## CI

`.github/workflows/playwright.yml` runs typecheck and lint first. Then API tests run in one job, and the UI tests are sharded across Chromium and Firefox (2 shards each). It also runs nightly to catch changes to the demo site. HTML reports are uploaded for every run. Traces are recorded on the first retry, so failures in CI can be opened in the trace viewer.
