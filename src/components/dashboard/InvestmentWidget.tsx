import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, Calendar, Plus, Eye, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { StatCard } from '../charts/StatCard';
import { Button } from '../ui/Button';
import API from '../../services/api';
import { Investment } from '../../types';
import { format, parseISO, addMonths } from 'date-fns';

export const InvestmentWidget: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totalInvested: 0,
    currentValue: 0,
    totalReturn: 0,
    averageROI: 0,
    maturingSoonCount: 0,
    topPerformer: null as Investment | null,
  });

  useEffect(() => {
    const fetchInvestmentSummary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch all active investments to calculate summary metrics
        const response = await API.investments.getInvestments({ status: 'active' });
        const activeInvestments = response.data.investments;

        const totalInvested = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0);
        const currentValue = activeInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
        const totalReturn = currentValue - totalInvested;
        const averageROI = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

        // Find top performer (investment with highest ROI)
        let topPerformer: Investment | null = null;
        let highestROI = -Infinity;
        
        activeInvestments.forEach(inv => {
          const investmentROI = ((inv.currentValue - inv.amount) / inv.amount) * 100;
          if (investmentROI > highestROI) {
            highestROI = investmentROI;
            topPerformer = inv;
          }
        });

        const today = new Date();
        const thirtyDaysFromNow = addMonths(today, 1); // Maturing in next month
        const maturingSoonCount = activeInvestments.filter(inv => {
          const maturityDate = parseISO(inv.maturityDate);
          return maturityDate >= today && maturityDate <= thirtyDaysFromNow;
        }).length;

        setSummary({
          totalInvested,
          currentValue,
          totalReturn,
          averageROI,
          maturingSoonCount,
          topPerformer,
        });
      } catch (err) {
        console.error('Failed to fetch investment summary:', err);
        setError('Failed to load investment data.');
        // Fallback to mock data or zero values on error
        setSummary({
          totalInvested: 0,
          currentValue: 0,
          totalReturn: 0,
          averageROI: 0,
          maturingSoonCount: 0,
          topPerformer: null,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestmentSummary();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-secondary-900">Investment Portfolio</h3>
        {summary.maturingSoonCount > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" /> {summary.maturingSoonCount} Maturing Soon
          </span>
        )}
      </div>

      {error && (
        <div className="text-red-600 text-sm mb-4">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 mb-4">
        <StatCard
          title="Total Portfolio Value"
          value={formatCurrency(summary.currentValue)}
          icon={Briefcase}
          iconColor="text-blue-600"
          loading={isLoading}
        />
        <StatCard
          title="Overall Growth"
          value={`${summary.averageROI.toFixed(2)}%`}
          change={summary.averageROI >= 0 ? 'Positive' : 'Negative'}
          changeType={summary.averageROI >= 0 ? 'positive' : 'negative'}
          icon={TrendingUp}
          iconColor={summary.averageROI >= 0 ? 'text-green-600' : 'text-red-600'}
          loading={isLoading}
        />
      </div>

      {/* Top Performer Section */}
      {summary.topPerformer && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center mb-1">
            <span className="text-xs font-medium text-blue-700">TOP PERFORMER</span>
            <span className="ml-auto text-xs text-blue-700">
              {((summary.topPerformer.currentValue - summary.topPerformer.amount) / summary.topPerformer.amount * 100).toFixed(1)}% ROI
            </span>
          </div>
          <div className="font-medium text-blue-900 truncate">{summary.topPerformer.name}</div>
        </div>
      )}

      <div className="flex justify-between gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/investments')}>
          <Eye className="h-4 w-4 mr-2" /> View Portfolio
        </Button>
        <Button size="sm" onClick={() => navigate('/admin/investments?action=add')}>
          <Plus className="h-4 w-4 mr-2" /> Add Investment
        </Button>
      </div>
    </Card>
  );
}
