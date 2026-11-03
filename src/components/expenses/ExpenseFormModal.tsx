import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, Expense, ExpenseCategory, PaymentMethod } from '@/types/finance';
import { getTodayDateString } from '@/utils/date';
import { useFinance } from '@/context/FinanceContext';
import { triggerConfetti } from '@/utils/confetti';
import {
  predictExpenseCategory,
  saveUserCategoryCorrection,
  getConfidenceThreshold,
  setConfidenceThreshold,
} from '@/utils/mlEngine';
import { CategoryPredictionResult } from '@/types/ml';
import { Sparkles, Check, AlertTriangle, Sliders } from 'lucide-react';

const expenseSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(80, 'Title is too long'),
  amount: z.coerce.number().positive('Amount must be greater than ₹0').max(10000000, 'Amount exceeds limit'),
  category: z.enum([
    'Food & Dining',
    'Groceries',
    'Transport',
    'Rent',
    'Education',
    'Shopping',
    'Entertainment',
    'Bills & Recharge',
    'Subscriptions',
    'Health',
    'Personal Care',
    'Other',
  ] as const),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date (YYYY-MM-DD)'),
  payment_method: z.enum(['UPI', 'Cash', 'Debit Card', 'Credit Card', 'Net Banking', 'Other'] as const).optional(),
  is_recurring: z.boolean().optional(),
  notes: z.string().max(200, 'Notes must be within 200 characters').optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExpense?: Expense | null;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  editingExpense,
}) => {
  const { addExpense, updateExpense } = useFinance();
  const [predicted, setPredicted] = useState<CategoryPredictionResult | null>(null);
  const [userManuallyConfirmed, setUserManuallyConfirmed] = useState<boolean>(false);
  const [threshold, setThreshold] = useState<number>(() => getConfidenceThreshold());
  const [showThresholdConfig, setShowThresholdConfig] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: '',
      amount: '' as any,
      category: 'Food & Dining',
      expense_date: getTodayDateString(),
      payment_method: 'UPI',
      is_recurring: false,
      notes: '',
    },
  });

  const watchedTitle = watch('title');
  const watchedCategory = watch('category');

  // Intelligent real-time merchant & TF-IDF classification
  // NEVER automatically overwrites a category confirmed by the user
  useEffect(() => {
    if (watchedTitle && watchedTitle.trim().length >= 3 && !editingExpense) {
      const pred = predictExpenseCategory(watchedTitle, threshold);
      setPredicted(pred);
      if (!userManuallyConfirmed && pred.confidence >= threshold && pred.suggestedAction === 'accept') {
        setValue('category', pred.category);
      }
    } else {
      setPredicted(null);
    }
  }, [watchedTitle, threshold, setValue, editingExpense, userManuallyConfirmed]);

  useEffect(() => {
    if (editingExpense) {
      setUserManuallyConfirmed(true);
      reset({
        title: editingExpense.title,
        amount: editingExpense.amount,
        category: editingExpense.category,
        expense_date: editingExpense.expense_date,
        payment_method: editingExpense.payment_method || 'UPI',
        is_recurring: Boolean(editingExpense.is_recurring),
        notes: editingExpense.notes || '',
      });
    } else {
      setUserManuallyConfirmed(false);
      reset({
        title: '',
        amount: '' as any,
        category: 'Food & Dining',
        expense_date: getTodayDateString(),
        payment_method: 'UPI',
        is_recurring: false,
        notes: '',
      });
    }
  }, [editingExpense, isOpen, reset]);

  const handleThresholdChange = (newVal: number) => {
    setThreshold(newVal);
    setConfidenceThreshold(newVal);
  };

  const onSubmit = async (values: ExpenseFormValues) => {
    try {
      // Active learning: record user confirmation or correction for future model improvement
      saveUserCategoryCorrection(values.title, values.category as ExpenseCategory);

      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          title: values.title,
          amount: values.amount,
          category: values.category as ExpenseCategory,
          subcategory: predicted?.subcategory || editingExpense.subcategory,
          category_confirmed: true,
          is_recurring: values.is_recurring,
          expense_date: values.expense_date,
          payment_method: values.payment_method as PaymentMethod,
          notes: values.notes,
        });
      } else {
        await addExpense({
          title: values.title,
          amount: values.amount,
          category: values.category as ExpenseCategory,
          subcategory: predicted?.subcategory,
          category_confirmed: true,
          is_recurring: values.is_recurring,
          expense_date: values.expense_date,
          payment_method: values.payment_method as PaymentMethod,
          notes: values.notes,
        });
        triggerConfetti();
      }
      onClose();
    } catch (err) {
      console.error('Failed to save expense:', err);
    }
  };

  const isLowConfidence = predicted && predicted.confidence < threshold;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
      description="Record your spending with AI merchant & TF-IDF categorization"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <Input
          label="Title / Merchant Description"
          placeholder="e.g. Swiggy ₹245, Metro recharge, Udemy course, PG Rent"
          error={errors.title?.message}
          {...register('title')}
        />

        {/* AI Categorization Suggestion & Confidence Threshold Banner */}
        {predicted && (
          <div
            className={`rounded-xl p-3 border text-xs space-y-2 ${
              isLowConfidence
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {isLowConfidence ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <div>
                  <span>
                    Suggested: <strong className="font-bold">{predicted.category}</strong>
                    {predicted.subcategory && (
                      <span className="text-slate-600"> ({predicted.subcategory})</span>
                    )}
                  </span>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    Confidence: <strong>{Math.round(predicted.confidence * 100)}%</strong> • Layer:{' '}
                    <span className="uppercase font-mono">{predicted.source.replace('_', ' ')}</span>
                    {isLowConfidence && (
                      <span className="ml-1 font-semibold text-amber-800">
                        — Low confidence (&lt;{Math.round(threshold * 100)}%), please confirm!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowThresholdConfig(!showThresholdConfig)}
                  className="p-1 rounded-lg hover:bg-black/5 text-slate-600"
                  title="Configure AI Confidence Threshold"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('category', predicted.category);
                    setUserManuallyConfirmed(true);
                  }}
                  className="text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  {watchedCategory === predicted.category && userManuallyConfirmed
                    ? 'Confirmed'
                    : 'Confirm'}
                </button>
              </div>
            </div>

            {showThresholdConfig && (
              <div className="pt-2 border-t border-black/10 flex items-center justify-between gap-3 text-[11px]">
                <span>Auto-apply confidence threshold: <strong>{Math.round(threshold * 100)}%</strong></span>
                <input
                  type="range"
                  min={0.5}
                  max={0.95}
                  step={0.05}
                  value={threshold}
                  onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
                  className="w-28 accent-emerald-600 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* Amount */}
        <Input
          label="Amount (₹ INR)"
          type="number"
          step="any"
          placeholder="0.00"
          error={errors.amount?.message}
          {...register('amount')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div className="space-y-1.5">
            <label
              htmlFor="category"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Category {userManuallyConfirmed && <span className="text-emerald-600 lowercase font-normal">(user locked)</span>}
            </label>
            <select
              id="category"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              {...register('category', {
                onChange: () => setUserManuallyConfirmed(true),
              })}
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs font-medium text-red-600">{errors.category.message}</p>
            )}
          </div>

          {/* Date */}
          <Input
            label="Date"
            type="date"
            error={errors.expense_date?.message}
            {...register('expense_date')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Payment Method */}
          <div className="space-y-1.5">
            <label
              htmlFor="payment_method"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Payment Method
            </label>
            <select
              id="payment_method"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              {...register('payment_method')}
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <Input
            label="Optional Notes"
            placeholder="e.g. Split with Rohan"
            error={errors.notes?.message}
            {...register('notes')}
          />
        </div>

        {/* Recurring Checkbox */}
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
          <input
            type="checkbox"
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            {...register('is_recurring')}
          />
          <span>Mark as recurring monthly/periodic expense (used by ML forecasting engine)</span>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {editingExpense ? 'Save Changes' : 'Record Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
