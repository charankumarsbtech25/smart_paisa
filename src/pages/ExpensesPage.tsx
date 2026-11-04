import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '@/context/FinanceContext';
import { Expense, EXPENSE_CATEGORIES } from '@/types/finance';
import { formatINR } from '@/utils/currency';
import { formatReadableDate } from '@/utils/date';
import { exportExpensesToCSV } from '@/utils/export';
import { ExpenseFormModal } from '@/components/expenses/ExpenseFormModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { AnimatedCounter } from '@/components/common/AnimatedCounter';
import {
  Search,
  Plus,
  Download,
  Trash2,
  Edit2,
  Calendar,
  Receipt,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
} from 'lucide-react';

const ITEMS_PER_PAGE = 8;

export const ExpensesPage: React.FC = () => {
  const { expenses, deleteExpense } = useFinance();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // Filtered & Sorted expenses
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        // Search query
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchTitle = exp.title.toLowerCase().includes(q);
          const matchNotes = (exp.notes || '').toLowerCase().includes(q);
          if (!matchTitle && !matchNotes) return false;
        }

        // Category filter
        if (selectedCategory !== 'ALL' && exp.category !== selectedCategory) {
          return false;
        }

        // Custom date range
        if (startDate && exp.expense_date < startDate) return false;
        if (endDate && exp.expense_date > endDate) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'amount') {
          return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
        }
        // Default: date sorting
        const dateA = new Date(a.expense_date).getTime();
        const dateB = new Date(b.expense_date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [expenses, searchTerm, selectedCategory, startDate, endDate, sortField, sortOrder]);

  // Quick stats for filtered dataset
  const filteredTotal = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );
  const highestExpense = useMemo(
    () => (filteredExpenses.length > 0 ? Math.max(...filteredExpenses.map((e) => e.amount)) : 0),
    [filteredExpenses]
  );

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE));
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredExpenses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredExpenses, currentPage]);

  const handleDeleteConfirm = async () => {
    if (deletingExpense) {
      await deleteExpense(deletingExpense.id);
      setDeletingExpense(null);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setStartDate('');
    setEndDate('');
    setSortField('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Expense Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track, filter, and inspect your personal transactions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportExpensesToCSV(filteredExpenses)}
            disabled={filteredExpenses.length === 0}
            icon={<Download className="w-4 h-4 text-slate-600" />}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingExpense(null);
              setIsAddModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* Filtered Quick KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="fintech-card p-4 bg-gradient-to-br from-white to-emerald-50/30"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Filtered Total</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            <AnimatedCounter value={filteredTotal} />
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Across {filteredExpenses.length} transaction{filteredExpenses.length === 1 ? '' : 's'}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="fintech-card p-4 bg-gradient-to-br from-white to-blue-50/30"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Peak Expense</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            <AnimatedCounter value={highestExpense} />
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Largest single record in view</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="fintech-card p-4 bg-gradient-to-br from-white to-purple-50/30"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Active Category</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2 truncate">
            {selectedCategory === 'ALL' ? 'All Categories' : selectedCategory}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Page {currentPage} of {totalPages}
          </p>
        </motion.div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="fintech-card p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <Input
              placeholder="Search expenses by title or note..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              aria-label="Filter by category"
            >
              <option value="ALL">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div>
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [f, o] = e.target.value.split('-') as ['date' | 'amount', 'asc' | 'desc'];
                setSortField(f);
                setSortOrder(o);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              aria-label="Sort transactions"
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="amount-desc">Amount (Highest First)</option>
              <option value="amount-asc">Amount (Lowest First)</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Filter */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            Date Range:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:ring-emerald-500 focus:border-emerald-500"
              aria-label="Start date filter"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:ring-emerald-500 focus:border-emerald-500"
              aria-label="End date filter"
            />
          </div>

          {(searchTerm || selectedCategory !== 'ALL' || startDate || endDate) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table / Cards */}
      <div className="fintech-card overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="py-16 text-center text-slate-400 p-6">
            <Receipt className="w-12 h-12 stroke-1 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No Expenses Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No transactions match your search and filter criteria. Try adjusting your filters or record a new expense.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingExpense(null);
                setIsAddModalOpen(true);
              }}
              className="mt-4"
              icon={<Plus className="w-4 h-4" />}
            >
              Add Expense Now
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile Card List View (Phones) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {paginatedExpenses.map((exp) => (
                <div key={exp.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="font-semibold text-sm text-slate-900 truncate">{exp.title}</div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                      <Badge variant="gray" size="sm">
                        {exp.category}
                      </Badge>
                      <span>•</span>
                      <span>{formatReadableDate(exp.expense_date)}</span>
                      {exp.payment_method && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{exp.payment_method}</span>
                        </>
                      )}
                    </div>
                    {exp.notes && (
                      <p className="text-xs text-slate-400 line-clamp-1">{exp.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="font-bold text-sm text-slate-900">
                      -{formatINR(exp.amount)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingExpense(exp);
                          setIsAddModalOpen(true);
                        }}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        aria-label={`Edit ${exp.title}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingExpense(exp)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label={`Delete ${exp.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tablet & Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">Transaction</th>
                    <th className="py-3 px-3 sm:px-4">Category</th>
                    <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">Date</th>
                    <th className="py-3 px-3 sm:px-4 hidden md:table-cell">Payment</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Amount (₹)</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedExpenses.map((exp, idx) => (
                    <motion.tr
                      key={exp.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 * idx, duration: 0.2 }}
                      className="hover:bg-emerald-50/40 transition-colors"
                    >
                      <td className="py-3 px-4 sm:px-6">
                        <div className="font-semibold text-slate-900">{exp.title}</div>
                        {exp.notes && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {exp.notes}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 sm:hidden mt-0.5">
                          {formatReadableDate(exp.expense_date)}
                        </div>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <Badge variant="gray" size="sm">
                          {exp.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 sm:px-4 hidden sm:table-cell text-slate-600">
                        {formatReadableDate(exp.expense_date)}
                      </td>
                      <td className="py-3 px-3 sm:px-4 hidden md:table-cell text-slate-500 font-mono text-xs">
                        {exp.payment_method || '—'}
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-right font-bold text-slate-900 whitespace-nowrap">
                        -{formatINR(exp.amount)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingExpense(exp);
                              setIsAddModalOpen(true);
                            }}
                            icon={<Edit2 className="w-3.5 h-3.5 text-emerald-600" />}
                            className="text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60"
                          >
                            Edit
                          </Button>
                          <button
                            onClick={() => setDeletingExpense(exp)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete Expense"
                            aria-label={`Delete expense ${exp.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Bar */}
        {filteredExpenses.length > ITEMS_PER_PAGE && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredExpenses.length)} of{' '}
              {filteredExpenses.length} transactions
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                icon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Prev
              </Button>
              <span className="font-semibold text-slate-700">
                {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                icon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      <ExpenseFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingExpense(null);
        }}
        editingExpense={editingExpense}
      />

      {/* Delete Confirmation Accessible Modal */}
      <Modal
        isOpen={Boolean(deletingExpense)}
        onClose={() => setDeletingExpense(null)}
        title="Confirm Expense Deletion"
        description="Are you sure you want to permanently delete this expense?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            You are about to delete:{' '}
            <strong className="text-slate-900">{deletingExpense?.title}</strong> (
            {formatINR(deletingExpense?.amount)}). This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setDeletingExpense(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Delete Record
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};
