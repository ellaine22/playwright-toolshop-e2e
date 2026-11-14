import { expect, test } from '../../src/fixtures/test';
import { PRODUCT_LIST_URL } from '../../src/pages/ProductListPage';

test.describe('Product catalog', () => {
  test.beforeEach(async ({ productList }) => {
    await productList.goto();
  });

  test('search returns only matching products', { tag: '@smoke' }, async ({ page, productList }) => {
    await productList.search('pliers');

    await expect(page.getByTestId('search-caption')).toContainText('pliers');
    const names = await productList.names();
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name.toLowerCase()).toContain('pliers');
    }
  });

  test('shows an empty state when nothing matches', async ({ page, productList }) => {
    await productList.search('xyz-no-such-tool');

    await expect(productList.productCards).toHaveCount(0);
    await expect(page.getByTestId('no-results')).toBeVisible();
  });

  test('sorts by price, low to high', async ({ productList }) => {
    await productList.sortBy('price,asc');
    const prices = await productList.prices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('sorts by price, high to low', async ({ productList }) => {
    await productList.sortBy('price,desc');
    const prices = await productList.prices();
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test('sorts by name, Z to A', async ({ productList }) => {
    await productList.sortBy('name,desc');
    const names = await productList.names();
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
  });

  test('category filter matches what the API returns for that category', async ({ productList, api }) => {
    const pliers = await api.searchProducts('pliers');
    const categoryId = pliers.data.find((p) => p.category.name === 'Pliers')!.category.id;
    const expected = await api.getProducts({ by_category: categoryId });

    await productList.filterByCategory('Pliers');

    expect((await productList.names()).sort()).toEqual(expected.data.map((p) => p.name).sort());
  });

  test('paginates to a different set of products', async ({ productList }) => {
    const firstPage = await productList.names();
    await productList.goToNextPage();
    const secondPage = await productList.names();

    expect(secondPage.length).toBeGreaterThan(0);
    expect(secondPage.filter((n) => firstPage.includes(n))).toEqual([]);
  });
});

test.describe('Product catalog with a mocked backend', () => {
  test('keeps the page usable when the product API fails', async ({ page, productList }) => {
    await page.route(PRODUCT_LIST_URL, (route) =>
      route.request().method() === 'OPTIONS'
        ? route.continue()
        : route.fulfill({ status: 500, json: { message: 'Server Error' } }),
    );
    await page.goto('/');

    await expect(productList.productCards).toHaveCount(0);
    await expect(page.getByTestId('search-query')).toBeVisible();
  });

  test('renders whatever the API returns', async ({ page, productList }) => {
    await page.route(PRODUCT_LIST_URL, async (route) => {
      if (route.request().method() === 'OPTIONS') return route.continue();
      const response = await route.fetch();
      const body = await response.json();
      body.data = body.data.slice(0, 1).map((p: { name: string }) => ({ ...p, name: 'Mocked Hammer 3000' }));
      await route.fulfill({ response, json: body });
    });
    await page.goto('/');

    await expect(productList.productCards).toHaveCount(1);
    await expect(productList.productNames).toHaveText('Mocked Hammer 3000');
  });
});
