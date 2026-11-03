import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '@/context/FinanceContext';
import { SavingsGoal } from '@/types/finance';
import { formatINR } from '@/utils/currency';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import {
  Target,
  Plus,
  TrendingUp,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Coins,
  Sparkles,
  Trash2,
  Edit2,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  Clock,
} from 'lucide-react';

export const SavingsPage: React.FC = () => {
  const {
    savingsGoals,
    savingsContributions,
    summary,
    addSavingsGoal,
    updateSavingsGoal,
    addSavingsContribution,
    verifyPlannedContribution,
    deleteSavingsGoal,
  } = useFinance();

  const [showAddGoalModal, setShowAddGoalModal] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);

  // Goal form state
  const [goalName, setGoalName] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [category, setCategory] = useState<string>('Technology');

  // Contribution form state
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositNotes, setDepositNotes] = useState<string>('');
  const [contributionType, setContributionType] = useState<'verified_deposit' | 'planned'>('verified_deposit');

  const activeGoals = savingsGoals.filter((g) => g.status === 'in_progress' || g.status === 'paused');
  const completedGoals = savingsGoals.filter((g) => g.status === 'completed');

  const totalTarget = savingsGoals.reduce((sum, g) => sum + Number(g.target_amount), 0);
  const totalSaved = savingsGoals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const totalPlanned = savingsGoals.reduce((sum, g) => sum + Number(g.planned_amount || 0), 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  // User's realistic monthly savings capacity from verified income/budget
  const monthlySavingsCapacity = Math.max(
    1500,
    summary.netSavings > 0
      ? summary.netSavings
      : summary.remainingBudget > 0
      ? summary.remainingBudget
      : 2500
  );

  const openCreateModal = () => {
    setEditingGoal(null);
    setGoalName('');
    setTargetAmount('');
    setTargetDate('');
    setCategory('Technology');
    setShowAddGoalModal(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setTargetAmount(String(goal.target_amount));
    setTargetDate(goal.target_date);
    setCategory(goal.category || 'Technology');
    setShowAddGoalModal(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !targetAmount || !targetDate) return;

    if (editingGoal) {
      await updateSavingsGoal(editingGoal.id, {
        name: goalName.trim(),
        target_amount: parseFloat(targetAmount),
        target_date: targetDate,
        category,
      });
    } else {
      await addSavingsGoal({
        name: goalName,
        target_amount: parseFloat(targetAmount),
        target_date: targetDate,
        category,
      });
    }

    setGoalName('');
    setTargetAmount('');
    setTargetDate('');
    setEditingGoal(null);
    setShowAddGoalModal(false);
  };

  const handleTogglePause = async (goal: SavingsGoal) => {
    const nextStatus = goal.status === 'paused' ? 'in_progress' : 'paused';
    await updateSavingsGoal(goal.id, { status: nextStatus });
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoalId || !depositAmount) return;

    await addSavingsContribution(
      activeGoalId,
      parseFloat(depositAmount),
      depositNotes,
      contributionType
    );
    setDepositAmount('');
    setDepositNotes('');
    setContributionType('verified_deposit');
    setShowDepositModal(false);
    setActiveGoalId(null);
  };

  const calculateMonthlyNeeded = (target: number, current: number, dateStr: string) => {
    const diff = target - current;
    if (diff <= 0) return 0;
    const targetTime = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const monthsRemaining = Math.max(1, Math.round((targetTime - now) / (1000 * 60 * 60 * 24 * 30)));
    return Math.round(diff / monthsRemaining);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-emerald-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SmartPaisa Savings Goals & Achievability Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Savings Goals & Milestones
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Track verified actual deposits separately from planned contributions, monitor target achievability, and receive personalized AI savings strategies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[130px]">
              <span className="text-[11px] text-slate-300 font-medium block">Verified Saved</span>
              <p className="text-xl font-bold text-emerald-300">{formatINR(totalSaved)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[130px]">
              <span className="text-[11px] text-slate-300 font-medium block">Planned Buffer</span>
              <p className="text-xl font-bold text-amber-300">{formatINR(totalPlanned)}</p>
            </div>
            <Button
              variant="primary"
              onClick={openCreateModal}
              icon={<Plus className="w-4 h-4" />}
            >
              New Goal
            </Button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 relative z-10">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
            <span>Verified Aggregate Progress ({overallProgress}%)</span>
            <span>
              {formatINR(totalSaved)} Verified of {formatINR(totalTarget)} Target
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-800/80 overflow-hidden border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, overallProgress)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Active & Paused Goals Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-600" />
          <span>Savings Goals ({activeGoals.length})</span>
        </h2>

        {activeGoals.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/80 shadow-xs">
            <Coins className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No active goals yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Start by creating your first savings target, like a laptop, emergency buffer, or semester fees.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={openCreateModal}
              className="mt-4"
              icon={<Plus className="w-4 h-4" />}
            >
              Create Goal
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeGoals.map((goal) => {
              const progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
              const plannedAmt = Number(goal.planned_amount || 0);
              const monthlyPace = calculateMonthlyNeeded(goal.target_amount, goal.current_amount, goal.target_date);
              const isAchievable = monthlyPace <= monthlySavingsCapacity;
              const isPaused = goal.status === 'paused';
              const goalContribs = savingsContributions.filter((c) => c.goal_id === goal.id);

              return (
                <motion.div
                  key={goal.id}
                  whileHover={{ y: -3 }}
                  className={`bg-white rounded-2xl p-5 border shadow-xs flex flex-col justify-between hover:shadow-md transition-all ${
                    isPaused ? 'border-amber-200/80 opacity-85' : 'border-slate-200/80'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          {goal.category}
                        </span>
                        {isPaused && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Paused
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(goal)}
                          className="text-slate-400 hover:text-emerald-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Edit Goal"
                          aria-label={`Edit ${goal.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleTogglePause(goal)}
                          className="text-slate-400 hover:text-amber-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                          title={isPaused ? 'Resume Goal' : 'Pause Goal'}
                          aria-label={isPaused ? `Resume ${goal.name}` : `Pause ${goal.name}`}
                        >
                          {isPaused ? (
                            <PlayCircle className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <PauseCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteSavingsGoal(goal.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Delete Goal"
                          aria-label={`Delete ${goal.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{goal.name}</h3>

                    <div className="mt-3 flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-extrabold text-slate-900">
                          {formatINR(goal.current_amount)}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-semibold block">
                          Verified Saved
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 font-medium block">
                          Target: {formatINR(goal.target_amount)}
                        </span>
                        {plannedAmt > 0 && (
                          <span className="text-[11px] text-amber-600 font-semibold block">
                            +{formatINR(plannedAmt)} Planned (Unverified)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                        <div
                          style={{ width: `${progress}%` }}
                          className="h-full bg-emerald-500 transition-all duration-500"
                          title={`Verified: ${progress}%`}
                        />
                        {plannedAmt > 0 && (
                          <div
                            style={{
                              width: `${Math.min(
                                100 - progress,
                                Math.round((plannedAmt / goal.target_amount) * 100)
                              )}%`,
                            }}
                            className="h-full bg-amber-300"
                            title={`Planned: ${formatINR(plannedAmt)}`}
                          />
                        )}
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1 font-semibold">
                        <span>{progress}% verified</span>
                        <span>{formatINR(Math.max(0, goal.target_amount - goal.current_amount))} left</span>
                      </div>
                    </div>

                    {/* Achievability & AI Savings Suggestion */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            By{' '}
                            {new Date(goal.target_date).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isAchievable
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isAchievable ? '✓ Achievable Pace' : '⚡ Stretch Target'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Required: <strong>{formatINR(monthlyPace)}/month</strong> ( ~
                          {formatINR(Math.round(monthlyPace / 30))}/day)
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-600">
                        <strong className="text-slate-800">💡 AI Tip:</strong>{' '}
                        {isAchievable
                          ? `Auto-transfer ${formatINR(Math.round(monthlyPace / 4))}/week on Sundays to hit "${goal.name}" effortlessly.`
                          : `Extending your target date by 2 months reduces required monthly savings to ${formatINR(Math.round(monthlyPace * 0.7))}/mo.`}
                      </div>
                    </div>

                    {/* Planned Contributions awaiting verification */}
                    {goalContribs.some((c) => !c.is_verified) && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                          Planned Contributions (Click to Verify Deposit)
                        </span>
                        {goalContribs
                          .filter((c) => !c.is_verified)
                          .slice(0, 2)
                          .map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between text-[11px] bg-amber-50/70 px-2.5 py-1.5 rounded-lg border border-amber-200/70"
                            >
                              <span className="text-amber-900 font-medium truncate">
                                {formatINR(c.amount)} — {c.notes}
                              </span>
                              <button
                                type="button"
                                onClick={() => verifyPlannedContribution(c.id)}
                                className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-50 shrink-0 ml-2"
                              >
                                Verify ✓
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full justify-center"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    disabled={isPaused}
                    onClick={() => {
                      setActiveGoalId(goal.id);
                      setShowDepositModal(true);
                    }}
                  >
                    Record Deposit / Plan
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>Completed Goals ({completedGoals.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {completedGoals.map((g) => (
              <div
                key={g.id}
                className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex items-start justify-between"
              >
                <div>
                  <span className="text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full">
                    Completed
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">{g.name}</h4>
                  <p className="text-emerald-700 font-extrabold text-lg mt-1">
                    {formatINR(g.target_amount)}
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">Goal achieved successfully!</p>
                </div>
                <button
                  onClick={() => deleteSavingsGoal(g.id)}
                  className="text-slate-400 hover:text-rose-500 p-1"
                  title="Delete Goal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Goal */}
      <Modal
        isOpen={showAddGoalModal}
        onClose={() => {
          setShowAddGoalModal(false);
          setEditingGoal(null);
        }}
        title={editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
      >
        <form onSubmit={handleSaveGoal} className="space-y-4">
          <Input
            label="Goal Name"
            placeholder="e.g. Buy a Laptop, Emergency Buffer, Semester Trip"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            required
          />

          <Input
            label="Target Amount (₹ INR)"
            type="number"
            min="100"
            step="100"
            placeholder="e.g. 60000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />

          <Input
            label="Target Date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:outline-emerald-500"
            >
              <option value="Technology">Technology & Devices</option>
              <option value="Emergency">Emergency Fund</option>
              <option value="Education">Education & Courses</option>
              <option value="Travel">Travel & Events</option>
              <option value="Personal">Personal Milestone</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowAddGoalModal(false);
                setEditingGoal(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingGoal ? 'Save Changes' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Verified Deposit vs Planned Contribution */}
      <Modal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        title="Record Savings Contribution"
        description="Verified deposits update your actual saved balance; planned contributions are tracked separately until verified."
      >
        <form onSubmit={handleDeposit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setContributionType('verified_deposit')}
              className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2 ${
                contributionType === 'verified_deposit'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="block">Verified Deposit</span>
                <span className="text-[10px] font-normal opacity-80">Actual money transferred</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setContributionType('planned')}
              className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2 ${
                contributionType === 'planned'
                  ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="block">Planned Contribution</span>
                <span className="text-[10px] font-normal opacity-80">Scheduled future transfer</span>
              </div>
            </button>
          </div>

          <Input
            label="Contribution Amount (₹ INR)"
            type="number"
            min="10"
            step="10"
            placeholder="e.g. 2500"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            required
          />

          <Input
            label="Notes (Optional)"
            placeholder="e.g. Stipend transfer, Freelance payout"
            value={depositNotes}
            onChange={(e) => setDepositNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setShowDepositModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {contributionType === 'verified_deposit'
                ? 'Confirm Verified Deposit'
                : 'Save Planned Contribution'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
