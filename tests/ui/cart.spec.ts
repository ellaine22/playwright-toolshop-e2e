import { expect, test } from '../../src/fixtures/test';

test.describe('Cart', () => {
  test('adds a product from the detail page', { tag: '@smoke' }, async ({ productList, productPage, header }) => {
    await productList.goto();
    await productList.openProduct('Combination Pliers');

    await expect(productPage.name).toHaveText('Combination Pliers');
    await productPage.add();

    await expect(productPage.addedToast).toBeVisible();
    await expect(header.cartQuantity).toHaveText('1');
  });

  test('line totals and cart total add up', { tag: '@deep-link' }, async ({ api, productPage, header, checkout }) => {
    const pliers = await api.findProductByName('Combination Pliers');
    const hammer = await api.findProductByName('Claw Hammer');

    await productPage.goto(pliers.id);
    await productPage.add(3);
    await expect(header.cartQuantity).toHaveText('3');

    await productPage.goto(hammer.id);
    await productPage.add();
    await expect(header.cartQuantity).toHaveText('4');

    await header.cart.click();
    await expect(checkout.lineItems).toHaveCount(2);

    const lines = await checkout.linePrices();
    expect(lines).toEqual(expect.arrayContaining([pliers.price * 3, hammer.price].map((n) => +n.toFixed(2))));
    expect(await checkout.total()).toBeCloseTo(lines.reduce((a, b) => a + b, 0), 2);
  });

  test('removing the last item empties the cart', { tag: '@deep-link' }, async ({ page, api, productPage, header, checkout }) => {
    const product = await api.findProductByName('Combination Pliers');
    await productPage.goto(product.id);
    await productPage.add();
    await expect(header.cartQuantity).toHaveText('1');

    await checkout.goto();
    await checkout.lineItems.first().locator('.btn-danger').click();

    await expect(page.getByText('The cart is empty. Nothing to display.')).toBeVisible();
  });
});
