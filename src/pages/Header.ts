import { Locator, Page } from '@playwright/test';

export class Header {
  readonly signIn: Locator;
  readonly userMenu: Locator;
  readonly signOut: Locator;
  readonly cart: Locator;
  readonly cartQuantity: Locator;

  constructor(private readonly page: Page) {
    this.signIn = page.getByTestId('nav-sign-in');
    this.userMenu = page.getByTestId('nav-menu');
    this.signOut = page.getByTestId('nav-sign-out');
    this.cart = page.getByTestId('nav-cart');
    this.cartQuantity = page.getByTestId('cart-quantity');
  }

  async logout() {
    await this.userMenu.click();
    await this.signOut.click();
  }
}
