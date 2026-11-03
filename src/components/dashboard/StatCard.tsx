import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/common/AnimatedCounter';

interface StatCardProps {
  title: string;
  amount: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  highlight?: 'emerald' | 'amber' | 'red' | 'navy';
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  subtitle,
  icon,
  trend,
  highlight = 'navy',
  delay = 0,
}) => {
  const highlightStyles = {
    emerald: 'border-emerald-200/80 bg-emerald-50/30 text-emerald-950',
    amber: 'border-amber-200/80 bg-amber-50/30 text-amber-950',
    red: 'border-red-200/80 bg-red-50/30 text-red-950',
    navy: 'border-slate-200/80 bg-white/95 text-slate-900',
  };

  const iconBgStyles = {
    emerald: 'bg-emerald-100/80 text-emerald-700 shadow-sm shadow-emerald-200/50',
    amber: 'bg-amber-100/80 text-amber-700 shadow-sm shadow-amber-200/50',
    red: 'bg-red-100/80 text-red-700 shadow-sm shadow-red-200/50',
    navy: 'bg-slate-100 text-slate-700 shadow-sm',
  };

  // Parse numeric amount for animated counter if possible
  const numMatch = amount.match(/^([^\d]*)([\d,]+)(.*)$/);
  const isNumeric = numMatch !== null;
  const prefix = isNumeric ? numMatch[1] : '';
  const numericVal = isNumeric ? parseInt(numMatch[2].replace(/,/g, ''), 10) : 0;
  const suffix = isNumeric ? numMatch[3] : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      whileHover={{ y: -4, scale: 1.015, transition: { duration: 0.2 } }}
      className={`rounded-2xl border p-5 shadow-soft hover:shadow-card backdrop-blur-md transition-shadow relative overflow-hidden group ${highlightStyles[highlight]}`}
    >
      {/* Subtle sheen highlight on hover */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-white/40 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
          {title}
        </span>
        <motion.div
          whileHover={{ rotate: 12, scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className={`p-2.5 rounded-xl ${iconBgStyles[highlight]}`}
        >
          {icon}
        </motion.div>
      </div>

      <div className="mt-3 relative z-10">
        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
          {isNumeric ? (
            <AnimatedCounter
              value={numericVal}
              prefix={prefix}
              suffix={suffix}
              duration={850}
            />
          ) : (
            amount
          )}
        </h3>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-700 flex items-center gap-1.5 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs relative z-10">
          <span
            className={`font-semibold ${
              trend.isPositive ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {trend.value}
          </span>
          <span className="text-slate-500">{trend.label}</span>
        </div>
      )}
    </motion.div>
  );
};
