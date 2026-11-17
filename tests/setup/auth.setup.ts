import { test as setup } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { ToolshopApi } from '../../src/api/ToolshopApi';
import { API_URL, BASE_URL } from '../../src/data/env';
import { AUTH_FILE, customer } from '../../src/data/users';

// The storefront keeps its JWT in localStorage, so instead of driving the login
// form we get a token from the API and write the storage state file ourselves.
// No browser is launched here, so the setup works whichever browser a CI job
// installed. The login form itself is covered in tests/ui/auth.spec.ts.
setup('authenticate customer', async ({ request }) => {
  const token = await new ToolshopApi(request, API_URL).login(customer);

  const storageState = {
    cookies: [],
    origins: [
      {
        origin: new URL(BASE_URL).origin,
        localStorage: [{ name: 'auth-token', value: token }],
      },
    ],
  };

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(storageState, null, 2));
});
