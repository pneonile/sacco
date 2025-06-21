import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wallet,
  CreditCard,
  TrendingUp,
  UserPlus,
  FileText,
  MessageSquare,
  Settings,
  PiggyBank,
  AlertTriangle,
  Receipt,
  Banknote,
  Smartphone,
  PieChart,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const adminNavItems = [
    { icon: UserPlus, label: 'Onboarding', path: '/admin/onboarding' },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Members', path: '/admin/members' },
    { icon: Wallet, label: 'Deposits', path: '/admin/deposits' },
    { icon: CreditCard, label: 'Loans', path: '/admin/loans' },
    { icon: Receipt, label: 'Transactions', path: '/admin/transactions' },
    { icon: AlertTriangle, label: 'Fines', path: '/admin/fines' },
    { icon: Banknote, label: 'Checkoffs', path: '/admin/checkoffs' },
    { icon: Smartphone, label: 'E-Wallets', path: '/admin/e-wallets' },
    { icon: TrendingUp, label: 'Investments', path: '/admin/investments' },
    { icon: FileText, label: 'Reports', path: '/admin/reports' },
    { icon: MessageSquare, label: 'Communications', path: '/admin/communications' },
    { icon: PieChart, label: 'Income & Expense', path: '/admin/income-expense' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const memberNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/member' },
    { icon: PiggyBank, label: 'My Accounts', path: '/member/accounts' },
    { icon: Wallet, label: 'Deposits', path: '/member/deposits' },
    { icon: CreditCard, label: 'My Loans', path: '/member/loans' },
    { icon: Receipt, label: 'Transactions', path: '/member/transactions' },
    { icon: FileText, label: 'Statements', path: '/member/statements' },
    { icon: MessageSquare, label: 'Messages', path: '/member/communications' },
    { icon: Smartphone, label: 'E-Wallet', path: '/member/e-wallet' },
    { icon: Settings, label: 'Profile', path: '/member/profile' },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : memberNavItems;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Fixed positioning for consistent alignment */}
      <div className={`
        fixed left-0 top-0 h-full w-64 bg-white border-r border-secondary-200 transform transition-transform duration-300 z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <PiggyBank className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-secondary-900">Kawempe</h1>
              <p className="text-xs text-secondary-500">SACCO</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};