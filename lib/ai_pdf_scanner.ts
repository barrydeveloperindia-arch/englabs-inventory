import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GOOGLE_GENAI_API_KEY || '';

const genAI = new GoogleGenerativeAI(API_KEY);

export interface ExtractedInvoiceData {
  date: string;
  supplier?: string;
  total: number;
  vat: number;
  items: { description: string; amount: number; category?: string }[];
}

import * as XLSX from 'xlsx';

export const scanInvoiceMedia = async (file: File): Promise<ExtractedInvoiceData> => {
  if (!API_KEY) throw new Error("Missing Google Gemini API Key");

  // Determine Mime Type
  const mimeType = file.type;
  const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic'];
  const validDocTypes = ['application/pdf'];
  const validSheetTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  let promptParts: any[] = [];

  const basePrompt = `
    Analyze this document (Invoice, Receipt, or Sales Report).
    Extract the following structured data:
    1. Date (ISO 8601 format YYYY-MM-DD). If a range, use the end date.
    2. Total Amount (Net Pay / Grand Total).
    3. Total VAT/Tax.
    4. Line Items: An array of major categories or items with their individual amounts.

    Return ONLY raw JSON with this structure:
    {
      "date": "YYYY-MM-DD",
      "supplier": "Name of entity",
      "total": 123.45,
      "vat": 20.00,
      "items": [
        { "description": "Item Name", "amount": 10.00, "category": "Category" }
      ]
    }
  `;

  promptParts.push(basePrompt);

  if (validImageTypes.includes(mimeType) || validDocTypes.includes(mimeType)) {
    // Convert File to Base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
    const base64Content = base64Data.split(',')[1];

    promptParts.push({
      inlineData: {
        data: base64Content,
        mimeType: mimeType === 'application/pdf' ? 'application/pdf' : 'image/jpeg', // Gemini prefers simplified mimes usually
      },
    });

  } else if (validSheetTypes.includes(mimeType) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    // Parse Spreadsheet/CSV to Text
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const sheetName = workbook.SheetNames[0];
    const csvContent = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);

    promptParts.push(`\nDOCUMENT CONTENT (CSV/Text format):\n${csvContent}`);
  } else {
    throw new Error(`Unsupported file type: ${mimeType}. Supported: PDF, Images, CSV, Excel.`);
  }

  const result = await model.generateContent(promptParts);

  const response = await result.response;
  const text = response.text();

  // Clean MD formatting
  const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

  return JSON.parse(jsonStr);
};

// Alias for backward compatibility if needed, though we should update calls
export const scanPdfInvoice = scanInvoiceMedia;
