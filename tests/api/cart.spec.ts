import { expect, test } from '@playwright/test';
import { ToolshopApi } from '../../src/api/ToolshopApi';

test.describe('Cart API', () => {
  let api: ToolshopApi;
  let cartId: string;

  test.beforeEach(async ({ request }) => {
    api = new ToolshopApi(request);
    cartId = await api.createCart();
  });

  test('a new cart is empty', async () => {
    const cart = await api.getCart(cartId);
    expect(cart.id).toBe(cartId);
    expect(cart.cart_items).toEqual([]);
  });

  test('adds a product with a quantity', { tag: '@smoke' }, async () => {
    const product = await api.findProductByName('Claw Hammer');

    await api.addToCart(cartId, product.id, 2);

    const { cart_items } = await api.getCart(cartId);
    expect(cart_items).toHaveLength(1);
    expect(cart_items[0]).toMatchObject({ product_id: product.id, quantity: 2 });
  });

  test('adding the same product again increases its quantity', async () => {
    const product = await api.findProductByName('Claw Hammer');

    await api.addToCart(cartId, product.id, 1);
    await api.addToCart(cartId, product.id, 2);

    const { cart_items } = await api.getCart(cartId);
    expect(cart_items).toHaveLength(1);
    expect(cart_items[0].quantity).toBe(3);
  });

  test('removes a product from the cart', async ({ request }) => {
    const product = await api.findProductByName('Claw Hammer');
    await api.addToCart(cartId, product.id);

    const res = await request.delete(`/carts/${cartId}/product/${product.id}`);
    expect(res.status()).toBe(204);

    expect((await api.getCart(cartId)).cart_items).toEqual([]);
  });

  test('returns 404 for a cart that does not exist', async ({ request }) => {
    const res = await request.get('/carts/does-not-exist');
    expect(res.status()).toBe(404);
  });
});
