import { Locator, Page } from '@playwright/test';
import type { Credentials } from '../data/users';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByTestId('email');
    this.password = page.getByTestId('password');
    this.submit = page.getByTestId('login-submit');
    this.error = page.getByTestId('login-error');
  }

  async goto() {
    await this.page.goto('/auth/login');
  }

  async login({ email, password }: Credentials) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
