import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useFinance } from '@/context/FinanceContext';
import { getMonthName } from '@/utils/date';
import { formatINR } from '@/utils/currency';
import { triggerConfetti } from '@/utils/confetti';

interface SetBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetBudgetModal: React.FC<SetBudgetModalProps> = ({ isOpen, onClose }) => {
  const { currentBudget, selectedMonth, selectedYear, setMonthlyBudget } = useFinance();
  const [amountStr, setAmountStr] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (currentBudget) {
      setAmountStr(String(currentBudget.amount));
    } else {
      setAmountStr('');
    }
    setError(null);
  }, [currentBudget, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountStr);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid monthly budget amount in ₹ INR');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await setMonthlyBudget(val, selectedMonth, selectedYear);
      if (!res.success) {
        setError(res.error || 'Failed to update monthly budget');
      } else {
        triggerConfetti();
        onClose();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Set Budget for ${getMonthName(selectedMonth)} ${selectedYear}`}
      description="Define your monthly spending limit to maintain savings discipline"
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Budget Amount (₹ INR)"
          type="number"
          step="any"
          placeholder="e.g. 10000"
          value={amountStr}
          onChange={(e) => setAmountStr(e.target.value)}
          error={error || undefined}
          autoFocus
        />

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-700">Recommended Student Budgets:</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {[5000, 8000, 12000, 15000].map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setAmountStr(String(sug))}
                className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 transition-colors font-medium"
              >
                {formatINR(sug)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Save Budget
          </Button>
        </div>
      </form>
    </Modal>
  );
};
