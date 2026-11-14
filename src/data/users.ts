import path from 'node:path';

export interface Credentials {
  email: string;
  password: string;
}

// These are the demo accounts published on the Toolshop login page.
// Override with env vars when pointing at your own deployment.
export const customer: Credentials = {
  email: process.env.CUSTOMER_EMAIL ?? 'customer@practicesoftwaretesting.com',
  password: process.env.CUSTOMER_PASSWORD ?? 'welcome01',
};

export const AUTH_FILE = path.join(__dirname, '..', '..', '.auth', 'customer.json');
