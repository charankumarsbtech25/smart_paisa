import { Expense, MonthlyBudget } from '@/types/finance';
import { UserProfile } from '@/types/auth';

/**
 * Privacy & Data utilities for downloading personal financial records.
 */

export function exportUserDataAsJSON(data: {
  profile: UserProfile | null;
  expenses: Expense[];
  budgets: MonthlyBudget[];
  exportDate: string;
}) {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute(
    'download',
    `smartpaisa_data_export_${new Date().toISOString().slice(0, 10)}.json`
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportExpensesToCSV(expenses: Expense[]) {
  if (expenses.length === 0) return;

  const headers = ['ID', 'Date', 'Title', 'Category', 'Amount (INR)', 'Payment Method', 'Notes'];
  const rows = expenses.map((exp) => [
    `"${exp.id}"`,
    `"${exp.expense_date}"`,
    `"${(exp.title || '').replace(/"/g, '""')}"`,
    `"${exp.category}"`,
    exp.amount,
    `"${exp.payment_method || ''}"`,
    `"${(exp.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', encodedUri);
  downloadAnchor.setAttribute(
    'download',
    `smartpaisa_expenses_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
