import { test as base } from '@playwright/test';
import { ToolshopApi } from '../api/ToolshopApi';
import { API_URL } from '../data/env';
import { CheckoutPage } from '../pages/CheckoutPage';
import { Header } from '../pages/Header';
import { LoginPage } from '../pages/LoginPage';
import { ProductListPage } from '../pages/ProductListPage';
import { ProductPage } from '../pages/ProductPage';

interface Fixtures {
  api: ToolshopApi;
  header: Header;
  loginPage: LoginPage;
  productList: ProductListPage;
  productPage: ProductPage;
  checkout: CheckoutPage;
}

export const test = base.extend<Fixtures>({
  // UI projects use the storefront as baseURL, so the API client gets an explicit host
  api: async ({ request }, use) => {
    await use(new ToolshopApi(request, API_URL));
  },
  header: async ({ page }, use) => {
    await use(new Header(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  productList: async ({ page }, use) => {
    await use(new ProductListPage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  checkout: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

export { expect } from '@playwright/test';
