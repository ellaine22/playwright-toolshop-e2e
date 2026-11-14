import { Locator, Page } from '@playwright/test';
import type { Address } from '../data/address';

export type PaymentMethod = 'bank-transfer' | 'cash-on-delivery' | 'credit-card' | 'buy-now-pay-later' | 'gift-card';

const money = (text: string | null) => Number(text?.replace(/[^\d.]/g, ''));

/**
 * The checkout is a four-step wizard on a single route:
 * cart -> sign in -> billing address -> payment.
 */
export class CheckoutPage {
  readonly lineItems: Locator;
  readonly cartTotal: Locator;
  readonly proceedFromCart: Locator;
  readonly proceedFromSignIn: Locator;
  readonly proceedFromAddress: Locator;
  readonly paymentMethod: Locator;
  readonly confirm: Locator;
  readonly paymentSuccess: Locator;
  readonly orderConfirmation: Locator;

  constructor(private readonly page: Page) {
    this.lineItems = page.locator('tbody tr');
    this.cartTotal = page.getByTestId('cart-total');
    this.proceedFromCart = page.getByTestId('proceed-1');
    this.proceedFromSignIn = page.getByTestId('proceed-2');
    this.proceedFromAddress = page.getByTestId('proceed-3');
    this.paymentMethod = page.getByTestId('payment-method');
    this.confirm = page.getByTestId('finish');
    this.paymentSuccess = page.getByTestId('payment-success-message');
    this.orderConfirmation = page.locator('#order-confirmation');
  }

  async goto() {
    await this.page.goto('/checkout');
  }

  async total(): Promise<number> {
    return money(await this.cartTotal.textContent());
  }

  async linePrices(): Promise<number[]> {
    return (await this.page.getByTestId('line-price').allTextContents()).map(money);
  }

  async fillAddress(address: Address) {
    await this.page.getByTestId('country').selectOption({ label: address.country });
    await this.page.getByTestId('postal_code').fill(address.postalCode);
    await this.page.getByTestId('house_number').fill(address.houseNumber);
    await this.page.getByTestId('street').fill(address.street);
    await this.page.getByTestId('city').fill(address.city);
    await this.page.getByTestId('state').fill(address.state);
  }

  async pay(method: PaymentMethod) {
    await this.paymentMethod.selectOption(method);
    await this.confirm.click();
  }

  /**
   * Second click on Confirm, after payment succeeds, creates the invoice.
   * Returns the request body the storefront sent to POST /invoices.
   */
  async placeOrder(): Promise<Record<string, unknown>> {
    const request = this.page.waitForRequest(
      (req) => req.url().endsWith('/invoices') && req.method() === 'POST',
    );
    await this.confirm.click();
    return (await request).postDataJSON();
  }
}
