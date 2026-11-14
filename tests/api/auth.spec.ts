import { expect, test } from '@playwright/test';
import { ToolshopApi } from '../../src/api/ToolshopApi';
import { customer } from '../../src/data/users';

test.describe('Auth API', () => {
  test('issues a JWT for valid credentials', { tag: '@smoke' }, async ({ request }) => {
    const token = await new ToolshopApi(request).login(customer);

    const [, payload] = token.split('.');
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    expect(claims.exp).toBeGreaterThan(Date.now() / 1000);
  });

  test('rejects a wrong password with 401', async ({ request }) => {
    const res = await request.post('/users/login', {
      data: { email: customer.email, password: 'wrong-password' },
    });

    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  test('returns the current user for a valid token', async ({ request }) => {
    const token = await new ToolshopApi(request).login(customer);

    const res = await request.get('/users/me', { headers: { Authorization: `Bearer ${token}` } });

    await expect(res).toBeOK();
    expect(await res.json()).toMatchObject({ email: customer.email, first_name: 'Jane', last_name: 'Doe' });
  });

  test('protects /users/me without a token', async ({ request }) => {
    const res = await request.get('/users/me');
    expect(res.status()).toBe(401);
  });

  test('rejects a tampered token', async ({ request }) => {
    const token = await new ToolshopApi(request).login(customer);
    const tampered = token.slice(0, -4) + 'abcd';

    const res = await request.get('/users/me', { headers: { Authorization: `Bearer ${tampered}` } });
    expect(res.status()).toBe(401);
  });
});
