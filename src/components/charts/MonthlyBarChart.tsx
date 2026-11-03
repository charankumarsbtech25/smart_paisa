import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { MonthlyExpenseItem } from '@/types/finance';
import { formatINR } from '@/utils/currency';
import { Table, Eye, BarChart2 } from 'lucide-react';

interface MonthlyBarChartProps {
  data: MonthlyExpenseItem[];
}

export const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({ data }) => {
  const [showTableAlt, setShowTableAlt] = useState<boolean>(false);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white px-3 py-2.5 rounded-xl text-xs shadow-lg border border-slate-800 space-y-1">
          <p className="font-bold text-slate-200">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-semibold text-white">{formatINR(entry.value)}</span>
            </div>
          ))}
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
            <BarChart2 className="w-4 h-4 text-emerald-600" />
            Monthly Spending vs Budget (6-Month Trend)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare monthly totals against your set limits
          </p>
        </div>

        <button
          onClick={() => setShowTableAlt(!showTableAlt)}
          className="text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label={showTableAlt ? 'Switch to bar chart' : 'Switch to accessible data table'}
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

      {showTableAlt ? (
        <div className="flex-1 overflow-x-auto mt-4">
          <table className="w-full text-left text-xs" aria-label="Monthly comparison table">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3 text-right">Spent (₹)</th>
                <th className="py-2.5 px-3 text-right">Budget (₹)</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item) => {
                const diff = item.budget > 0 ? item.budget - item.totalSpent : 0;
                return (
                  <tr key={item.monthName} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 font-semibold text-slate-800">{item.monthName}</td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-900">
                      {formatINR(item.totalSpent)}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-600 font-medium">
                      {item.budget > 0 ? formatINR(item.budget) : 'Not set'}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {item.budget === 0 ? (
                        <span className="text-slate-400">No cap</span>
                      ) : diff >= 0 ? (
                        <span className="text-emerald-600 font-medium">Within budget</span>
                      ) : (
                        <span className="text-red-600 font-bold">Overspent</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 min-h-[280px] w-full pt-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="monthName" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={30}
                formatter={(val) => (
                  <span className="text-xs text-slate-600 font-medium">{val}</span>
                )}
              />
              <Bar dataKey="totalSpent" name="Total Spent" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="budget" name="Monthly Budget" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
