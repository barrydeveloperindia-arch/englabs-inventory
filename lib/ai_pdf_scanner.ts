import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import * as XLSX from 'xlsx';
import { SmartIntakeItem } from '../types';

const API_KEY = import.meta.env.VITE_GOOGLE_GENAI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export type IntakeMode = 'INVOICE_SUMMARY' | 'INVENTORY_DETAILED';

export interface ExtractedInvoiceSummary {
  total_amount: number;
  date: string;
  supplier_name: string;
  invoice_number: string;
  items_summary: string;
}

export interface AIIntakeResult {
  summary?: ExtractedInvoiceSummary;
  items?: SmartIntakeItem[];
}

/**
 * Robust AI Scanner for Procurement and Inventory Documents.
 * Supports Images, PDF, Excel, and CSV.
 * Uses Gemini 2.5 Flash for high-speed, high-fidelity extraction.
 */
export const scanDocument = async (
  file: File | string,
  mode: IntakeMode = 'INVOICE_SUMMARY'
): Promise<AIIntakeResult> => {
  if (!API_KEY) throw new Error("Missing Google Gemini API Key (VITE_GOOGLE_GENAI_API_KEY)");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: mode === 'INVENTORY_DETAILED' 
      ? "You are an expert inventory auditor. Extract every item with precise counts and pricing. Provide 2D bounding boxes for visual verification."
      : "You are a professional accountant. Extract the high-level financial data from the document."
  });

  const parts: any[] = [];
  let fileMimeType = '';

  if (typeof file === 'string') {
    // Manual text input
    parts.push({ text: `Analyze the following text data:\n${file}` });
  } else {
    fileMimeType = file.type;
    const isSheet = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');

    if (isSheet) {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const sheetName = workbook.SheetNames[0];
      const csvContent = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
      parts.push({ text: `Analyze the following spreadsheet data (CSV format):\n${csvContent}` });
    } else {
      const base64 = await fileToBase64(file);
      const base64Data = base64.split(',')[1];
      parts.push({
        inlineData: {
          mimeType: fileMimeType === 'application/pdf' ? 'application/pdf' : 'image/jpeg',
          data: base64Data
        }
      });
    }
  }

  // Define Schema based on mode
  const generationConfig: any = {
    responseMimeType: "application/json",
  };

  if (mode === 'INVENTORY_DETAILED') {
    generationConfig.responseSchema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          brand: { type: SchemaType.STRING },
          qty: { type: SchemaType.NUMBER },
          costPrice: { type: SchemaType.NUMBER },
          price: { type: SchemaType.NUMBER },
          category: { type: SchemaType.STRING },
          shelfLocation: { type: SchemaType.STRING },
          barcode: { type: SchemaType.STRING },
          sku: { type: SchemaType.STRING },
          box_2d: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.NUMBER }
          }
        },
        required: ['name', 'qty', 'costPrice', 'price']
      }
    };
  } else {
    generationConfig.responseSchema = {
      type: SchemaType.OBJECT,
      properties: {
        total_amount: { type: SchemaType.NUMBER },
        date: { type: SchemaType.STRING },
        supplier_name: { type: SchemaType.STRING },
        invoice_number: { type: SchemaType.STRING },
        items_summary: { type: SchemaType.STRING }
      },
      required: ['total_amount', 'date', 'supplier_name']
    };
  }

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig
  });

  const response = await result.response;
  const text = response.text();
  const parsed = JSON.parse(text);

  return mode === 'INVENTORY_DETAILED' ? { items: parsed } : { summary: parsed };
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Aliases for backward compatibility
export const scanInvoiceMedia = async (file: File): Promise<any> => {
    const res = await scanDocument(file, 'INVOICE_SUMMARY');
    return res.summary;
};

export const scanPdfInvoice = scanInvoiceMedia;
