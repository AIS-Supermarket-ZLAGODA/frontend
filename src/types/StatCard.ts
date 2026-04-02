export interface StatCard {
    label: string;
    value: number | null;
    icon: string;
    color: string;
    bgColor: string;
    textColor: string;
}

export interface PosCartItem {
  UPC: string;
  product_name: string;
  selling_price: number;
  quantity: number;
  max_quantity: number;
}