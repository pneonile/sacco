import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  ClipboardList,
  Hourglass,
  Plus,
  Eye,
  AlertTriangle,
  BarChart3,
  Percent,
  Clock,
  Building,
  Edit,
  Trash,
  Tag,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatCard } from '../charts/StatCard';
import { Skeleton } from '../ui/Skeleton';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import API from '../../services/api';
import { LedgerEntry, LedgerCategory } from '../../types';

// Enums (should match backend models)
enum LedgerEntryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// Mock Data (for development fallback)
const mockCategories: LedgerCategory[] = [
  { id: 'cat1', name: 'Salaries', type: LedgerEntryType.EXPENSE, code: 'EXP001', is_active: true, display_order: 1, annual_budget: 120000000, monthly_budget: 10000000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat2', name: 'Rent', type: LedgerEntryType.EXPENSE, code: 'EXP002', is_active: true, display_order: 2, annual_budget: 24000000, monthly_budget: 2000000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat3', name: 'Utilities', type: LedgerEntryType.EXPENSE, code: 'EXP003', is_active: true, display_order: 3, annual_budget: 6000000, monthly_budget: 500000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat4', name: 'Loan Interest Income', type: LedgerEntryType.INCOME, code: 'INC001', is_active: true, display_order: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat5', name: 'Membership Fees', type: LedgerEntryType.INCOME, code: 'INC002', is_active: true, display_order: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat6', name: 'Stationery', type: LedgerEntryType.EXPENSE, code: 'EXP004', is_active: true, display_order: 4, annual_budget: 1200000, monthly_budget: 100000, createdAt: new Date(), updatedAt: new Date() },
];

const mockLedgerEntries: LedgerEntry[] = [
  {
    id: 'le1', type: LedgerEntryType.EXPENSE, category_id: 'cat1', amount: 10000000, description: 'June Salaries', transaction_date: '2025-06-20',
    reference: 'SAL-JUN-25', payment_method: 'bank', is_paid: true, payment_date: '2025-06-20', approval_status: ApprovalStatus.APPROVED,
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'le2', type: LedgerEntryType.EXPENSE, category_id: 'cat2', amount: 2000000, description: 'July Office Rent', transaction_date: '2025-07-01',
    reference: 'RENT-JUL-25', payment_method: 'electronic_transfer', is_paid: false, approval_status: ApprovalStatus.PENDING,
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'le3', type: LedgerEntryType.INCOME, category_id: 'cat4', amount: 5000000, description: 'Loan Interest Collection - Q2', transaction_date: '2025-06-30',
    reference: 'INC-Q2-25', payment_method: 'bank', is_paid: true, payment_date: '2025-06-30', approval_status: ApprovalStatus.APPROVED,
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'le4', type: LedgerEntryType.EXPENSE, category_id: 'cat3', amount: 550000, description: 'June Electricity Bill', transaction_date: '2025-06-15',
    reference: 'UTIL-JUN-25', payment_method: 'mobile_money', is_paid: true, payment_date: '2025-06-15', approval_status: ApprovalStatus.APPROVED,
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'le5', type: LedgerEntryType.INCOME, category_id: 'cat5', amount: 1500000, description: 'New Member Registration Fees', transaction_date: '2025-06-25',
    reference: 'MEM-REG-JUN', payment_method: 'cash', is_paid: true, payment_date: '2025-06-25', approval_status: ApprovalStatus.APPROVED,
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'le6', type: LedgerEntryType.EXPENSE, category_id: 'cat6', amount: 120000, description: 'Office Stationery Purchase', transaction_date: '2025-06-10',
    reference: 'STAT-JUN-25', payment_method: 'cash', is_paid: true, payment_date: '2025-06-10', approval_status: ApprovalStatus.APPROVED,
    createdAt: new Date(), updatedAt: new Date()
  },
];


export const FinancialOverviewWidget: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [categories, setCategories] = useState<LedgerCategory[]>([]);

  const currentMonth = useMemo(() => new Date(), []);
  const startOfCurrentMonth = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const endOfCurrentMonth = useMemo(() => endOfMonth(currentMonth), [currentMonth]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const categoriesResponse = await API.accounting.getLedgerCategories();
        setCategories(categoriesResponse.data.categories);

        const entriesResponse = await API.accounting.getLedgerEntries({
          fromDate: format(startOfCurrentMonth, 'yyyy-MM-dd'),
          toDate: format(endOfCurrentMonth, 'yyyy-MM-dd'),
        });
        setLedgerEntries(entriesResponse.data.ledgerEntries);
      } catch (err) {
        console.error('Failed to fetch financial data:', err);
        setError('Failed to load financial data.');
        setLedgerEntries(mockLedgerEntries);
        setCategories(mockCategories);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [startOfCurrentMonth, endOfCurrentMonth]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  const currentMonthSummary = useMemo(() => {
    const income = ledgerEntries
      .filter(e => e.type === LedgerEntryType.INCOME)
      .reduce((sum, e) => sum + e.amount, 0);
    const expenses = ledgerEntries
      .filter(e => e.type === LedgerEntryType.EXPENSE)
      .reduce((sum, e) => sum + e.amount, 0);
    const profitLoss = income - expenses;
    const pendingApprovals = ledgerEntries.filter(e => e.approval_status === ApprovalStatus.PENDING).length;

    return { income, expenses, profitLoss, pendingApprovals };
  }, [ledgerEntries]);

  const topExpenseCategories = useMemo(() => {
    const expenseByCategory: Record<string, number> = {};
    ledgerEntries
      .filter(e => e.type === LedgerEntryType.EXPENSE)
      .forEach(entry => {
        const categoryName = getCategoryName(entry.category_id);
        expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + entry.amount;
      });

    return Object.entries(expenseByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [ledgerEntries, categories]);

  const budgetVsActual = useMemo(() => {
    const actualExpensesByCategory: Record<string, number> = {};
    ledgerEntries
      .filter(e => e.type === LedgerEntryType.EXPENSE)
      .forEach(entry => {
        actualExpensesByCategory[entry.category_id] = (actualExpensesByCategory[entry.category_id] || 0) + entry.amount;
      });

    return categories
      .filter(c => c.type === LedgerEntryType.EXPENSE && c.monthly_budget)
      .map(category => {
        const actual = actualExpensesByCategory[category.id] || 0;
        const budget = category.monthly_budget || 0;
        const utilization = budget > 0 ? (actual / budget) * 100 : 0;
        return {
          categoryName: category.name,
          budget,
          actual,
          utilization,
          overBudget: actual > budget,
        };
      })
      .sort((a, b) => b.actual - a.actual);
  }, [ledgerEntries, categories]);

  const monthlyTrendData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(currentMonth, i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthlyEntries = ledgerEntries.filter(entry => {
        const entryDate = parseISO(entry.transaction_date);
        return entryDate >= monthStart && entryDate <= monthEnd;
      });

      const income = monthlyEntries.filter(e => e.type === LedgerEntryType.INCOME).reduce((sum, e) => sum + e.amount, 0);
      const expense = monthlyEntries.filter(e => e.type === LedgerEntryType.EXPENSE).reduce((sum, e) => sum + e.amount, 0);

      data.push({
        name: format(month, 'MMM'),
        Income: income,
        Expenses: expense,
      });
    }
    return data;
  }, [ledgerEntries, currentMonth]);

  return (
    <Card className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-secondary-900">Financial Overview</h3>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/income-expense')}>
          <Eye className="h-4 w-4 mr-2" /> View All
        </Button>
      </div>

      {error && (
        <div className="text-red-600 text-sm mb-4 flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" /> {error}
        </div>
      )}

      {/* Current Month Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <StatCard
          title="Current Month Income"
          value={isLoading ? <Skeleton height={24} width={80} /> : formatCurrency(currentMonthSummary.income)}
          icon={ArrowUpCircle}
          iconColor="text-green-600"
          loading={isLoading}
        />
        <StatCard
          title="Current Month Expenses"
          value={isLoading ? <Skeleton height={24} width={80} /> : formatCurrency(currentMonthSummary.expenses)}
          icon={ArrowDownCircle}
          iconColor="text-red-600"
          loading={isLoading}
        />
        <StatCard
          title="Net Profit/Loss"
          value={isLoading ? <Skeleton height={24} width={80} /> : formatCurrency(currentMonthSummary.profitLoss)}
          changeType={currentMonthSummary.profitLoss >= 0 ? 'positive' : 'negative'}
          icon={Wallet}
          iconColor={currentMonthSummary.profitLoss >= 0 ? 'text-blue-600' : 'text-orange-600'}
          loading={isLoading}
        />
      </div>

      {/* Pending Approvals */}
      {currentMonthSummary.pendingApprovals > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <Hourglass className="h-5 w-5 text-yellow-600 mr-3" />
            <p className="text-sm font-medium text-yellow-800">
              {currentMonthSummary.pendingApprovals} entries pending approval.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate('/admin/income-expense?filter=pending')}>
            Review
          </Button>
        </div>
      )}

      {/* Monthly Trend Mini Chart */}
      <h4 className="text-md font-semibold text-secondary-800 mb-3">Monthly Financial Trend</h4>
      <div className="h-32 mb-4">
        {isLoading ? (
          <Skeleton height="100%" width="100%" />
        ) : (
          <div className="w-full h-full">
            {/* Simple bar chart representation */}
            <div className="flex h-full items-end justify-around">
              {monthlyTrendData.map((dataPoint, index) => (
                <div key={index} className="flex flex-col items-center h-full justify-end mx-1">
                  <div
                    className="w-4 rounded-t-sm bg-green-500"
                    style={{ height: `${(dataPoint.Income / Math.max(...monthlyTrendData.map(d => d.Income + d.Expenses), 1)) * 100}%` }}
                    title={`Income: ${formatCurrency(dataPoint.Income)}`}
                  ></div>
                  <div
                    className="w-4 rounded-b-sm bg-red-500"
                    style={{ height: `${(dataPoint.Expenses / Math.max(...monthlyTrendData.map(d => d.Income + d.Expenses), 1)) * 100}%` }}
                    title={`Expenses: ${formatCurrency(dataPoint.Expenses)}`}
                  ></div>
                  <span className="text-xs text-secondary-500 mt-1">{dataPoint.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Budget vs Actual */}
      <h4 className="text-md font-semibold text-secondary-800 mb-3">Budget vs Actual</h4>
      <div className="space-y-3 mb-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <Skeleton height={16} width={120} />
                <Skeleton height={16} width={80} />
              </div>
              <Skeleton height={8} width="100%" />
            </div>
          ))
        ) : budgetVsActual.length === 0 ? (
          <p className="text-sm text-secondary-500 text-center">No budget data available.</p>
        ) : (
          budgetVsActual.slice(0, 3).map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-secondary-800">{item.categoryName}</span>
                  {item.overBudget && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-sm">
                      Over Budget
                    </span>
                  )}
                </div>
                <span className="text-xs text-secondary-600">
                  {formatCurrency(item.actual)} / {formatCurrency(item.budget)}
                </span>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    item.utilization > 100 ? 'bg-red-600' :
                    item.utilization > 85 ? 'bg-yellow-500' :
                    'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(item.utilization, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-xs text-secondary-500">
                <span>{item.utilization.toFixed(1)}% used</span>
                <span>{item.overBudget ? `${formatCurrency(item.actual - item.budget)} over` : `${formatCurrency(item.budget - item.actual)} remaining`}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Top Expense Categories */}
      <h4 className="text-md font-semibold text-secondary-800 mb-3">Top Expense Categories</h4>
      <div className="space-y-2 mb-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton height={16} width={120} />
              <Skeleton height={16} width={80} />
            </div>
          ))
        ) : topExpenseCategories.length === 0 ? (
          <p className="text-sm text-secondary-500 text-center">No expense data available.</p>
        ) : (
          topExpenseCategories.slice(0, 3).map((category, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-secondary-800">{category.name}</span>
              <span className="text-sm font-medium text-secondary-900">{formatCurrency(category.value)}</span>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-auto pt-4 border-t border-secondary-200">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => navigate('/admin/income-expense?action=add')}>
            <Plus className="h-4 w-4 mr-1" /> Add Entry
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/admin/reports?type=financial')}>
            <FileText className="h-4 w-4 mr-1" /> View Reports
          </Button>
          {currentMonthSummary.pendingApprovals > 0 && (
            <Button size="sm" variant="outline" onClick={() => navigate('/admin/income-expense?filter=pending')}>
              <CheckCircle className="h-4 w-4 mr-1" /> Approve Pending
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
