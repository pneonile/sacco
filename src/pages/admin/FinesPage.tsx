import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Wallet,
  FileText,
  Users,
  Clock
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { Fine, User as UserType } from '../../types';

// --- Mock Data (Self-contained for stability) ---

const mockUsers: UserType[] = [
  { id: '1', firstName: 'John', lastName: 'Doe', memberNumber: 'KS001', email: 'john.doe@example.com', role: 'member', phoneNumber: '+256701234567', idNumber: 'CM90123456ABCD', address: '', joinDate: '', status: 'active' },
  { id: '2', firstName: 'Sarah', lastName: 'Nakato', memberNumber: 'KS002', email: 'sarah.nakato@example.com', role: 'member', phoneNumber: '+256772345678', idNumber: 'CM85098765WXYZ', address: '', joinDate: '', status: 'active' },
  { id: '3', firstName: 'Robert', lastName: 'Mugisha', memberNumber: 'KS003', email: 'robert.mugisha@example.com', role: 'member', phoneNumber: '+256753456789', idNumber: 'CM92112233EFGH', address: '', joinDate: '', status: 'active' },
  { id: '4', firstName: 'Grace', lastName: 'Auma', memberNumber: 'KS004', email: 'grace.auma@example.com', role: 'member', phoneNumber: '+256784567890', idNumber: 'CM88076543IJKL', address: '', joinDate: '', status: 'active' },
  { id: '5', firstName: 'David', lastName: 'Okello', memberNumber: 'KS005', email: 'david.okello@example.com', role: 'member', phoneNumber: '+256712345678', idNumber: 'CM95031122MNOP', address: '', joinDate: '', status: 'active' },
];

const generateMockFines = (): Fine[] => {
  const fines: Fine[] = [];
  const categories: Fine['category'][] = ['late_payment', 'meeting_absence', 'policy_violation', 'other'];
  const statuses: Fine['status'][] = ['pending', 'paid', 'waived'];

  for (let i = 0; i < 30; i++) {
    const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const randomAmount = (Math.floor(Math.random() * 10) + 1) * 10000; // 10k to 100k UGX
    const dateIssued = new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000);

    fines.push({
      id: `fine-${i + 1}`,
      memberId: randomUser.id,
      category: randomCategory,
      amount: randomAmount,
      description: `Fine for ${randomCategory.replace('_', ' ')}`,
      dateIssued: dateIssued.toISOString(),
      datePaid: randomStatus === 'paid' ? new Date(dateIssued.getTime() + Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString() : undefined,
      status: randomStatus,
    });
  }
  return fines.sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());
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

export const FinesPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [fines, setFines] = useState<Fine[]>([]);
  const [filteredFines, setFilteredFines] = useState<Fine[]>([]);
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    category: 'all',
  });

  // State for modals
  const [showNewFineModal, setShowNewFineModal] = useState(false);
  const [showBulkFineModal, setShowBulkFineModal] = useState(false);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showWaiveModal, setShowWaiveModal] = useState(false);

  // New fine form state
  const [newFine, setNewFine] = useState({
    memberId: '',
    category: 'late_payment',
    amount: '',
    description: '',
  });
  const [memberSearch, setMemberSearch] = useState('');

  // Load data
  useEffect(() => {
    setTimeout(() => {
      setFines(generateMockFines());
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filtering logic
  useEffect(() => {
    let result = fines;

    if (filters.status !== 'all') {
      result = result.filter(f => f.status === filters.status);
    }
    if (filters.category !== 'all') {
      result = result.filter(f => f.category === filters.category);
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(f => {
        const member = mockUsers.find(u => u.id === f.memberId);
        return member && (
          member.firstName.toLowerCase().includes(searchTerm) ||
          member.lastName.toLowerCase().includes(searchTerm) ||
          member.memberNumber?.toLowerCase().includes(searchTerm)
        );
      });
    }
    setFilteredFines(result);
  }, [filters, fines]);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      totalIssued: fines.reduce((sum, f) => sum + f.amount, 0),
      totalPending: fines.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0),
      totalPaid: fines.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0),
      totalWaived: fines.filter(f => f.status === 'waived').reduce((sum, f) => sum + f.amount, 0),
    };
  }, [fines]);

  const handleRecordPayment = () => {
    if (!selectedFine) return;
    setFines(fines.map(f => f.id === selectedFine.id ? { ...f, status: 'paid', datePaid: new Date().toISOString() } : f));
    setShowPayModal(false);
    setSelectedFine(null);
  };

  const handleWaiveFine = () => {
    if (!selectedFine) return;
    setFines(fines.map(f => f.id === selectedFine.id ? { ...f, status: 'waived' } : f));
    setShowWaiveModal(false);
    setSelectedFine(null);
  };
  
  const handleIssueFine = (e: React.FormEvent) => {
    e.preventDefault();
    const newFineRecord: Fine = {
      id: `fine-${Date.now()}`,
      ...newFine,
      memberId: newFine.memberId,
      amount: parseFloat(newFine.amount),
      dateIssued: new Date().toISOString(),
      status: 'pending',
    };
    setFines([newFineRecord, ...fines]);
    setShowNewFineModal(false);
    setNewFine({ memberId: '', category: 'late_payment', amount: '', description: '' });
    setMemberSearch('');
  };

  const memberSearchResults = useMemo(() => {
    if (!memberSearch) return [];
    return mockUsers.filter(u => 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(memberSearch.toLowerCase()) ||
      u.memberNumber?.toLowerCase().includes(memberSearch.toLowerCase())
    );
  }, [memberSearch]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Fines Management</h1>
        <p className="text-secondary-600 mt-1">
          Issue, track, and manage member fines for policy violations.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Fines Issued</p>
                {isLoading ? <Skeleton height={30} width={120} /> : <p className="text-2xl font-bold text-secondary-900 mt-1">{formatUGX(stats.totalIssued)}</p>}
              </div>
              <div className="bg-blue-50 p-3 rounded-full"><FileText className="h-6 w-6 text-blue-600" /></div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Pending</p>
                {isLoading ? <Skeleton height={30} width={120} /> : <p className="text-2xl font-bold text-yellow-600 mt-1">{formatUGX(stats.totalPending)}</p>}
              </div>
              <div className="bg-yellow-50 p-3 rounded-full"><Clock className="h-6 w-6 text-yellow-600" /></div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Paid</p>
                {isLoading ? <Skeleton height={30} width={120} /> : <p className="text-2xl font-bold text-green-600 mt-1">{formatUGX(stats.totalPaid)}</p>}
              </div>
              <div className="bg-green-50 p-3 rounded-full"><Wallet className="h-6 w-6 text-green-600" /></div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Waived</p>
                {isLoading ? <Skeleton height={30} width={120} /> : <p className="text-2xl font-bold text-secondary-500 mt-1">{formatUGX(stats.totalWaived)}</p>}
              </div>
              <div className="bg-secondary-100 p-3 rounded-full"><XCircle className="h-6 w-6 text-secondary-500" /></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions and Filters */}
      <Card className="mb-6">
        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-2">
            <Button onClick={() => setShowNewFineModal(true)}><Plus className="h-4 w-4 mr-2" />Issue New Fine</Button>
            <Button variant="outline" onClick={() => setShowBulkFineModal(true)}><Users className="h-4 w-4 mr-2" />Bulk Fine</Button>
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search member..."
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              />
            </div>
            <select
              className="w-full md:w-auto px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="waived">Waived</option>
            </select>
            <select
              className="w-full md:w-auto px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.category}
              onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
            >
              <option value="all">All Categories</option>
              <option value="late_payment">Late Payment</option>
              <option value="meeting_absence">Meeting Absence</option>
              <option value="policy_violation">Policy Violation</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Fines Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Date Issued</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton height={20} width={150} /></td>
                    <td className="px-6 py-4"><Skeleton height={20} width={100} /></td>
                    <td className="px-6 py-4"><Skeleton height={20} width={80} /></td>
                    <td className="px-6 py-4"><Skeleton height={20} width={100} /></td>
                    <td className="px-6 py-4"><Skeleton height={20} width={80} /></td>
                    <td className="px-6 py-4"><Skeleton height={20} width={100} /></td>
                  </tr>
                ))
              ) : (
                filteredFines.map(fine => {
                  const member = mockUsers.find(u => u.id === fine.memberId);
                  return (
                    <tr key={fine.id} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-secondary-900">{member ? `${member.firstName} ${member.lastName}` : 'N/A'}</div>
                        <div className="text-sm text-secondary-500">{member?.memberNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600 capitalize">{fine.category.replace('_', ' ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{formatUGX(fine.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{formatDate(fine.dateIssued)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={clsx(
                          "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                          fine.status === 'pending' && "bg-yellow-100 text-yellow-800",
                          fine.status === 'paid' && "bg-green-100 text-green-800",
                          fine.status === 'waived' && "bg-secondary-100 text-secondary-800"
                        )}>
                          {fine.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {fine.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="success" onClick={() => { setSelectedFine(fine); setShowPayModal(true); }}>Pay</Button>
                            <Button size="sm" variant="outline" onClick={() => { setSelectedFine(fine); setShowWaiveModal(true); }}>Waive</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Issue New Fine Modal */}
      {showNewFineModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="w-full max-w-lg">
            <form onSubmit={handleIssueFine}>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Issue New Fine</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Member</label>
                    <input
                      type="text"
                      placeholder="Search member by name or ID..."
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg"
                    />
                    {memberSearch && (
                      <div className="border border-secondary-200 rounded-md mt-1 max-h-40 overflow-y-auto">
                        {memberSearchResults.map(member => (
                          <div
                            key={member.id}
                            className="p-2 hover:bg-secondary-50 cursor-pointer"
                            onClick={() => {
                              setNewFine(f => ({ ...f, memberId: member.id }));
                              setMemberSearch(`${member.firstName} ${member.lastName} (${member.memberNumber})`);
                            }}
                          >
                            {`${member.firstName} ${member.lastName} (${member.memberNumber})`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Category</label>
                    <select
                      value={newFine.category}
                      onChange={e => setNewFine(f => ({ ...f, category: e.target.value as Fine['category'] }))}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg"
                    >
                      <option value="late_payment">Late Payment</option>
                      <option value="meeting_absence">Meeting Absence</option>
                      <option value="policy_violation">Policy Violation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Amount (UGX)</label>
                    <input
                      type="number"
                      placeholder="e.g., 50000"
                      value={newFine.amount}
                      onChange={e => setNewFine(f => ({ ...f, amount: e.target.value }))}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                    <textarea
                      placeholder="Reason for the fine..."
                      value={newFine.description}
                      onChange={e => setNewFine(f => ({ ...f, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-secondary-50 p-4 flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setShowNewFineModal(false)}>Cancel</Button>
                <Button type="submit">Issue Fine</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayModal && selectedFine && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <div className="p-6 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="text-lg font-semibold mt-4">Record Payment</h3>
              <p className="text-secondary-600 mt-2">
                Are you sure you want to mark the fine of <span className="font-bold">{formatUGX(selectedFine.amount)}</span> as paid?
              </p>
            </div>
            <div className="bg-secondary-50 p-4 flex justify-center gap-2">
              <Button variant="outline" onClick={() => setShowPayModal(false)}>Cancel</Button>
              <Button variant="success" onClick={handleRecordPayment}>Confirm Payment</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Waive Fine Modal */}
      {showWaiveModal && selectedFine && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <div className="p-6 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
              <h3 className="text-lg font-semibold mt-4">Waive Fine</h3>
              <p className="text-secondary-600 mt-2">
                Are you sure you want to waive the fine of <span className="font-bold">{formatUGX(selectedFine.amount)}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="bg-secondary-50 p-4 flex justify-center gap-2">
              <Button variant="outline" onClick={() => setShowWaiveModal(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleWaiveFine}>Confirm Waiver</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
