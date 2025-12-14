export interface ProductRow {
  CADENA: string;
  COD: string; // SKU
  DESCRIPCION: string;
  MARCA: string;
  "COD LOCAL": string;
  "DESCRIPCION LOCAL": string;
  FORMATO: string;
  VTA: number;
  STOCK: number;
  "DESCRIPCION LOCAL2": string; // Tienda
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: keyof ProductRow;
  direction: SortDirection;
}