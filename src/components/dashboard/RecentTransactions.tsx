import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Expense } from '@/types/finance';
import { formatINR } from '@/utils/currency';
import { formatReadableDate } from '@/utils/date';
import { Plus, ArrowRight, Receipt, CreditCard, Edit2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { motion } from 'framer-motion';
import { ExpenseFormModal } from '@/components/expenses/ExpenseFormModal';

interface RecentTransactionsProps {
  expenses: Expense[];
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ expenses }) => {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const recentFive = expenses.slice(0, 5);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setModalOpen(true);
  };

  return (
    <div className="fintech-card p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            Recent Transactions
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Your latest 5 financial activities
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenAdd}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Expense
          </Button>
          <Link to="/expenses">
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              View All
            </Button>
          </Link>
        </div>
      </div>

      {recentFive.length === 0 ? (
        <div className="py-8 text-center text-slate-400">
          <Receipt className="w-8 h-8 stroke-1 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600">No Transactions Found</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Start by recording your first expense today!
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 mt-2">
          {recentFive.map((exp, index) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              whileHover={{ x: 4 }}
              className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 -mx-2 px-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {exp.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="gray" size="sm">
                      {exp.category}
                    </Badge>
                    <span className="text-[11px] text-slate-400">
                      {formatReadableDate(exp.expense_date)}
                    </span>
                    {exp.payment_method && (
                      <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                        • {exp.payment_method}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 flex items-center gap-2 sm:gap-3">
                <span className="text-sm font-bold text-slate-900">
                  -{formatINR(exp.amount)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(exp)}
                  icon={<Edit2 className="w-3.5 h-3.5 text-emerald-600" />}
                  className="text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60"
                >
                  Edit
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ExpenseFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
        }}
        editingExpense={editingExpense}
      />
    </div>
  );
};
