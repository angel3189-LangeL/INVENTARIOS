import Papa from 'papaparse';
import { ProductRow } from '../types';

export const parseCSV = (input: File | string): Promise<ProductRow[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(input as any, { // Type assertion needed for PapaParse overloads
      header: true,
      skipEmptyLines: true,
      delimiter: ";", // Specified by user
      dynamicTyping: true, // Auto-convert numbers
      transformHeader: (header) => header.trim(), // Remove extra spaces
      complete: (results) => {
        // Validation and cleanup
        const data = results.data as any[];
        const cleanData: ProductRow[] = data.map(row => ({
          CADENA: row['CADENA'] || '',
          COD: String(row['COD'] || ''),
          DESCRIPCION: row['DESCRIPCION'] || '',
          MARCA: row['MARCA'] || '',
          "COD LOCAL": String(row['COD LOCAL'] || ''),
          "DESCRIPCION LOCAL": row['DESCRIPCION LOCAL'] || '',
          FORMATO: row['FORMATO'] || '',
          VTA: Number(row['VTA']) || 0,
          STOCK: Number(row['STOCK']) || 0,
          "DESCRIPCION LOCAL2": row['DESCRIPCION LOCAL2'] || '',
        }));
        resolve(cleanData);
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
};

export const getColorForValue = (value: number, min: number, max: number, type: 'stock' | 'sales') => {
  // Base style: small, elegant, rounded
  const baseStyle = "inline-block px-2 py-0.5 rounded text-xs font-medium border";

  if (type === 'stock') {
    // Rojo <= 5
    if (value <= 5) return `${baseStyle} bg-red-50 text-red-700 border-red-200`;
    // Amarillo >= 6 y <= 12 (Implied range for "Verde > 12")
    if (value >= 6 && value <= 12) return `${baseStyle} bg-yellow-50 text-yellow-700 border-yellow-200`;
    // Verde > 12
    if (value > 12) return `${baseStyle} bg-green-50 text-green-700 border-green-200`;
    
    return `${baseStyle} text-gray-600 border-gray-100`; // Fallback (e.g. between 5 and 6 if float)
  }

  if (type === 'sales') {
    // Rojo <= 8
    if (value <= 8) return `${baseStyle} bg-red-50 text-red-700 border-red-200`;
    // Amarillo >= 15 (Assuming gap 9-14 is neutral or handled implicitly. Let's make 9-25 yellow range for continuity based on "Verde > 25")
    if (value > 8 && value <= 25) return `${baseStyle} bg-yellow-50 text-yellow-700 border-yellow-200`;
    // Verde > 25
    if (value > 25) return `${baseStyle} bg-green-50 text-green-700 border-green-200`;

    return `${baseStyle} text-gray-600 border-gray-100`;
  }

  return "";
};