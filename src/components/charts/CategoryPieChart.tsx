import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { formatINR } from '@/utils/currency';
import { Table, Eye, PieChart as PieIcon } from 'lucide-react';

interface CategoryPieChartProps {
  categoryTotals: Record<string, number>;
  totalExpenses: number;
}

// Fintech accessible color palette
const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#10b981', // emerald
  Transport: '#3b82f6',      // blue
  Education: '#8b5cf6',      // violet
  Shopping: '#f59e0b',       // amber
  Entertainment: '#ec4899',  // pink
  'Bills & Recharge': '#06b6d4', // cyan
  Health: '#ef4444',         // red
  'Personal Care': '#14b8a6',// teal
  Other: '#64748b',          // slate
};

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  categoryTotals,
  totalExpenses,
}) => {
  const [showTableAlt, setShowTableAlt] = useState<boolean>(false);

  const data = Object.entries(categoryTotals)
    .filter(([_, amount]) => amount > 0)
    .map(([category, amount]) => ({
      name: category,
      value: amount,
      percentage: totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : '0',
    }))
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-lg border border-slate-800">
          <p className="font-semibold text-emerald-400">{item.name}</p>
          <p className="font-bold text-white mt-0.5">{formatINR(item.value)}</p>
          <p className="text-[11px] text-slate-300">{item.percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fintech-card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-emerald-600" />
            Category-wise Distribution
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Breakdown of expenses for the selected period
          </p>
        </div>

        {/* Accessible toggle for screen-reader and keyboard users (WCAG 2.2 AA) */}
        <button
          onClick={() => setShowTableAlt(!showTableAlt)}
          className="text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label={showTableAlt ? 'Switch to visual doughnut chart' : 'Switch to accessible data table'}
        >
          {showTableAlt ? (
            <>
              <Eye className="w-3.5 h-3.5 text-emerald-600" /> View Chart
            </>
          ) : (
            <>
              <Table className="w-3.5 h-3.5 text-slate-600" /> Data Table
            </>
          )}
        </button>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 min-h-[260px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <PieIcon className="w-12 h-12 stroke-1 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-600">No Expenses Recorded</p>
          <p className="text-xs text-slate-400 mt-1">
            Add transactions to see category distribution
          </p>
        </div>
      ) : showTableAlt ? (
        /* Accessible Tabular Alternative for WCAG 2.2 */
        <div className="flex-1 overflow-x-auto mt-4">
          <table className="w-full text-left text-xs" aria-label="Category expenses breakdown table">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                <th className="py-2.5 px-3 text-right">Share (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr key={row.name} className="hover:bg-slate-50/60">
                  <td className="py-2 px-3 font-medium text-slate-800 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[row.name] || '#64748b' }}
                      aria-hidden="true"
                    />
                    {row.name}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-slate-900">
                    {formatINR(row.value)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-600 font-mono">
                    {row.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Recharts Doughnut Chart */
        <div className="flex-1 min-h-[280px] w-full pt-2">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={CATEGORY_COLORS[entry.name] || '#64748b'}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(val) => (
                  <span className="text-xs text-slate-600 font-medium">{val}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
