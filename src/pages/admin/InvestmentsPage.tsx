import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Briefcase, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  BarChart3, 
  Percent, 
  Clock, 
  Building, 
  Edit, 
  Trash, 
  Eye, 
  Tag,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/charts/StatCard';
import { AreaChart } from '../../components/charts/AreaChart';
import { Skeleton } from '../../components/ui/Skeleton';
import { format, parseISO, differenceInDays, addMonths } from 'date-fns';
import API from '../../services/api';
import { Investment, InvestmentType } from '../../types';

// Pie chart component for investment breakdown
const PieChart: React.FC<{ data: { name: string; value: number; color: string }[] }> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;
  
  return (
    <div className="relative h-64 w-64 mx-auto">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {data.map((item, i) => {
          const percent = total > 0 ? (item.value / total) * 100 : 0;
          const startPercent = cumulativePercent;
          cumulativePercent += percent;
          
          // SVG arc path calculation
          const startX = 50 + 40 * Math.cos(2 * Math.PI * startPercent / 100);
          const startY = 50 + 40 * Math.sin(2 * Math.PI * startPercent / 100);
          const endX = 50 + 40 * Math.cos(2 * Math.PI * cumulativePercent / 100);
          const endY = 50 + 40 * Math.sin(2 * Math.PI * cumulativePercent / 100);
          
          const largeArcFlag = percent > 50 ? 1 : 0;
          
          const pathData = [
            `M 50 50`,
            `L ${startX} ${startY}`,
            `A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `Z`
          ].join(' ');
          
          return (
            <path 
              key={i} 
              d={pathData} 
              fill={item.color}
              stroke="#fff"
              strokeWidth="0.5"
            />
          );
        })}
        <circle cx="50" cy="50" r="25" fill="white" />
      </svg>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold">{total.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
      </div>
    </div>
  );
};

// Legend component for the pie chart
const ChartLegend: React.FC<{ data: { name: string; value: number; color: string }[] }> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="grid grid-cols-1 gap-2 mt-4">
      {data.map((item, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
            <span className="text-sm font-medium">{item.name}</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">{item.value.toLocaleString()}</span>
            <span className="text-xs text-gray-500">({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Investment form interface
interface InvestmentFormData {
  id?: string;
  name: string;
  type: InvestmentType;
  amount: string;
  interestRate: string;
  maturityDate: string;
  currentValue: string;
  purchaseDate: string;
  institutionName?: string;
  institutionContact?: string;
  interestPaymentSchedule?: string;
}

// Investment type options with colors for charts
const investmentTypeOptions = [
  { value: 'fixed_deposit', label: 'Fixed Deposit', color: '#3b82f6' },
  { value: 'government_bonds', label: 'Government Bonds', color: '#10b981' },
  { value: 'treasury_bills', label: 'Treasury Bills', color: '#f59e0b' },
  { value: 'real_estate', label: 'Real Estate', color: '#ef4444' },
  { value: 'equity', label: 'Equity', color: '#8b5cf6' },
  { value: 'other', label: 'Other', color: '#6b7280' },
];

// Interest payment schedule options
const interestScheduleOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'biannual', label: 'Bi-Annual' },
  { value: 'annual', label: 'Annual' },
  { value: 'maturity', label: 'At Maturity' },
];

export const InvestmentsPage: React.FC = () => {
  // State for investments data
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for summary data
  const [summaryData, setSummaryData] = useState({
    totalInvested: 0,
    currentValue: 0,
    totalReturn: 0,
    averageROI: 0,
    maturingSoon: 0,
  });
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('maturityDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // State for modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  
  // State for investment form
  const [investmentForm, setInvestmentForm] = useState<InvestmentFormData>({
    name: '',
    type: InvestmentType.FIXED_DEPOSIT,
    amount: '',
    interestRate: '',
    maturityDate: '',
    currentValue: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    institutionName: '',
    institutionContact: '',
    interestPaymentSchedule: 'maturity',
  });
  
  // State for sell form
  const [sellForm, setSellForm] = useState({
    saleValue: '',
    saleDate: new Date().toISOString().split('T')[0],
  });
  
  // Fetch investments data
  useEffect(() => {
    const fetchInvestments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use API service to fetch investments
        const response = await API.investments.getInvestments({
          type: typeFilter !== 'all' ? typeFilter as InvestmentType : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          sortBy,
          sortDirection,
          search: searchTerm,
        });
        
        setInvestments(response.data.investments);
        
        // Calculate summary data
        const totalInvested = response.data.investments.reduce((sum, inv) => sum + inv.amount, 0);
        const currentValue = response.data.investments.reduce((sum, inv) => sum + inv.currentValue, 0);
        const totalReturn = currentValue - totalInvested;
        const averageROI = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
        
        // Count investments maturing in the next 30 days
        const today = new Date();
        const thirtyDaysFromNow = addMonths(today, 1);
        const maturingSoon = response.data.investments.filter(inv => {
          const maturityDate = parseISO(inv.maturityDate);
          return inv.status === 'active' && 
                 maturityDate >= today && 
                 maturityDate <= thirtyDaysFromNow;
        }).length;
        
        setSummaryData({
          totalInvested,
          currentValue,
          totalReturn,
          averageROI,
          maturingSoon,
        });
      } catch (err) {
        console.error('Error fetching investments:', err);
        setError('Failed to load investments. Please try again later.');
        
        // For demo purposes, use mock data if API fails
        const mockInvestments = [
          {
            id: '1',
            name: 'Government Bond Series A',
            type: InvestmentType.GOVERNMENT_BONDS,
            amount: 50000000,
            interestRate: 16.5,
            maturityDate: '2026-12-31',
            currentValue: 58750000,
            status: 'active',
            purchaseDate: '2023-01-15',
            institutionName: 'Bank of Uganda',
            institutionContact: '+256-414-258-441',
            interestPaymentSchedule: 'annual',
            interestEarned: 8750000,
            interestPaid: 8250000,
          },
          {
            id: '2',
            name: 'Treasury Bills 91-day',
            type: InvestmentType.TREASURY_BILLS,
            amount: 20000000,
            interestRate: 12.0,
            maturityDate: '2025-09-15',
            currentValue: 20600000,
            status: 'active',
            purchaseDate: '2025-06-15',
            institutionName: 'Bank of Uganda',
            institutionContact: '+256-414-258-441',
            interestPaymentSchedule: 'maturity',
            interestEarned: 600000,
            interestPaid: 0,
          },
          {
            id: '3',
            name: 'Commercial Property - Kawempe Plaza',
            type: InvestmentType.REAL_ESTATE,
            amount: 120000000,
            interestRate: 8.0,
            maturityDate: '2029-12-31',
            currentValue: 135000000,
            status: 'active',
            purchaseDate: '2022-06-01',
            institutionName: 'Kampala Properties Ltd',
            institutionContact: '+256-782-123-456',
            interestPaymentSchedule: 'monthly',
            interestEarned: 19200000,
            interestPaid: 19200000,
          },
          {
            id: '4',
            name: 'Fixed Deposit - Stanbic Bank',
            type: InvestmentType.FIXED_DEPOSIT,
            amount: 35000000,
            interestRate: 10.5,
            maturityDate: '2025-07-21',
            currentValue: 38675000,
            status: 'active',
            purchaseDate: '2024-07-21',
            institutionName: 'Stanbic Bank Uganda',
            institutionContact: '+256-312-224-400',
            interestPaymentSchedule: 'quarterly',
            interestEarned: 3675000,
            interestPaid: 3675000,
          },
          {
            id: '5',
            name: 'MTN Uganda Shares',
            type: InvestmentType.EQUITY,
            amount: 15000000,
            interestRate: 5.0,
            maturityDate: '2030-12-31',
            currentValue: 17250000,
            status: 'active',
            purchaseDate: '2023-05-10',
            institutionName: 'Uganda Securities Exchange',
            institutionContact: '+256-414-342-818',
            interestPaymentSchedule: 'biannual',
            interestEarned: 2250000,
            interestPaid: 1500000,
          }
        ];
        
        setInvestments(mockInvestments);
        
        // Calculate summary data from mock data
        const totalInvested = mockInvestments.reduce((sum, inv) => sum + inv.amount, 0);
        const currentValue = mockInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
        const totalReturn = currentValue - totalInvested;
        const averageROI = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
        
        // Count investments maturing in the next 30 days
        const today = new Date();
        const thirtyDaysFromNow = addMonths(today, 1);
        const maturingSoon = mockInvestments.filter(inv => {
          const maturityDate = parseISO(inv.maturityDate);
          return inv.status === 'active' && 
                 maturityDate >= today && 
                 maturityDate <= thirtyDaysFromNow;
        }).length;
        
        setSummaryData({
          totalInvested,
          currentValue,
          totalReturn,
          averageROI,
          maturingSoon,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvestments();
  }, [typeFilter, statusFilter, sortBy, sortDirection, searchTerm]);
  
  // Filter investments based on search term
  const filteredInvestments = useMemo(() => {
    if (!searchTerm) return investments;
    
    return investments.filter(investment => 
      investment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investment.institutionName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [investments, searchTerm]);
  
  // Format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  // Get investment type label and color
  const getInvestmentTypeInfo = (type: string) => {
    const option = investmentTypeOptions.find(opt => opt.value === type);
    return option || { value: type, label: type, color: '#6b7280' };
  };
  
  // Get days to maturity
  const getDaysToMaturity = (maturityDate: string) => {
    const today = new Date();
    const maturity = parseISO(maturityDate);
    return differenceInDays(maturity, today);
  };
  
  // Get ROI (Return on Investment)
  const getROI = (investment: Investment) => {
    const totalReturn = (investment.currentValue - investment.amount) + (investment.interestPaid || 0);
    return investment.amount > 0 ? (totalReturn / investment.amount) * 100 : 0;
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInvestmentForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle sell form input changes
  const handleSellInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSellForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Reset form to default values
  const resetForm = () => {
    setInvestmentForm({
      name: '',
      type: InvestmentType.FIXED_DEPOSIT,
      amount: '',
      interestRate: '',
      maturityDate: '',
      currentValue: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      institutionName: '',
      institutionContact: '',
      interestPaymentSchedule: 'maturity',
    });
  };
  
  // Open edit modal with investment data
  const openEditModal = (investment: Investment) => {
    setSelectedInvestment(investment);
    setInvestmentForm({
      id: investment.id,
      name: investment.name,
      type: investment.type,
      amount: investment.amount.toString(),
      interestRate: investment.interestRate.toString(),
      maturityDate: investment.maturityDate,
      currentValue: investment.currentValue.toString(),
      purchaseDate: investment.purchaseDate,
      institutionName: investment.institutionName || '',
      institutionContact: investment.institutionContact || '',
      interestPaymentSchedule: investment.interestPaymentSchedule || 'maturity',
    });
    setShowEditModal(true);
  };
  
  // Open sell modal with investment data
  const openSellModal = (investment: Investment) => {
    setSelectedInvestment(investment);
    setSellForm({
      saleValue: investment.currentValue.toString(),
      saleDate: new Date().toISOString().split('T')[0],
    });
    setShowSellModal(true);
  };
  
  // Open view modal with investment data
  const openViewModal = (investment: Investment) => {
    setSelectedInvestment(investment);
    setShowViewModal(true);
  };
  
  // Handle add investment form submission
  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const newInvestment = {
        name: investmentForm.name,
        type: investmentForm.type,
        amount: parseFloat(investmentForm.amount),
        interestRate: parseFloat(investmentForm.interestRate),
        maturityDate: investmentForm.maturityDate,
        currentValue: parseFloat(investmentForm.currentValue || investmentForm.amount),
        purchaseDate: investmentForm.purchaseDate,
        institutionName: investmentForm.institutionName,
        institutionContact: investmentForm.institutionContact,
        interestPaymentSchedule: investmentForm.interestPaymentSchedule,
        status: 'active',
      };
      
      // Call API to add investment
      const response = await API.investments.createInvestment(newInvestment);
      
      // Update investments list with new investment
      setInvestments(prev => [response.data, ...prev]);
      
      // Update summary data
      setSummaryData(prev => ({
        ...prev,
        totalInvested: prev.totalInvested + parseFloat(investmentForm.amount),
        currentValue: prev.currentValue + parseFloat(investmentForm.currentValue || investmentForm.amount),
      }));
      
      // Close modal and reset form
      setShowAddModal(false);
      resetForm();
      
    } catch (err) {
      console.error('Error adding investment:', err);
      setError('Failed to add investment. Please try again.');
      
      // For demo purposes, add to local state anyway
      const newId = `temp-${Date.now()}`;
      const newInvestment = {
        id: newId,
        name: investmentForm.name,
        type: investmentForm.type,
        amount: parseFloat(investmentForm.amount),
        interestRate: parseFloat(investmentForm.interestRate),
        maturityDate: investmentForm.maturityDate,
        currentValue: parseFloat(investmentForm.currentValue || investmentForm.amount),
        purchaseDate: investmentForm.purchaseDate,
        institutionName: investmentForm.institutionName,
        institutionContact: investmentForm.institutionContact,
        interestPaymentSchedule: investmentForm.interestPaymentSchedule,
        status: 'active',
      };
      
      // Update investments list with new investment
      setInvestments(prev => [newInvestment as Investment, ...prev]);
      
      // Close modal and reset form
      setShowAddModal(false);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle edit investment form submission
  const handleEditInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestment) return;
    
    setIsLoading(true);
    
    try {
      const updatedInvestment = {
        id: selectedInvestment.id,
        name: investmentForm.name,
        type: investmentForm.type,
        amount: parseFloat(investmentForm.amount),
        interestRate: parseFloat(investmentForm.interestRate),
        maturityDate: investmentForm.maturityDate,
        currentValue: parseFloat(investmentForm.currentValue),
        purchaseDate: investmentForm.purchaseDate,
        institutionName: investmentForm.institutionName,
        institutionContact: investmentForm.institutionContact,
        interestPaymentSchedule: investmentForm.interestPaymentSchedule,
      };
      
      // Call API to update investment
      const response = await API.investments.updateInvestment(selectedInvestment.id, updatedInvestment);
      
      // Update investments list with updated investment
      setInvestments(prev => prev.map(inv => 
        inv.id === selectedInvestment.id ? response.data : inv
      ));
      
      // Close modal
      setShowEditModal(false);
      setSelectedInvestment(null);
      
    } catch (err) {
      console.error('Error updating investment:', err);
      setError('Failed to update investment. Please try again.');
      
      // For demo purposes, update local state anyway
      const updatedInvestment = {
        ...selectedInvestment,
        name: investmentForm.name,
        type: investmentForm.type,
        amount: parseFloat(investmentForm.amount),
        interestRate: parseFloat(investmentForm.interestRate),
        maturityDate: investmentForm.maturityDate,
        currentValue: parseFloat(investmentForm.currentValue),
        purchaseDate: investmentForm.purchaseDate,
        institutionName: investmentForm.institutionName,
        institutionContact: investmentForm.institutionContact,
        interestPaymentSchedule: investmentForm.interestPaymentSchedule,
      };
      
      // Update investments list with updated investment
      setInvestments(prev => prev.map(inv => 
        inv.id === selectedInvestment.id ? updatedInvestment as Investment : inv
      ));
      
      // Close modal
      setShowEditModal(false);
      setSelectedInvestment(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle sell investment form submission
  const handleSellInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestment) return;
    
    setIsLoading(true);
    
    try {
      const saleValue = parseFloat(sellForm.saleValue);
      
      // Call API to sell investment
      const response = await API.investments.sellInvestment(
        selectedInvestment.id, 
        { saleValue, saleDate: sellForm.saleDate }
      );
      
      // Update investments list with sold investment
      setInvestments(prev => prev.map(inv => 
        inv.id === selectedInvestment.id ? { ...inv, status: 'sold', saleValue, saleDate: sellForm.saleDate } : inv
      ));
      
      // Close modal
      setShowSellModal(false);
      setSelectedInvestment(null);
      
    } catch (err) {
      console.error('Error selling investment:', err);
      setError('Failed to sell investment. Please try again.');
      
      // For demo purposes, update local state anyway
      setInvestments(prev => prev.map(inv => 
        inv.id === selectedInvestment.id ? { 
          ...inv, 
          status: 'sold', 
          saleValue: parseFloat(sellForm.saleValue), 
          saleDate: sellForm.saleDate 
        } : inv
      ));
      
      // Close modal
      setShowSellModal(false);
      setSelectedInvestment(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle export to CSV
  const handleExport = () => {
    const csvContent = [
      ['Name', 'Type', 'Institution', 'Amount', 'Current Value', 'Interest Rate', 'Purchase Date', 'Maturity Date', 'Status', 'ROI'],
      ...filteredInvestments.map(inv => [
        `"${inv.name}"`,
        getInvestmentTypeInfo(inv.type).label,
        `"${inv.institutionName || ''}"`,
        inv.amount.toString(),
        inv.currentValue.toString(),
        `${inv.interestRate}%`,
        inv.purchaseDate,
        inv.maturityDate,
        inv.status,
        `${getROI(inv).toFixed(2)}%`
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investments-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  // Prepare data for investment type breakdown chart
  const investmentTypeData = useMemo(() => {
    const typeBreakdown: Record<string, number> = {};
    
    investments.forEach(inv => {
      if (inv.status === 'active') {
        if (!typeBreakdown[inv.type]) {
          typeBreakdown[inv.type] = 0;
        }
        typeBreakdown[inv.type] += inv.amount;
      }
    });
    
    return Object.entries(typeBreakdown).map(([type, value]) => {
      const typeInfo = getInvestmentTypeInfo(type);
      return {
        name: typeInfo.label,
        value,
        color: typeInfo.color
      };
    });
  }, [investments]);
  
  // Prepare monthly returns data for chart
  const monthlyReturnsData = useMemo(() => {
    // Generate last 6 months
    const months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        name: format(month, 'MMM'),
        value: 0
      });
    }
    
    // This would normally come from the API with real data
    // For demo purposes, we'll use mock data
    return [
      { name: 'Jan', value: 1200000 },
      { name: 'Feb', value: 1350000 },
      { name: 'Mar', value: 1500000 },
      { name: 'Apr', value: 1400000 },
      { name: 'May', value: 1650000 },
      { name: 'Jun', value: 1800000 },
    ];
  }, []);
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Investment Portfolio Management</h1>
        <p className="text-secondary-600 mt-1">
          Track and manage SACCO investments, returns, and maturity schedules
        </p>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <StatCard
          title="Total Invested"
          value={formatCurrency(summaryData.totalInvested)}
          icon={Briefcase}
          iconColor="text-blue-600"
          loading={isLoading}
        />
        
        <StatCard
          title="Current Value"
          value={formatCurrency(summaryData.currentValue)}
          change={`${summaryData.totalInvested > 0 ? ((summaryData.currentValue / summaryData.totalInvested - 1) * 100).toFixed(1) : 0}% from initial investment`}
          changeType="positive"
          icon={TrendingUp}
          iconColor="text-green-600"
          loading={isLoading}
        />
        
        <StatCard
          title="Total Return"
          value={formatCurrency(summaryData.totalReturn)}
          icon={DollarSign}
          iconColor="text-purple-600"
          loading={isLoading}
        />
        
        <StatCard
          title="Average ROI"
          value={`${summaryData.averageROI.toFixed(2)}%`}
          icon={Percent}
          iconColor="text-orange-600"
          loading={isLoading}
        />
        
        <StatCard
          title="Maturing Soon"
          value={summaryData.maturingSoon.toString()}
          description="Investments maturing in 30 days"
          icon={Calendar}
          iconColor={summaryData.maturingSoon > 0 ? "text-yellow-600" : "text-gray-600"}
          loading={isLoading}
        />
      </div>
      
      {/* Filters and Actions */}
      <Card className="mb-6">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search investments by name or institution..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
                {investmentTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="matured">Matured</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />Export
              </Button>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />Add Investment
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 border-t border-secondary-200 pt-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-secondary-500" />
              <label className="text-sm font-medium text-secondary-700">Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="maturityDate">Maturity Date</option>
                <option value="purchaseDate">Purchase Date</option>
                <option value="amount">Amount</option>
                <option value="currentValue">Current Value</option>
                <option value="name">Name</option>
              </select>
              
              <select
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Investments Table */}
      <Card className="mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Investment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Current Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Maturity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton height={40} width={150} /></td>
                    <td className="px-6 py-4"><Skeleton height={40} width={120} /></td>
                    <td className="px-6 py-4"><Skeleton height={40} width={100} /></td>
                    <td className="px-6 py-4"><Skeleton height={40} width={100} /></td>
                    <td className="px-6 py-4"><Skeleton height={40} width={120} /></td>
                    <td className="px-6 py-4"><Skeleton height={40} width={80} /></td>
                    <td className="px-6 py-4"><Skeleton height={40} width={100} /></td>
                  </tr>
                ))
              ) : filteredInvestments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-secondary-500">
                    No investments found. Add your first investment to get started.
                  </td>
                </tr>
              ) : (
                filteredInvestments.map((investment) => {
                  const typeInfo = getInvestmentTypeInfo(investment.type);
                  const daysToMaturity = getDaysToMaturity(investment.maturityDate);
                  const roi = getROI(investment);
                  
                  return (
                    <tr key={investment.id} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-secondary-900">{investment.name}</p>
                          <p className="text-sm text-secondary-500">
                            {investment.institutionName || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span 
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
                            style={{ 
                              backgroundColor: `${typeInfo.color}20`, 
                              color: typeInfo.color 
                            }}
                          >
                            {typeInfo.label}
                          </span>
                          <p className="text-sm text-secondary-600 mt-1">{investment.interestRate}% interest</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-secondary-900">{formatCurrency(investment.amount)}</p>
                        <p className="text-sm text-secondary-600">
                          {format(parseISO(investment.purchaseDate), 'MMM d, yyyy')}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-secondary-900">{formatCurrency(investment.currentValue)}</p>
                        <p className={`text-sm ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {roi >= 0 ? '+' : ''}{roi.toFixed(2)}% ROI
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-secondary-900">
                          {format(parseISO(investment.maturityDate), 'MMM d, yyyy')}
                        </p>
                        {investment.status === 'active' && (
                          <p className={`text-sm ${
                            daysToMaturity <= 30 ? 'text-yellow-600' : 
                            daysToMaturity <= 90 ? 'text-blue-600' : 'text-secondary-600'
                          }`}>
                            {daysToMaturity} days remaining
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          investment.status === 'active' ? 'bg-green-100 text-green-800' :
                          investment.status === 'matured' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {investment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openViewModal(investment)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {investment.status === 'active' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => openEditModal(investment)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <Button size="sm" variant="danger" onClick={() => openSellModal(investment)}>
                                <Tag className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Monthly Returns Chart */}
        <Card className="lg:col-span-2">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Monthly Investment Returns</h3>
            <AreaChart
              data={monthlyReturnsData}
              dataKey="value"
              color="#22c55e"
              title="Monthly Returns"
            />
          </div>
        </Card>
        
        {/* Investment Type Breakdown */}
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Investment Type Breakdown</h3>
            <PieChart data={investmentTypeData} />
            <ChartLegend data={investmentTypeData} />
          </div>
        </Card>
      </div>
      
      {/* Maturing Investments Section */}
      <Card className="mb-6">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            <Clock className="h-5 w-5 inline-block mr-2 text-yellow-600" />
            Investments Maturing Soon
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Investment</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Current Value</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Maturity Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Days Left</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2"><Skeleton height={24} width={120} /></td>
                      <td className="px-4 py-2"><Skeleton height={24} width={100} /></td>
                      <td className="px-4 py-2"><Skeleton height={24} width={80} /></td>
                      <td className="px-4 py-2"><Skeleton height={24} width={80} /></td>
                      <td className="px-4 py-2"><Skeleton height={24} width={100} /></td>
                      <td className="px-4 py-2"><Skeleton height={24} width={60} /></td>
                    </tr>
                  ))
                ) : (
                  investments
                    .filter(inv => {
                      const daysLeft = getDaysToMaturity(inv.maturityDate);
                      return inv.status === 'active' && daysLeft >= 0 && daysLeft <= 90;
                    })
                    .sort((a, b) => getDaysToMaturity(a.maturityDate) - getDaysToMaturity(b.maturityDate))
                    .slice(0, 5)
                    .map(inv => {
                      const daysLeft = getDaysToMaturity(inv.maturityDate);
                      const typeInfo = getInvestmentTypeInfo(inv.type);
                      
                      return (
                        <tr key={inv.id} className="hover:bg-secondary-50">
                          <td className="px-4 py-2 whitespace-nowrap font-medium">{inv.name}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span 
                              className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
                              style={{ 
                                backgroundColor: `${typeInfo.color}20`, 
                                color: typeInfo.color 
                              }}
                            >
                              {typeInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(inv.amount)}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(inv.currentValue)}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {format(parseISO(inv.maturityDate), 'MMM d, yyyy')}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                              daysLeft <= 30 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {daysLeft} days
                            </span>
                          </td>
                        </tr>
                      );
                    })
                )}
                
                {!isLoading && investments.filter(inv => {
                  const daysLeft = getDaysToMaturity(inv.maturityDate);
                  return inv.status === 'active' && daysLeft >= 0 && daysLeft <= 90;
                }).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-2 text-center text-secondary-500">
                      No investments maturing in the next 90 days.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
      
      {/* Add Investment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-screen overflow-y-auto">
            <form onSubmit={handleAddInvestment}>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Add New Investment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Investment Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={investmentForm.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Government Bond Series A"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Investment Type *</label>
                    <select
                      name="type"
                      value={investmentForm.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      {investmentTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Amount (UGX) *</label>
                    <input
                      type="number"
                      name="amount"
                      value={investmentForm.amount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., 50000000"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Interest Rate (%) *</label>
                    <input
                      type="number"
                      name="interestRate"
                      value={investmentForm.interestRate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., 12.5"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Purchase Date *</label>
                    <input
                      type="date"
                      name="purchaseDate"
                      value={investmentForm.purchaseDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Maturity Date *</label>
                    <input
                      type="date"
                      name="maturityDate"
                      value={investmentForm.maturityDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Current Value (UGX)</label>
                    <input
                      type="number"
                      name="currentValue"
                      value={investmentForm.currentValue}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Leave blank to use initial amount"
                    />
                    <p className="text-xs text-secondary-500 mt-1">Leave blank to use initial amount</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Interest Payment Schedule</label>
                    <select
                      name="interestPaymentSchedule"
                      value={investmentForm.interestPaymentSchedule}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {interestScheduleOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Institution Name</label>
                    <input
                      type="text"
                      name="institutionName"
                      value={investmentForm.institutionName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Bank of Uganda"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Institution Contact</label>
                    <input
                      type="text"
                      name="institutionContact"
                      value={investmentForm.institutionContact}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., +256-414-258-441"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-secondary-50 p-4 flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Investment'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      
      {/* Edit Investment Modal */}
      {showEditModal && selectedInvestment && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-screen overflow-y-auto">
            <form onSubmit={handleEditInvestment}>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Edit Investment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Investment Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={investmentForm.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Investment Type *</label>
                    <select
                      name="type"
                      value={investmentForm.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      {investmentTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Amount (UGX) *</label>
                    <input
                      type="number"
                      name="amount"
                      value={investmentForm.amount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Interest Rate (%) *</label>
                    <input
                      type="number"
                      name="interestRate"
                      value={investmentForm.interestRate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Purchase Date *</label>
                    <input
                      type="date"
                      name="purchaseDate"
                      value={investmentForm.purchaseDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Maturity Date *</label>
                    <input
                      type="date"
                      name="maturityDate"
                      value={investmentForm.maturityDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Current Value (UGX) *</label>
                    <input
                      type="number"
                      name="currentValue"
                      value={investmentForm.currentValue}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Interest Payment Schedule</label>
                    <select
                      name="interestPaymentSchedule"
                      value={investmentForm.interestPaymentSchedule}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {interestScheduleOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Institution Name</label>
                    <input
                      type="text"
                      name="institutionName"
                      value={investmentForm.institutionName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Institution Contact</label>
                    <input
                      type="text"
                      name="institutionContact"
                      value={investmentForm.institutionContact}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-secondary-50 p-4 flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setShowEditModal(false)}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Investment'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      
      {/* Sell Investment Modal */}
      {showSellModal && selectedInvestment && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <form onSubmit={handleSellInvestment}>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">Sell Investment</h3>
                <p className="text-secondary-600 mb-4">
                  You are about to mark this investment as sold. Please enter the sale details.
                </p>
                
                <div className="mb-4">
                  <div className="bg-secondary-50 p-3 rounded-lg mb-4">
                    <p className="font-medium">{selectedInvestment.name}</p>
                    <p className="text-sm text-secondary-600">
                      {getInvestmentTypeInfo(selectedInvestment.type).label} • 
                      {selectedInvestment.institutionName && ` ${selectedInvestment.institutionName} •`} 
                      {' '}{formatCurrency(selectedInvestment.amount)} initial investment
                    </p>
                    <p className="text-sm text-secondary-600 mt-1">
                      Current value: {formatCurrency(selectedInvestment.currentValue)}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Sale Value (UGX) *</label>
                    <input
                      type="number"
                      name="saleValue"
                      value={sellForm.saleValue}
                      onChange={handleSellInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                    {parseFloat(sellForm.saleValue) !== 0 && selectedInvestment.amount !== 0 && (
                      <p className={`text-sm mt-1 ${
                        parseFloat(sellForm.saleValue) >= selectedInvestment.amount 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {parseFloat(sellForm.saleValue) >= selectedInvestment.amount ? 'Profit: ' : 'Loss: '}
                        {formatCurrency(parseFloat(sellForm.saleValue) - selectedInvestment.amount)} 
                        ({((parseFloat(sellForm.saleValue) / selectedInvestment.amount - 1) * 100).toFixed(2)}%)
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Sale Date *</label>
                    <input
                      type="date"
                      name="saleDate"
                      value={sellForm.saleDate}
                      onChange={handleSellInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="bg-secondary-50 p-4 flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setShowSellModal(false)}>Cancel</Button>
                <Button variant="danger" type="submit" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Confirm Sale'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      
      {/* View Investment Modal */}
      {showViewModal && selectedInvestment && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{selectedInvestment.name}</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  selectedInvestment.status === 'active' ? 'bg-green-100 text-green-800' :
                  selectedInvestment.status === 'matured' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedInvestment.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-secondary-700 mb-2">Investment Details</h4>
                  <div className="space-y-2">
                    <p>
                      <span className="text-secondary-600">Type:</span>{' '}
                      <span className="font-medium">{getInvestmentTypeInfo(selectedInvestment.type).label}</span>
                    </p>
                    <p>
                      <span className="text-secondary-600">Institution:</span>{' '}
                      <span className="font-medium">{selectedInvestment.institutionName || 'N/A'}</span>
                    </p>
                    <p>
                      <span className="text-secondary-600">Contact:</span>{' '}
                      <span className="font-medium">{selectedInvestment.institutionContact || 'N/A'}</span>
                    </p>
                    <p>
                      <span className="text-secondary-600">Interest Rate:</span>{' '}
                      <span className="font-medium">{selectedInvestment.interestRate}%</span>
                    </p>
                    <p>
                      <span className="text-secondary-600">Payment Schedule:</span>{' '}
                      <span className="font-medium">
                        {selectedInvestment.interestPaymentSchedule 
                          ? interestScheduleOptions.find(o => o.value === selectedInvestment.interestPaymentSchedule)?.label 
                          : 'At Maturity'}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-secondary-700 mb-2">Financial Details</h4>
                  <div className="space-y-2">
                    <p>
                      <span className="text-secondary-600">Initial Amount:</span>{' '}
                      <span className="font-medium">{formatCurrency(selectedInvestment.amount)}</span>
                    </p>
                    <p>
                      <span className="text-secondary-600">Current Value:</span>{' '}
                      <span className="font-medium">{formatCurrency(selectedInvestment.currentValue)}</span>
                    </p>
                    <p>
                      <span className="text-secondary-600">Interest Earned:</span>{' '}
                      <span className="font-medium">{formatCurrency(selectedInvestment.interestEarned || 0)}</span>
                    </p>
                    <p>
                      <span className="text-secondary-600">Interest Paid:</span>{' '}
                      <span className="font-medium">{formatCurrency(selectedInvestment.interestPaid || 0)}</span>
                    </p>
                    <p>
                      <span className="text-secondary-600">ROI:</span>{' '}
                      <span className={`font-medium ${getROI(selectedInvestment) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {getROI(selectedInvestment).toFixed(2)}%
                      </span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-secondary-700 mb-2">Dates</h4>
                  <div className="space-y-2">
                    <p>
                      <span className="text-secondary-600">Purchase Date:</span>{' '}
                      <span className="font-medium">{format(parseISO(selectedInvestment.purchaseDate), 'MMMM d, yyyy')}</span>
                    </p>
                    <p>
                      <span className="text-secondary-600">Maturity Date:</span>{' '}
                      <span className="font-medium">{format(parseISO(selectedInvestment.maturityDate), 'MMMM d, yyyy')}</span>
                    </p>
                    {selectedInvestment.status === 'active' && (
                      <p>
                        <span className="text-secondary-600">Days to Maturity:</span>{' '}
                        <span className={`font-medium ${
                          getDaysToMaturity(selectedInvestment.maturityDate) <= 30 
                            ? 'text-yellow-600' 
                            : 'text-secondary-900'
                        }`}>
                          {getDaysToMaturity(selectedInvestment.maturityDate)} days
                        </span>
                      </p>
                    )}
                    {selectedInvestment.status === 'sold' && selectedInvestment.saleDate && (
                      <p>
                        <span className="text-secondary-600">Sale Date:</span>{' '}
                        <span className="font-medium">{format(parseISO(selectedInvestment.saleDate), 'MMMM d, yyyy')}</span>
                      </p>
                    )}
                  </div>
                </div>
                
                {selectedInvestment.status === 'sold' && (
                  <div>
                    <h4 className="font-medium text-secondary-700 mb-2">Sale Details</h4>
                    <div className="space-y-2">
                      <p>
                        <span className="text-secondary-600">Sale Value:</span>{' '}
                        <span className="font-medium">{formatCurrency(selectedInvestment.saleValue || 0)}</span>
                      </p>
                      {selectedInvestment.saleValue && (
                        <p>
                          <span className="text-secondary-600">Profit/Loss:</span>{' '}
                          <span className={`font-medium ${
                            (selectedInvestment.saleValue - selectedInvestment.amount) >= 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {formatCurrency(selectedInvestment.saleValue - selectedInvestment.amount)}
                            {' '}({((selectedInvestment.saleValue / selectedInvestment.amount - 1) * 100).toFixed(2)}%)
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action buttons based on status */}
              <div className="border-t border-secondary-200 pt-4 mt-4">
                {selectedInvestment.status === 'active' ? (
                  <div className="flex justify-between">
                    <div>
                      <Button size="sm" variant="outline" onClick={() => {
                        setShowViewModal(false);
                        openEditModal(selectedInvestment);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setShowViewModal(false);
                      }}>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => {
                        setShowViewModal(false);
                        openSellModal(selectedInvestment);
                      }}>
                        <Tag className="h-4 w-4 mr-2" />
                        Sell Investment
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => setShowViewModal(false)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
