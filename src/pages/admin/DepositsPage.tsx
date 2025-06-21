import React, { useState, useEffect } from 'react';
import { Wallet, Search, Filter, Download, User, PiggyBank, TrendingUp, FileText } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { clsx } from 'clsx';
import { Deposit, User as UserType } from '../../types';

// --- Mock Data (Self-contained for stability) ---

const mockUsers: UserType[] = [
  { id: '1', firstName: 'John', lastName: 'Doe', memberNumber: 'KS001', email: 'john.doe@example.com', role: 'member', phoneNumber: '+256701234567', idNumber: 'CM90123456ABCD', address: '', joinDate: '', status: 'active' },
  { id: '2', firstName: 'Sarah', lastName: 'Nakato', memberNumber: 'KS002', email: 'sarah.nakato@example.com', role: 'member', phoneNumber: '+256772345678', idNumber: 'CM85098765WXYZ', address: '', joinDate: '', status: 'active' },
  { id: '3', firstName: 'Robert', lastName: 'Mugisha', memberNumber: 'KS003', email: 'robert.mugisha@example.com', role: 'member', phoneNumber: '+256753456789', idNumber: 'CM92112233EFGH', address: '', joinDate: '', status: 'active' },
];

const generateMockDeposits = (): Deposit[] => {
  const deposits: Deposit[] = [];
  const categories: ('savings' | 'fixed' | 'special')[] = ['savings', 'fixed', 'special'];
  const channels: ('cash' | 'bank' | 'mobile_money')[] = ['cash', 'bank', 'mobile_money'];
  
  for (let i = 0; i < 20; i++) {
    const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomChannel = channels[Math.floor(Math.random() * channels.length)];
    const randomAmount = Math.floor(Math.random() * 900000) + 100000;
    const randomDaysAgo = Math.floor(Math.random() * 60);
    const date = format(subDays(new Date(), randomDaysAgo), 'yyyy-MM-dd');
    
    deposits.push({
      id: `dep-${i + 1}`,
      memberId: randomUser.id,
      category: randomCategory,
      amount: randomAmount,
      date: date,
      receiptNumber: `REC-${String(i + 1).padStart(5, '0')}`,
      channel: randomChannel,
      reference: randomChannel !== 'cash' ? `REF${Math.floor(Math.random() * 1000000)}` : '',
    });
  }
  return deposits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// --- Utility Functions ---

const formatUGX = (amount: number): string => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'dd MMM yyyy');
};

// --- Component ---

export const DepositsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [deposits, setDeposits] = useState<Deposit[]>([]);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockData = generateMockDeposits();
      setDeposits(mockData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const stats = {
    totalDeposits: deposits.reduce((sum, dep) => sum + dep.amount, 0),
    savingsDeposits: deposits.filter(d => d.category === 'savings').reduce((sum, dep) => sum + dep.amount, 0),
    fixedDeposits: deposits.filter(d => d.category === 'fixed').reduce((sum, dep) => sum + dep.amount, 0),
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Deposits Management</h1>
        <p className="text-secondary-600 mt-1">
          Track and manage all member deposits.
        </p>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Deposits</p>
              {isLoading ? <Skeleton height={30} width={120} /> : <p className="text-2xl font-bold text-secondary-900 mt-1">{formatUGX(stats.totalDeposits)}</p>}
            </div>
            <div className="bg-primary-50 p-3 rounded-full"><Wallet className="h-6 w-6 text-primary-600" /></div>
          </div>
        </Card>
        <Card>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Savings Deposits</p>
              {isLoading ? <Skeleton height={30} width={120} /> : <p className="text-2xl font-bold text-green-600 mt-1">{formatUGX(stats.savingsDeposits)}</p>}
            </div>
            <div className="bg-green-50 p-3 rounded-full"><PiggyBank className="h-6 w-6 text-green-600" /></div>
          </div>
        </Card>
        <Card>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Fixed Deposits</p>
              {isLoading ? <Skeleton height={30} width={120} /> : <p className="text-2xl font-bold text-blue-600 mt-1">{formatUGX(stats.fixedDeposits)}</p>}
            </div>
            <div className="bg-blue-50 p-3 rounded-full"><TrendingUp className="h-6 w-6 text-blue-600" /></div>
          </div>
        </Card>
      </div>
      
      {/* Deposits Table */}
      <Card>
        <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">All Deposits</h3>
            <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
            </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Channel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Receipt #</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {isLoading ? (
                Array(5).fill(0).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4"><Skeleton height={20} width={150} /></td>
                    <td className="px-6 py-4"><Skeleton height={20} width={100} /></td>
                    <td className="px-6 py-4"><Skeleton height={20} width={80} /></td>
                    <td className="px-6 py-4"><Skeleton height={20} width={100} /></td>
                    <td className="px-6 py-4"><Skeleton height={20} width={100} /></td>
                    <td className="px-6 py-4"><Skeleton height={20} width={80} /></td>
                  </tr>
                ))
              ) : (
                deposits.map((deposit) => {
                  const member = mockUsers.find(u => u.id === deposit.memberId);
                  return (
                    <tr key={deposit.id} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-secondary-900">{member ? `${member.firstName} ${member.lastName}` : 'N/A'}</div>
                        <div className="text-sm text-secondary-500">{member?.memberNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{formatUGX(deposit.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={clsx(
                          "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                          deposit.category === 'savings' && "bg-green-100 text-green-800",
                          deposit.category === 'fixed' && "bg-blue-100 text-blue-800",
                          deposit.category === 'special' && "bg-purple-100 text-purple-800"
                        )}>
                          {deposit.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600 capitalize">{deposit.channel.replace('_', ' ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{formatDate(deposit.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-secondary-500">{deposit.receiptNumber}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
