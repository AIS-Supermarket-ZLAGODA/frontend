export interface Employee {
  id_employee: string;
  empl_surname: string;
  empl_name: string;
  empl_patronymic: string | null;
  empl_role: "Cashier" | "Manager";
  salary: number;
  date_of_birth: string;
  date_of_start: string;
  phone_number: string;
  city: string;
  street: string;
  zip_code: string;
}
