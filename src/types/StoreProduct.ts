export interface StoreProduct {
  UPC: string;
  UPC_prom: string | null;
  id_product: number;
  selling_price: number;
  products_number: number;
  promotional_product: boolean;
}
