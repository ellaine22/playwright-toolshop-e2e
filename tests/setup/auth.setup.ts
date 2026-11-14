import { test as setup } from '@playwright/test';
import { ToolshopApi } from '../../src/api/ToolshopApi';
import { API_URL, BASE_URL } from '../../src/data/env';
import { AUTH_FILE, customer } from '../../src/data/users';

// The storefront keeps its JWT in localStorage, so instead of driving the login
// form we get a token from the API and write it straight into the storage state.
// The login form itself is covered in tests/ui/auth.spec.ts.
setup('authenticate customer', async ({ request, browser }) => {
  const token = await new ToolshopApi(request, API_URL).login(customer);

  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  await page.goto('/');
  await page.evaluate((t) => localStorage.setItem('auth-token', t), token);

  await context.storageState({ path: AUTH_FILE });
  await context.close();
});
