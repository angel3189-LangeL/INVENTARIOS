import Papa from 'papaparse';
import { ProductRow } from '../types';

export const parseCSV = (input: File | string): Promise<ProductRow[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(input as any, { // Type assertion needed for PapaParse overloads
      header: true,
      skipEmptyLines: true,
      // delimiter: ";",  <-- ELIMINADO: Dejar que PapaParse detecte automáticamente (coma, punto y coma, tab)
      dynamicTyping: true, // Convierte números automáticamente
      transformHeader: (header) => header.trim().toUpperCase(), // Normaliza cabeceras a MAYÚSCULAS
      complete: (results) => {
        const data = results.data as any[];
        
        // Debug: Ver qué cabeceras encontró realmente
        if (results.meta && results.meta.fields) {
            console.log("Cabeceras detectadas en CSV:", results.meta.fields);
        }

        // Función auxiliar para buscar valores usando múltiples nombres posibles (Alias)
        const getVal = (row: any, keys: string[]) => {
            for (const key of keys) {
                // Busca coincidencia exacta (ya que normalizamos a mayúsculas)
                if (row[key] !== undefined && row[key] !== null) return row[key];
            }
            return undefined;
        };

        const cleanData: ProductRow[] = data.map(row => ({
          // Intenta coincidencia exacta primero, luego alias comunes
          CADENA: getVal(row, ['CADENA', 'CHAIN']) || '',
          COD: String(getVal(row, ['COD', 'SKU', 'ITEM', 'CODIGO']) || ''),
          DESCRIPCION: getVal(row, ['DESCRIPCION', 'DESC', 'NOMBRE', 'PRODUCTO', 'DESCRIPTION']) || '',
          MARCA: getVal(row, ['MARCA', 'BRAND']) || '',
          "COD LOCAL": String(getVal(row, ['COD LOCAL', 'ID_LOCAL', 'COD_TIENDA', 'STORE_ID']) || ''),
          "DESCRIPCION LOCAL": getVal(row, ['DESCRIPCION LOCAL', 'NOM_LOCAL', 'NOMBRE_TIENDA', 'STORE_NAME']) || '',
          FORMATO: getVal(row, ['FORMATO', 'CHANNEL', 'CANAL']) || '',
          VTA: Number(getVal(row, ['VTA', 'VENTA', 'SALES', 'VTA 30D', 'VTA_30D'])) || 0,
          STOCK: Number(getVal(row, ['STOCK', 'INVENTARIO', 'OH', 'ON_HAND'])) || 0,
          "DESCRIPCION LOCAL2": getVal(row, ['DESCRIPCION LOCAL2', 'TIENDA', 'SUCURSAL', 'LOCAL', 'STORE']) || '',
        }));

        // Validación básica
        if (cleanData.length > 0) {
            const sample = cleanData[0];
            const hasData = sample.STOCK !== 0 || sample.VTA !== 0 || sample.DESCRIPCION !== '';
            if (!hasData) {
                console.warn("CSV Leído pero parece vacío. Revisa que los nombres de columnas coincidan con los alias.");
            }
        }

        resolve(cleanData);
      },
      error: (error: any) => {
        console.error("Error PapaParse:", error);
        reject(error);
      }
    });
  });
};

export const getColorForValue = (value: number, min: number, max: number, type: 'stock' | 'sales') => {
  const baseStyle = "inline-block px-2 py-0.5 rounded text-xs font-medium border";

  if (type === 'stock') {
    if (value <= 5) return `${baseStyle} bg-red-50 text-red-700 border-red-200`;
    if (value >= 6 && value <= 12) return `${baseStyle} bg-yellow-50 text-yellow-700 border-yellow-200`;
    if (value > 12) return `${baseStyle} bg-green-50 text-green-700 border-green-200`;
    return `${baseStyle} text-gray-600 border-gray-100`; 
  }

  if (type === 'sales') {
    if (value <= 8) return `${baseStyle} bg-red-50 text-red-700 border-red-200`;
    if (value > 8 && value <= 25) return `${baseStyle} bg-yellow-50 text-yellow-700 border-yellow-200`;
    if (value > 25) return `${baseStyle} bg-green-50 text-green-700 border-green-200`;
    return `${baseStyle} text-gray-600 border-gray-100`;
  }

  return "";
};