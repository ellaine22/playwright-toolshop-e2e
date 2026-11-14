import { Locator, Page } from '@playwright/test';

export class ProductPage {
  readonly name: Locator;
  readonly price: Locator;
  readonly quantity: Locator;
  readonly increaseQuantity: Locator;
  readonly addToCart: Locator;
  readonly addedToast: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByTestId('product-name');
    this.price = page.getByTestId('unit-price');
    this.quantity = page.getByTestId('quantity');
    this.increaseQuantity = page.getByTestId('increase-quantity');
    this.addToCart = page.getByTestId('add-to-cart');
    this.addedToast = page.getByRole('alert').filter({ hasText: 'Product added to shopping cart' });
  }

  async goto(productId: string) {
    await this.page.goto(`/product/${productId}`);
    await this.name.waitFor();
  }

  async unitPrice(): Promise<number> {
    return Number((await this.price.textContent())?.replace(/[^\d.]/g, ''));
  }

  async add(quantity = 1) {
    if (quantity > 1) await this.quantity.fill(String(quantity));
    await this.addToCart.click();
  }
}
