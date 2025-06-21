import React, { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { clsx } from 'clsx';

// Basic types for mobile money
interface MobileWallet {
  id: string;
  memberId: string;
  provider: 'mtn' | 'airtel';
  phoneNumber: string;
  balance: number;
  status: 'active' | 'suspended' | 'closed';
  createdAt: string;
}

interface MobileTransaction {
  id: string;
  walletId: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  fees: number;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  createdAt: string;
}

export const MobileMoneyPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [wallets, setWallets] = useState<MobileWallet[]>([]);
  const [transactions, setTransactions] = useState<MobileTransaction[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      /* ----------  Mock Wallets  ---------- */
      const mockWallets: MobileWallet[] = [
        {
          id: 'wal-1',
          memberId: 'KS001',
          provider: 'mtn',
          phoneNumber: '+256701234567',
          balance: 450000,
          status: 'active',
          createdAt: '2025-01-03',
        },
        {
          id: 'wal-2',
          memberId: 'KS002',
          provider: 'airtel',
          phoneNumber: '+256772345678',
          balance: 250000,
          status: 'active',
          createdAt: '2025-02-14',
        },
        {
          id: 'wal-3',
          memberId: 'KS003',
          provider: 'mtn',
          phoneNumber: '+256783456789',
          balance: 150000,
          status: 'active',
          createdAt: '2025-03-21',
        },
      ];

      /* ----------  Mock Transactions  ---------- */
      const mockTx: MobileTransaction[] = [
        {
          id: 'tx-1',
          walletId: 'wal-1',
          type: 'deposit',
          amount: 200000,
          fees: 1000,
          status: 'completed',
          reference: 'MTN123456',
          createdAt: '2025-06-20T10:22:00',
        },
        {
          id: 'tx-2',
          walletId: 'wal-2',
          type: 'withdrawal',
          amount: 50000,
          fees: 800,
          status: 'completed',
          reference: 'ATL987654',
          createdAt: '2025-06-19T14:41:00',
        },
        {
          id: 'tx-3',
          walletId: 'wal-1',
          type: 'transfer',
          amount: 75000,
          fees: 600,
          status: 'pending',
          reference: 'MTN332211',
          createdAt: '2025-06-21T08:10:00',
        },
      ];

      setWallets(mockWallets);
      setTransactions(mockTx);
      setIsLoading(false);
    }, 800);
  }, []);

  /* ----------  Utils  ---------- */
  const formatUGX = (amt: number) =>
    new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amt);

  const filteredTx = useMemo(() => {
    if (!search) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(
      (t) =>
        t.reference.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        wallets.find((w) => w.id === t.walletId && w.phoneNumber.includes(q))
    );
  }, [search, transactions, wallets]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Mobile Money Integration</h1>
        <p className="text-secondary-600 mt-1">
          Manage MTN Mobile Money and Airtel Money transactions
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">MTN Mobile Money</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">UGX 25,000,000</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-full">
                <Smartphone className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Airtel Money</p>
                <p className="text-2xl font-bold text-red-600 mt-1">UGX 15,000,000</p>
              </div>
              <div className="bg-red-50 p-3 rounded-full">
                <Smartphone className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Volume</p>
                <p className="text-2xl font-bold text-primary-600 mt-1">UGX 40,000,000</p>
              </div>
              <div className="bg-primary-50 p-3 rounded-full">
                <Wallet className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <Card className="mt-6">
        <div className="p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="text-lg font-semibold">Mobile Money Transactions</h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by phone or ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
        </div>
        <div className="p-4 overflow-x-auto">
          {isLoading ? (
            <Skeleton height={120} />
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-2 text-left">Ref</th>
                  <th className="px-4 py-2 text-left">Phone</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Fees</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.map((tx) => {
                  const wal = wallets.find((w) => w.id === tx.walletId);
                  return (
                    <tr key={tx.id} className="border-b last:border-b-0">
                      <td className="px-4 py-2 font-mono">{tx.reference}</td>
                      <td className="px-4 py-2">{wal?.phoneNumber || '-'}</td>
                      <td className="px-4 py-2 capitalize">{tx.type}</td>
                      <td className="px-4 py-2">{formatUGX(tx.amount)}</td>
                      <td className="px-4 py-2 text-secondary-600">{formatUGX(tx.fees)}</td>
                      <td className="px-4 py-2">
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            tx.status === 'completed' && 'bg-green-100 text-green-800',
                            tx.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                            tx.status === 'failed' && 'bg-red-100 text-red-800'
                          )}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};
