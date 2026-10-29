export interface Product {
  name: string;
  price: number;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';
