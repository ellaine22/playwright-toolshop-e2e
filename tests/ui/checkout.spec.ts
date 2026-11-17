import { expect, test } from '../../src/fixtures/test';
import { viennaAddress } from '../../src/data/address';
import { AUTH_FILE } from '../../src/data/users';

test.use({ storageState: AUTH_FILE });

test.describe('Checkout', { tag: '@deep-link' }, () => {
  test.beforeEach(async ({ api, productPage, header }) => {
    const product = await api.findProductByName('Combination Pliers');
    await productPage.goto(product.id);
    await productPage.add();
    await expect(header.cartQuantity).toHaveText('1');
  });

  test('places an order as a signed in customer', { tag: '@smoke' }, async ({ page, checkout }) => {
    // The demo backend validates billing addresses against an external geocoding
    // service that is regularly unavailable, which makes POST /invoices fail with
    // a 422 for any address. Everything up to that call runs against the real
    // site. The invoice call is stubbed so this test checks our flow, not their uptime.
    await page.route('**/invoices', (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({ status: 201, json: { id: 'stubbed', invoice_number: 'INV-2026000999' } })
        : route.continue(),
    );

    await checkout.goto();

    await test.step('review cart', async () => {
      await expect(checkout.lineItems).toHaveCount(1);
      await checkout.proceedFromCart.click();
    });

    await test.step('confirm signed in', async () => {
      await checkout.proceedFromSignIn.click();
    });

    await test.step('billing address', async () => {
      await checkout.fillAddress(viennaAddress);
      await expect(checkout.proceedFromAddress).toBeEnabled();
      await checkout.proceedFromAddress.click();
    });

    await test.step('payment', async () => {
      await checkout.pay('cash-on-delivery');
      await expect(checkout.paymentSuccess).toHaveText('Payment was successful');
    });

    await test.step('invoice', async () => {
      const invoiceRequest = await checkout.placeOrder();

      expect(invoiceRequest).toMatchObject({
        billing_street: viennaAddress.street,
        billing_city: viennaAddress.city,
        billing_postal_code: viennaAddress.postalCode,
        billing_country: 'AT',
        payment_method: 'cash-on-delivery',
        cart_id: expect.any(String),
      });
      await expect(checkout.orderConfirmation).toContainText('Your invoice number is INV-2026000999');
    });
  });

  test('cannot continue past billing with an incomplete address', async ({ page, checkout }) => {
    await checkout.goto();
    await checkout.proceedFromCart.click();
    await checkout.proceedFromSignIn.click();

    await checkout.fillAddress({ ...viennaAddress, postalCode: '' });
    await page.getByTestId('postal_code').clear();

    await expect(checkout.proceedFromAddress).toBeDisabled();
  });
});
