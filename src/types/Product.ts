export interface Product {
  id_product: number;
  category_number: number;
  product_name: string;
  producer: string;
  characteristics: string;
}

export type ProductShort = Pick<Product, 'id_product' | 'product_name'>;