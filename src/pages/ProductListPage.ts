import { Locator, Page } from '@playwright/test';

export type SortOption = 'name,asc' | 'name,desc' | 'price,asc' | 'price,desc';

export const PRODUCT_LIST_URL = /\/products(\/search)?(\?|$)/;

export class ProductListPage {
  readonly searchInput: Locator;
  readonly searchSubmit: Locator;
  readonly searchReset: Locator;
  readonly sort: Locator;
  readonly productCards: Locator;
  readonly productNames: Locator;
  readonly productPrices: Locator;
  readonly nextPage: Locator;

  constructor(private readonly page: Page) {
    this.searchInput = page.getByTestId('search-query');
    this.searchSubmit = page.getByTestId('search-submit');
    this.searchReset = page.getByTestId('search-reset');
    this.sort = page.getByTestId('sort');
    this.productCards = page.locator('a[data-test^="product-"]');
    this.productNames = page.getByTestId('product-name');
    this.productPrices = page.getByTestId('product-price');
    this.nextPage = page.getByTestId('pagination-next');
  }

  async goto() {
    await this.page.goto('/');
    await this.productCards.first().waitFor();
  }

  /**
   * Runs an action and waits for the product list request it triggers to finish.
   * The storefront sends filters in the body of an HTTP QUERY request rather than
   * as GET params, so match on the path and ignore the CORS preflight.
   */
  private async waitForProducts(action: () => Promise<void>) {
    const response = this.page.waitForResponse(
      (res) => PRODUCT_LIST_URL.test(res.url()) && res.request().method() !== 'OPTIONS',
    );
    await action();
    await response;
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.waitForProducts(() => this.searchSubmit.click());
  }

  async sortBy(option: SortOption) {
    await this.waitForProducts(async () => {
      await this.sort.selectOption(option);
    });
  }

  async filterByCategory(name: string) {
    await this.waitForProducts(() =>
      this.page.getByRole('checkbox', { name, exact: true }).check(),
    );
  }

  async goToNextPage() {
    await this.waitForProducts(() => this.nextPage.click());
  }

  async names(): Promise<string[]> {
    return (await this.productNames.allTextContents()).map((n) => n.trim());
  }

  async prices(): Promise<number[]> {
    return (await this.productPrices.allTextContents()).map((p) => Number(p.replace(/[^\d.]/g, '')));
  }

  async openProduct(name: string) {
    await this.productCards.filter({ hasText: name }).first().click();
  }
}
