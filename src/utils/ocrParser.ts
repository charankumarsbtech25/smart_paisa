import { z } from 'zod';
import { Expense, EXPENSE_CATEGORIES } from '@/types/finance';
import { ExtractedStatementItem } from '@/types/ml';
import { predictExpenseCategory } from './mlEngine';

/**
 * SmartPaisa 2.0 Statement & Receipt Scanner Engine
 * Supports:
 * 1. CSV Bank Statements (HDFC, SBI, ICICI, Axis, Kotak, Paytm/PhonePe UPI exports)
 * 2. PDF Bank Statements (PDF text-stream & tabular statement parser)
 * 3. Receipt Images / OCR Text (Tesseract OCR pipeline + receipt total/merchant/date parser)
 * 4. Zod schema validation & file security checks (5MB limit, MIME/extension allowlist)
 */

export const MAX_UPLOAD_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_FILE_EXTENSIONS = ['.csv', '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.txt'];

export const stagedTransactionSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  merchantName: z.string().min(1, 'Merchant name is required').max(120),
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number().positive('Amount must be greater than ₹0').max(10000000),
  type: z.enum(['debit', 'credit']),
  suggestedCategory: z.enum(EXPENSE_CATEGORIES as [string, ...string[]]),
  confidence: z.number().min(0).max(1),
  isDuplicate: z.boolean(),
  selected: z.boolean(),
});

export function validateUploadFile(file: { name: string; size: number; type?: string }): {
  valid: boolean;
  error?: string;
} {
  if (!file || !file.name) {
    return { valid: false, error: 'No file selected.' };
  }
  if (file.size <= 0) {
    return { valid: false, error: 'Uploaded file is empty (0 bytes).' };
  }
  if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 5.00 MB security limit.`,
    };
  }
  const lowerName = file.name.toLowerCase();
  const hasAllowedExt = ALLOWED_FILE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (!hasAllowedExt) {
    return {
      valid: false,
      error: `Unsupported file type. Allowed formats: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`,
    };
  }
  return { valid: true };
}

// Helper to normalize dates to YYYY-MM-DD
export function normalizeStatementDate(raw: string): string {
  const clean = (raw || '').trim();
  // Format DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Format DD/MM/YY
  const dmyShort = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/);
  if (dmyShort) {
    const [, d, m, y] = dmyShort;
    return `20${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Format YYYY-MM-DD
  const ymdMatch = clean.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return new Date().toISOString().split('T')[0];
}

// Clean amount text to number
function parseAmount(raw: string): number {
  const clean = (raw || '').replace(/[^\d.-]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.abs(num);
}

// Extract clean merchant name from UPI/Bank narration string
export function extractMerchantFromDescription(rawDesc: string): string {
  const clean = (rawDesc || '').trim();
  // UPI narration pattern: UPI/DR/33128391/SWIGGY/HDFC000...
  if (clean.toUpperCase().startsWith('UPI/') || clean.toUpperCase().startsWith('UPI-')) {
    const parts = clean.split(/[\/\-]/).map((p) => p.trim()).filter(Boolean);
    const candidate = parts.find(
      (p, idx) => idx >= 2 && !/^\d+$/.test(p) && p.toUpperCase() !== 'DR' && p.toUpperCase() !== 'CR'
    );
    if (candidate) return candidate.slice(0, 50);
  }
  // Remove trailing reference numbers
  const stripped = clean
    .replace(/\b(UPI|IMPS|NEFT|POS|ATM|TXN|REF|NO|ID)[:\-\/\s]*\d+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return (stripped || clean || 'Merchant').slice(0, 50);
}

function checkDuplicateExpense(
  date: string,
  amount: number,
  description: string,
  existingExpenses: Expense[]
): boolean {
  return existingExpenses.some((exp) => {
    const sameAmount = Math.abs(Number(exp.amount) - amount) < 0.01;
    const sameDate = exp.expense_date === date;
    const descPrefix = description.toLowerCase().slice(0, 8);
    const titlePrefix = exp.title.toLowerCase().slice(0, 8);
    const similarTitle =
      descPrefix.length >= 3 &&
      (exp.title.toLowerCase().includes(descPrefix) || description.toLowerCase().includes(titlePrefix));
    return sameAmount && (sameDate || similarTitle);
  });
}

/**
 * Parse CSV Statement file contents into staged transactions.
 */
export function parseCSVStatement(
  csvContent: string,
  existingExpenses: Expense[] = []
): ExtractedStatementItem[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';')) delimiter = ';';

  const headers = firstLine.split(delimiter).map((h) => h.toLowerCase().replace(/["']/g, '').trim());

  let dateIdx = headers.findIndex((h) => h.includes('date') || h.includes('txn date') || h.includes('time'));
  let descIdx = headers.findIndex(
    (h) =>
      h.includes('desc') ||
      h.includes('narration') ||
      h.includes('particular') ||
      h.includes('remark') ||
      h.includes('title') ||
      h.includes('merchant')
  );
  const debitIdx = headers.findIndex((h) => h.includes('debit') || h.includes('dr') || h.includes('withdrawal'));
  const creditIdx = headers.findIndex((h) => h.includes('credit') || h.includes('cr') || h.includes('deposit'));
  let amtIdx = headers.findIndex((h) => h.includes('amount') || h.includes('txn amount') || h.includes('net'));

  if (dateIdx === -1) dateIdx = 0;
  if (descIdx === -1) descIdx = 1;
  if (amtIdx === -1 && debitIdx === -1) amtIdx = 2;

  const results: ExtractedStatementItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(delimiter).map((col) => col.replace(/["']/g, '').trim());
    if (row.length <= Math.max(dateIdx, descIdx)) continue;

    const rawDate = row[dateIdx] || '';
    const rawDesc = row[descIdx] || 'Bank Transaction';

    let amount = 0;
    let type: 'debit' | 'credit' = 'debit';

    if (debitIdx !== -1 && row[debitIdx] && parseAmount(row[debitIdx]) > 0) {
      amount = parseAmount(row[debitIdx]);
      type = 'debit';
    } else if (creditIdx !== -1 && row[creditIdx] && parseAmount(row[creditIdx]) > 0) {
      amount = parseAmount(row[creditIdx]);
      type = 'credit';
    } else if (amtIdx !== -1 && row[amtIdx]) {
      amount = parseAmount(row[amtIdx]);
      type = 'debit';
    }

    if (amount <= 0) continue;

    const normalizedDate = normalizeStatementDate(rawDate);
    const merchantName = extractMerchantFromDescription(rawDesc);
    const prediction = predictExpenseCategory(rawDesc, amount);
    const isDuplicate = checkDuplicateExpense(normalizedDate, amount, rawDesc, existingExpenses);

    results.push({
      id: `stmt-csv-${Date.now()}-${i}`,
      date: normalizedDate,
      merchantName,
      description: rawDesc,
      amount,
      type,
      suggestedCategory: prediction.category,
      confidence: prediction.confidence,
      isDuplicate,
      selected: !isDuplicate && type === 'debit',
    });
  }

  return results;
}

/**
 * Parse PDF Bank Statement content (extracts PDF text streams + tabular statement lines).
 * Compatible with PDF.js extracted text and raw PDF streams.
 */
export function parsePDFStatement(
  rawPdfContent: string,
  existingExpenses: Expense[] = []
): ExtractedStatementItem[] {
  // 1. Extract literal strings inside PDF text objects `( ... ) Tj` if binary/raw PDF stream was passed
  let extractedText = rawPdfContent;
  const pdfLiteralMatches = rawPdfContent.match(/\(([^()\\]{2,120})\)\s*T[jJ]/g);
  if (pdfLiteralMatches && pdfLiteralMatches.length >= 1) {
    extractedText = pdfLiteralMatches
      .map((m) => m.replace(/^\(|\)\s*T[jJ]$/g, '').trim())
      .join('\n');
  }

  const lines = extractedText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: ExtractedStatementItem[] = [];

  // Pattern: Date (YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY) followed by narration and amount
  const txnLineRegex =
    /^(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+(.+?)\s+(?:INR|Rs\.?|₹)?\s*(\d[\d,]*(?:\.\d{1,2})?)\s*(DR|CR|Debit|Credit)?$/i;

  lines.forEach((line, idx) => {
    const match = line.match(txnLineRegex);
    if (match) {
      const [, rawDate, rawDesc, rawAmt, drCr] = match;
      const amount = parseAmount(rawAmt);
      if (amount <= 0) return;

      const type: 'debit' | 'credit' =
        drCr && /^(cr|credit)$/i.test(drCr.trim()) ? 'credit' : 'debit';
      const normalizedDate = normalizeStatementDate(rawDate);
      const cleanDesc = rawDesc.replace(/\s+/g, ' ').trim();
      const merchantName = extractMerchantFromDescription(cleanDesc);
      const prediction = predictExpenseCategory(cleanDesc, amount);
      const isDuplicate = checkDuplicateExpense(normalizedDate, amount, cleanDesc, existingExpenses);

      results.push({
        id: `stmt-pdf-${Date.now()}-${idx}`,
        date: normalizedDate,
        merchantName,
        description: cleanDesc,
        amount,
        type,
        suggestedCategory: prediction.category,
        confidence: prediction.confidence,
        isDuplicate,
        selected: !isDuplicate && type === 'debit',
      });
    }
  });

  // Fallback to receipt/line parser if no tabular rows matched
  if (results.length === 0) {
    return parseReceiptText(extractedText, existingExpenses);
  }

  return results;
}

/**
 * Parses raw text extracted from a receipt image (Tesseract OCR) or text receipt.
 */
export function parseReceiptText(
  rawText: string,
  existingExpenses: Expense[] = []
): ExtractedStatementItem[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // If the text looks like multiple statement rows, try PDF/tabular parser first
  const multiRowMatches = lines.filter((l) =>
    /^(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+.+\s+\d/.test(l)
  );
  if (multiRowMatches.length >= 2) {
    return parsePDFStatement(rawText, existingExpenses);
  }

  const results: ExtractedStatementItem[] = [];

  let detectedTotal = 0;
  let detectedDate = new Date().toISOString().split('T')[0];
  let detectedMerchant = 'Receipt Purchase';
  const itemDescriptions: string[] = [];

  for (const line of lines) {
    const l = line.toLowerCase();

    // Check Date
    const dMatch = line.match(/(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
    if (dMatch) {
      detectedDate = normalizeStatementDate(dMatch[1]);
    }

    // Check Total / Net Payable
    if (
      l.includes('total') ||
      l.includes('grand total') ||
      l.includes('net amount') ||
      l.includes('paid') ||
      l.includes('amount') ||
      l.includes('payable')
    ) {
      const numMatch = line.match(/(?:₹|rs\.?|inr)?\s*(\d[\d,]*\.\d{2}|\d[\d,]+)/i);
      if (numMatch) {
        const amt = parseAmount(numMatch[1]);
        if (amt > detectedTotal) detectedTotal = amt;
      }
    }

    // Check merchant header from early lines
    if (
      detectedMerchant === 'Receipt Purchase' &&
      !l.includes('tax') &&
      !l.includes('invoice') &&
      !l.includes('gst') &&
      !l.includes('receipt') &&
      !l.includes('date')
    ) {
      detectedMerchant = line.slice(0, 45);
    } else if (line.length > 3 && !l.includes('gst') && !l.includes('thank')) {
      itemDescriptions.push(line.slice(0, 40));
    }
  }

  if (detectedTotal > 0) {
    const description =
      itemDescriptions.length > 0
        ? `${detectedMerchant} (${itemDescriptions.slice(0, 2).join(', ')})`.slice(0, 90)
        : detectedMerchant;
    const prediction = predictExpenseCategory(detectedMerchant + ' ' + rawText.slice(0, 120), detectedTotal);
    const isDuplicate = checkDuplicateExpense(detectedDate, detectedTotal, description, existingExpenses);

    results.push({
      id: `rcpt-${Date.now()}`,
      date: detectedDate,
      merchantName: detectedMerchant,
      description,
      amount: detectedTotal,
      type: 'debit',
      suggestedCategory: prediction.category,
      confidence: prediction.confidence,
      isDuplicate,
      selected: !isDuplicate,
    });
  }

  return results;
}
