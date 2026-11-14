import { APIRequestContext, expect } from '@playwright/test';
import type { Credentials } from '../data/users';

export interface Product {
  id: string;
  name: string;
  price: number;
  in_stock: boolean;
  is_rental: boolean;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string };
}

export interface Paginated<T> {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: T[];
}

export interface CartItem {
  id: string;
  quantity: number;
  product_id: string;
  product: Product;
}

export interface Cart {
  id: string;
  cart_items: CartItem[];
}

/**
 * Thin wrapper over the Toolshop REST API. Used directly by the API specs,
 * and by UI specs that need to set up state faster than clicking through it.
 */
export class ToolshopApi {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl = '',
  ) {}

  private url(path: string) {
    return `${this.baseUrl}${path}`;
  }

  async login({ email, password }: Credentials): Promise<string> {
    const res = await this.request.post(this.url('/users/login'), { data: { email, password } });
    await expect(res, `login failed for ${email}`).toBeOK();
    const { access_token } = await res.json();
    return access_token;
  }

  async getProducts(params: Record<string, string | number> = {}): Promise<Paginated<Product>> {
    const res = await this.request.get(this.url('/products'), { params });
    await expect(res).toBeOK();
    return res.json();
  }

  async searchProducts(query: string): Promise<Paginated<Product>> {
    const res = await this.request.get(this.url('/products/search'), { params: { q: query } });
    await expect(res).toBeOK();
    return res.json();
  }

  async findProductByName(name: string): Promise<Product> {
    const { data } = await this.searchProducts(name);
    const product = data.find((p) => p.name === name);
    if (!product) throw new Error(`No product named "${name}"`);
    return product;
  }

  async createCart(): Promise<string> {
    const res = await this.request.post(this.url('/carts'));
    expect(res.status()).toBe(201);
    return (await res.json()).id;
  }

  async addToCart(cartId: string, productId: string, quantity = 1) {
    const res = await this.request.post(this.url(`/carts/${cartId}`), {
      data: { product_id: productId, quantity },
    });
    await expect(res).toBeOK();
  }

  async getCart(cartId: string): Promise<Cart> {
    const res = await this.request.get(this.url(`/carts/${cartId}`));
    await expect(res).toBeOK();
    return res.json();
  }
}
