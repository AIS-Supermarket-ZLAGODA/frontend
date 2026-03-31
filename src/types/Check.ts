export interface Check {
  check_number: string;
  id_employee: string;
  card_number: string | null;
  print_date: string;
  sum_total: number;
  vat: number;
}

export interface Sale {
  UPC: string;
  check_number: string;
  product_number: number;
  selling_price: number;
}
