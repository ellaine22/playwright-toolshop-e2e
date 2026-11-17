import { expect, test } from '../../src/fixtures/test';
import { AUTH_FILE, customer } from '../../src/data/users';

test.describe('Login form', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('signs in a customer and opens My Account', { tag: ['@smoke', '@deep-link'] }, async ({ page, loginPage, header }) => {
    await loginPage.login(customer);

    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByTestId('page-title')).toHaveText('My account');
    await expect(header.userMenu).toContainText('Jane Doe');
  });

  test('shows an error for a wrong password', async ({ page, loginPage }) => {
    await loginPage.login({ email: customer.email, password: 'not-the-password' });

    await expect(loginPage.error).toHaveText('Invalid email or password');
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test('validates email format before submitting', async ({ page, loginPage }) => {
    const loginRequest = page.waitForRequest('**/users/login', { timeout: 2_000 }).catch(() => null);

    await loginPage.email.fill('not-an-email');
    await loginPage.password.fill('whatever1');
    await loginPage.submit.click();

    await expect(page.getByTestId('email-error')).toContainText('Email format is invalid');
    expect(await loginRequest, 'form should not hit the API with invalid input').toBeNull();
  });
});

test.describe('Signed in', () => {
  test.use({ storageState: AUTH_FILE });

  test('signs out and returns to the login page', { tag: '@deep-link' }, async ({ page, header }) => {
    await page.goto('/account');
    await header.logout();

    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(header.signIn).toBeVisible();
  });
});
