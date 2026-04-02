export interface Check {
  check_number: string;
  id_employee: string;
  card_number: string | null;
  print_date: string;
  sum_total: number;
  vat: number;
  empl_surname?: string;
  empl_name?: string;
}

export interface SaleItem {
  UPC: string;
  product_number: number;
  selling_price: number;
  product_name?: string;
}

export type SmallCheck = Pick<Check, 'check_number' | 'id_employee' | 'card_number' | 'print_date' | 'sum_total' | 'vat'>;

export interface CheckDetail extends SmallCheck {
  items?: SaleItem[];
  sales?: SaleItem[];
}
