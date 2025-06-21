import React, { useState, useMemo } from 'react';
import {
  Settings,
  Users,
  Shield,
  Bell,
  Database,
  Briefcase,
  SlidersHorizontal,
  Link as LinkIcon,
  Plus,
  Trash2,
  Edit,
  Search,
  Save,
  Key,
  Lock,
  MessageSquare,
  Smartphone,
  Banknote,
  FileText,
  CreditCard,
  UserPlus
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { clsx } from 'clsx';
import { Skeleton } from '../../components/ui/Skeleton';

// --- Mock Data ---

const mockUsers = [
  { id: 'usr1', name: 'Admin User', email: 'admin@kawempesacco.com', role: 'Admin', status: 'Active' },
  { id: 'usr2', name: 'Jane Manager', email: 'jane.m@kawempesacco.com', role: 'Manager', status: 'Active' },
  { id: 'usr3', name: 'Peter Loan', email: 'peter.l@kawempesacco.com', role: 'Loan Officer', status: 'Active' },
  { id: 'usr4', name: 'Grace Cashier', email: 'grace.c@kawempesacco.com', role: 'Cashier', status: 'Inactive' },
  { id: 'usr5', name: 'Sam Member', email: 'sam.m@kawempesacco.com', role: 'Member Services', status: 'Active' },
];

const permissions = {
  dashboard: { view: 'View Dashboard' },
  members: { view: 'View Members', create: 'Create Members', edit: 'Edit Members', delete: 'Delete Members' },
  loans: { view: 'View Loans', create: 'Create Loans', approve: 'Approve Loans', disburse: 'Disburse Loans' },
  deposits: { view: 'View Deposits', create: 'Create Deposits' },
  fines: { view: 'View Fines', create: 'Create Fines', waive: 'Waive Fines' },
  reports: { view: 'View Reports', generate: 'Generate Reports' },
  settings: { view: 'View Settings', manageUsers: 'Manage Users', manageRoles: 'Manage Roles', manageConfig: 'Manage SACCO Config' },
};

const mockRoles = {
  Admin: Object.values(permissions).flatMap(p => Object.keys(p)),
  Manager: ['dashboard.view', 'members.view', 'members.create', 'members.edit', 'loans.view', 'loans.approve', 'deposits.view', 'fines.view', 'reports.view', 'settings.view'],
  'Loan Officer': ['dashboard.view', 'members.view', 'loans.view', 'loans.create'],
  Cashier: ['dashboard.view', 'deposits.view', 'deposits.create', 'fines.view'],
  'Member Services': ['dashboard.view', 'members.view', 'members.create'],
  Auditor: ['dashboard.view', 'members.view', 'loans.view', 'deposits.view', 'fines.view', 'reports.view'],
};

// --- Component ---

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState(mockUsers);
  const [roles, setRoles] = useState(mockRoles);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = (section: string) => {
    setIsLoading(true);
    console.log(`Saving ${section} settings...`);
    setTimeout(() => {
      setIsLoading(false);
      // Here you would typically show a success toast
      alert(`${section} settings saved successfully!`);
    }, 1000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'users': return <UserManagement users={users} roles={Object.keys(roles)} onSave={() => handleSave('User Management')} />;
      case 'roles': return <RoleManagement roles={roles} permissions={permissions} onSave={() => handleSave('Role Management')} />;
      case 'sacco': return <SaccoConfiguration onSave={() => handleSave('SACCO Configuration')} />;
      case 'security': return <SecuritySettings onSave={() => handleSave('Security Settings')} />;
      case 'notifications': return <NotificationSettings onSave={() => handleSave('Notification Settings')} />;
      case 'integrations': return <IntegrationSettings onSave={() => handleSave('Integration Settings')} />;
      case 'data': return <DataManagement onSave={() => handleSave('Data Management')} />;
      default: return null;
    }
  };

  const TABS = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', icon: Key },
    { id: 'sacco', label: 'SACCO Config', icon: Briefcase },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: LinkIcon },
    { id: 'data', label: 'Data Management', icon: Database },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">System Settings</h1>
        <p className="text-secondary-600 mt-1">
          Manage users, roles, and system-wide configurations for your SACCO.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <Card className="lg:w-1/4 h-fit p-4">
          <nav className="space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                )}
              >
                <tab.icon className="h-5 w-5 mr-3" />
                {tab.label}
              </button>
            ))}
          </nav>
        </Card>

        {/* Content Area */}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// --- Sub-components for each tab ---

const UserManagement = ({ users, roles, onSave }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredUsers = users.filter((u: any) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">User Management</h3>
        <Button size="sm"><UserPlus className="h-4 w-4 mr-2" />Add User</Button>
      </div>
      <div className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user: any) => (
                <tr key={user.id} className="border-b">
                  <td className="px-4 py-2 font-medium">{user.name}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">{user.role}</td>
                  <td className="px-4 py-2">
                    <span className={clsx('px-2 py-0.5 rounded-full text-xs', user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <Button size="sm" variant="outline"><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="danger"><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

const RoleManagement = ({ roles, permissions, onSave }: any) => {
  return (
    <Card>
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Roles & Permissions</h3>
      </div>
      <div className="p-4 space-y-6">
        {Object.keys(roles).map(role => (
          <div key={role}>
            <h4 className="font-semibold mb-2">{role}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(permissions).flatMap(([group, perms]) => 
                Object.entries(perms).map(([key, label]) => (
                  <div key={`${group}.${key}`} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`${role}-${group}-${key}`}
                      checked={roles[role].includes(`${group}.${key}`)}
                      className="h-4 w-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                      readOnly // For display purposes
                    />
                    <label htmlFor={`${role}-${group}-${key}`} className="ml-2 text-sm text-secondary-700">{label as string}</label>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-secondary-50 border-t flex justify-end">
        <Button onClick={onSave}><Save className="h-4 w-4 mr-2" />Save Permissions</Button>
      </div>
    </Card>
  );
};

const SaccoConfiguration = ({ onSave }: any) => {
  return (
    <Card>
      <div className="p-4 border-b"><h3 className="text-lg font-semibold">SACCO Configuration</h3></div>
      <div className="p-4 space-y-6">
        <div>
          <h4 className="font-semibold mb-2">Basic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">SACCO Name</label>
              <input type="text" defaultValue="Kawempe SACCO" className="w-full px-3 py-2 border border-secondary-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Registration No.</label>
              <input type="text" defaultValue="P.12345/RCS" className="w-full px-3 py-2 border border-secondary-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Contact Phone</label>
              <input type="text" defaultValue="+256-414-123456" className="w-full px-3 py-2 border border-secondary-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Contact Email</label>
              <input type="email" defaultValue="contact@kawempesacco.com" className="w-full px-3 py-2 border border-secondary-300 rounded-lg" />
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Financial Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Default Loan Interest Rate (%)</label>
              <input type="number" defaultValue="15" className="w-full px-3 py-2 border border-secondary-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Late Payment Fine (UGX)</label>
              <input type="number" defaultValue="50000" className="w-full px-3 py-2 border border-secondary-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Currency</label>
              <input type="text" value="UGX" readOnly className="w-full px-3 py-2 border border-secondary-300 rounded-lg bg-secondary-100" />
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 bg-secondary-50 border-t flex justify-end">
        <Button onClick={onSave}><Save className="h-4 w-4 mr-2" />Save Configuration</Button>
      </div>
    </Card>
  );
};

const SecuritySettings = ({ onSave }: any) => {
  return (
    <Card>
      <div className="p-4 border-b"><h3 className="text-lg font-semibold">Security Settings</h3></div>
      <div className="p-4 space-y-6">
        <div>
          <h4 className="font-semibold mb-2">Password Policy</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-secondary-700">Minimum Length</label>
              <input type="number" defaultValue="8" className="w-20 px-2 py-1 border border-secondary-300 rounded-lg" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-secondary-700">Require Uppercase & Lowercase</label>
              <input type="checkbox" defaultChecked className="h-5 w-5 text-primary-600 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-secondary-700">Require Numbers</label>
              <input type="checkbox" defaultChecked className="h-5 w-5 text-primary-600 rounded" />
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Two-Factor Authentication (2FA)</h4>
          <div className="flex items-center justify-between">
            <p className="text-sm text-secondary-700">Enforce 2FA for all staff accounts</p>
            <input type="checkbox" className="h-5 w-5 text-primary-600 rounded" />
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Audit Log</h4>
          <p className="text-sm text-secondary-600">Recent system activities...</p>
          {/* A simple audit log display */}
        </div>
      </div>
      <div className="p-4 bg-secondary-50 border-t flex justify-end">
        <Button onClick={onSave}><Save className="h-4 w-4 mr-2" />Save Security Settings</Button>
      </div>
    </Card>
  );
};

const NotificationSettings = ({ onSave }: any) => {
  return (
    <Card>
      <div className="p-4 border-b"><h3 className="text-lg font-semibold">Notification Settings</h3></div>
      <div className="p-4 space-y-6">
        <div>
          <h4 className="font-semibold mb-2">SMS Gateway (Africa's Talking)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">API Key</label>
              <input type="password" defaultValue="************" className="w-full px-3 py-2 border border-secondary-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Username</label>
              <input type="text" defaultValue="kawempe-sacco" className="w-full px-3 py-2 border border-secondary-300 rounded-lg" />
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Automated Alerts</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-secondary-700">Loan Payment Reminders (SMS)</label>
              <input type="checkbox" defaultChecked className="h-5 w-5 text-primary-600 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-secondary-700">Deposit Confirmations (Email)</label>
              <input type="checkbox" defaultChecked className="h-5 w-5 text-primary-600 rounded" />
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 bg-secondary-50 border-t flex justify-end">
        <Button onClick={onSave}><Save className="h-4 w-4 mr-2" />Save Notification Settings</Button>
      </div>
    </Card>
  );
};

const IntegrationSettings = ({ onSave }: any) => {
  return (
    <Card>
      <div className="p-4 border-b"><h3 className="text-lg font-semibold">Integration Settings</h3></div>
      <div className="p-4 space-y-6">
        <div>
          <h4 className="font-semibold mb-2">MTN Mobile Money API</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">API User ID</label>
              <input type="text" className="w-full px-3 py-2 border border-secondary-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">API Key</label>
              <input type="password" className="w-full px-3 py-2 border border-secondary-300 rounded-lg" />
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Airtel Money API</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Client ID</label>
              <input type="text" className="w-full px-3 py-2 border border-secondary-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Client Secret</label>
              <input type="password" className="w-full px-3 py-2 border border-secondary-300 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 bg-secondary-50 border-t flex justify-end">
        <Button onClick={onSave}><Save className="h-4 w-4 mr-2" />Save Integration Settings</Button>
      </div>
    </Card>
  );
};

const DataManagement = ({ onSave }: any) => {
  return (
    <Card>
      <div className="p-4 border-b"><h3 className="text-lg font-semibold">Data Management</h3></div>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-secondary-700">Last backup: Today at 2:00 AM</p>
          <Button variant="outline">Trigger Manual Backup</Button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-secondary-700">Export all system data</p>
          <Button variant="outline">Export Data (CSV)</Button>
        </div>
      </div>
    </Card>
  );
};
