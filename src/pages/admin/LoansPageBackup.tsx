import React, { useState } from 'react';
import { Search, Plus, Filter, Download, CreditCard, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/charts/StatCard';

interface Loan {
  id: string;
  memberNumber: string;
  memberName: string;
  loanType: 'emergency' | 'development' | 'education' | 'business';
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  outstandingBalance: number;
  applicationDate: string;
  status: 'pending' | 'approved' | 'disbursed' | 'active' | 'completed' | 'defaulted';
  nextPaymentDate: string;
}

const mockLoans: Loan[] = [
  {
    id: '1',
    memberNumber: 'KS001',
    memberName: 'John Doe',
    loanType: 'development',
    principalAmount: 10000000,
    interestRate: 15.0,
    termMonths: 24,
    monthlyPayment: 520833,
    outstandingBalance: 7500000,
    applicationDate: '2023-06-15',
    status: 'active',
    nextPaymentDate: '2024-02-10',
  },
  {
    id: '2',
    memberNumber: 'KS002',
    memberName: 'Sarah Nakato',
    loanType: 'emergency',
    principalAmount: 2000000,
    interestRate: 12.0,
    termMonths: 12,
    monthlyPayment: 177698,
    outstandingBalance: 1500000,
    applicationDate: '2024-01-10',
    status: 'active',
    nextPaymentDate: '2024-02-15',
  },
  {
    id: '3',
    memberNumber: 'KS003',
    memberName: 'Peter Ssebugwawo',
    loanType: 'business',
    principalAmount: 5000000,
    interestRate: 18.0,
    termMonths: 18,
    monthlyPayment: 350000,
    outstandingBalance: 0,
    applicationDate: '2022-03-20',
    status: 'completed',
    nextPaymentDate: '',
  },
  {
    id: '4',
    memberNumber: 'KS004',
    memberName: 'Mary Johnson',
    loanType: 'education',
    principalAmount: 3000000,
    interestRate: 14.0,
    termMonths: 36,
    monthlyPayment: 105000,
    outstandingBalance: 2800000,
    applicationDate: '2023-09-15',
    status: 'pending',
    nextPaymentDate: '2024-02-20',
  },
  {
    id: '5',
    memberNumber: 'KS005',
    memberName: 'David Mukasa',
    loanType: 'development',
    principalAmount: 8000000,
    interestRate: 16.0,
    termMonths: 30,
    monthlyPayment: 350000,
    outstandingBalance: 6500000,
    applicationDate: '2023-11-10',
    status: 'defaulted',
    nextPaymentDate: '2024-01-10',
  },
];

export const LoansPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loanTypeFilter, setLoanTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'disbursed':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'defaulted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLoanTypeColor = (type: string) => {
    switch (type) {
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'development':
        return 'bg-blue-100 text-blue-800';
      case 'education':
        return 'bg-green-100 text-green-800';
      case 'business':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLoans = mockLoans.filter(loan => {
    const matchesSearch = 
      loan.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.memberNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLoanType = loanTypeFilter === 'all' || loan.loanType === loanTypeFilter;
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    
    return matchesSearch && matchesLoanType && matchesStatus;
  });

  const totalActiveLoans = mockLoans.filter(l => l.status === 'active').length;
  const totalOutstanding = mockLoans.reduce((sum, loan) => 
    loan.status === 'active' ? sum + loan.outstandingBalance : sum, 0
  );
  const pendingApplications = mockLoans.filter(l => l.status === 'pending').length;
  const defaultedLoans = mockLoans.filter(l => l.status === 'defaulted').length;

  return (
    <div className="p-6">
      {/* Header Card */}
      <div className="flex items-center justify-between bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Loans</h1>
          <p className="text-secondary-600 mt-1">
            Manage loan applications, disbursements, and repayments
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Active Loans"
          value={totalActiveLoans.toString()}
          change="+5 this month"
          changeType="positive"
          icon={CreditCard}
          iconColor="text-green-600"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(totalOutstanding)}
          change="Total amount due"
          changeType="neutral"
          icon={Clock}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Pending Applications"
          value={pendingApplications.toString()}
          change="Awaiting approval"
          changeType="neutral"
          icon={AlertTriangle}
          iconColor="text-yellow-600"
        />
        <StatCard
          title="Defaulted Loans"
          value={defaultedLoans.toString()}
          change="Require attention"
          changeType="negative"
          icon={AlertTriangle}
          iconColor="text-red-600"
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search loans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={loanTypeFilter}
              onChange={(e) => setLoanTypeFilter(e.target.value)}
              className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="all">All Loan Types</option>
              <option value="emergency">Emergency</option>
              <option value="development">Development</option>
              <option value="education">Education</option>
              <option value="business">Business</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="defaulted">Defaulted</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Loans Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200">
                <th className="text-left py-3 px-4 font-medium text-secondary-900">Member</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-900">Loan Type</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-900">Principal</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-900">Outstanding</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-900">Monthly Payment</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-900">Next Payment</th>
                <th className="text-left py-3 px-4 font-medium text-secondary-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-secondary-900">{loan.memberName}</p>
                      <p className="text-sm text-secondary-600">{loan.memberNumber}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getLoanTypeColor(loan.loanType)}`}>
                      {loan.loanType}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-medium text-secondary-900">
                      {formatCurrency(loan.principalAmount)}
                    </p>
                    <p className="text-sm text-secondary-600">{loan.interestRate}% • {loan.termMonths}mo</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-medium text-secondary-900">
                      {formatCurrency(loan.outstandingBalance)}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-secondary-900">
                      {formatCurrency(loan.monthlyPayment)}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-secondary-900">
                      {loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString() : '-'}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(loan.status)}`}>
                      {loan.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};