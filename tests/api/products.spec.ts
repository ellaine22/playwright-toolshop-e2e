import { expect, test } from '@playwright/test';
import { ToolshopApi } from '../../src/api/ToolshopApi';

test.describe('Products API', () => {
  let api: ToolshopApi;

  test.beforeEach(({ request }) => {
    api = new ToolshopApi(request);
  });

  test('returns a paginated product list', { tag: '@smoke' }, async () => {
    const page = await api.getProducts({ page: 1 });

    expect(page.current_page).toBe(1);
    expect(page.data).toHaveLength(page.per_page);
    expect(page.last_page).toBe(Math.ceil(page.total / page.per_page));
  });

  test('every product has the fields the storefront depends on', async () => {
    const { data } = await api.getProducts();

    for (const product of data) {
      expect(product).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        price: expect.any(Number),
        in_stock: expect.any(Boolean),
        category: { id: expect.any(String), name: expect.any(String) },
        brand: { id: expect.any(String), name: expect.any(String) },
      });
      expect(product.price).toBeGreaterThan(0);
    }
  });

  test('pages do not overlap', async () => {
    const [first, second] = await Promise.all([api.getProducts({ page: 1 }), api.getProducts({ page: 2 })]);
    const firstIds = new Set(first.data.map((p) => p.id));

    expect(second.data.some((p) => firstIds.has(p.id))).toBe(false);
  });

  for (const [sort, compare] of [
    ['price,asc', (a: number, b: number) => a - b],
    ['price,desc', (a: number, b: number) => b - a],
  ] as const) {
    test(`sorts by ${sort}`, async () => {
      const { data } = await api.getProducts({ sort });
      const prices = data.map((p) => p.price);
      expect(prices).toEqual([...prices].sort(compare));
    });
  }

  test('search matches on product name', async () => {
    const { data } = await api.searchProducts('hammer');

    expect(data.length).toBeGreaterThan(0);
    data.forEach((p) => expect(p.name.toLowerCase()).toContain('hammer'));
  });

  test('fetches a single product by id', async ({ request }) => {
    const { data } = await api.getProducts();
    const res = await request.get(`/products/${data[0].id}`);

    await expect(res).toBeOK();
    expect(await res.json()).toMatchObject({ id: data[0].id, name: data[0].name });
  });

  test('returns 404 for an unknown product', async ({ request }) => {
    const res = await request.get('/products/00000000000000000000000000');
    expect(res.status()).toBe(404);
  });
});
