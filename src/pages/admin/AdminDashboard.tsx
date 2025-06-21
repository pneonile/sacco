import React from 'react';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  UserPlus, 
  AlertTriangle,
  Briefcase,
  Star,
  ClipboardList,
  UserCheck
} from 'lucide-react';
import { StatCard } from '../../components/charts/StatCard';
import { AreaChart } from '../../components/charts/AreaChart';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { mockDashboardStats } from '../../data/mockData';

const monthlyDepositsData = [
  { name: 'Jan', value: 1200000 },
  { name: 'Feb', value: 1350000 },
  { name: 'Mar', value: 1500000 },
  { name: 'Apr', value: 1400000 },
  { name: 'May', value: 1650000 },
  { name: 'Jun', value: 1800000 },
];

const monthlyLoansData = [
  { name: 'Jan', value: 800000 },
  { name: 'Feb', value: 900000 },
  { name: 'Mar', value: 1100000 },
  { name: 'Apr', value: 950000 },
  { name: 'May', value: 1200000 },
  { name: 'Jun', value: 1350000 },
];

// Enhanced to include staff attribution
const mockStaffActivities = [
  { 
    id: 1, 
    type: 'New Member Onboarded', 
    description: 'Sarah Nakato joined the SACCO.', 
    staffName: 'Grace Auma',
    time: '2 hours ago',
    status: 'success'
  },
  { 
    id: 2, 
    type: 'Loan Approved', 
    description: 'Business loan for UGX 5,000,000 approved for John Doe.', 
    staffName: 'Peter Loan',
    time: '4 hours ago',
    status: 'success'
  },
  { 
    id: 3, 
    type: 'Deposit Captured', 
    description: 'UGX 2,000,000 deposited by Robert Mugisha.', 
    staffName: 'Grace Cashier',
    time: '6 hours ago',
    status: 'success'
  },
  { 
    id: 4, 
    type: 'Fine Issued', 
    description: 'Late payment fine issued to David Okello.', 
    staffName: 'Jane Manager',
    time: '1 day ago',
    status: 'warning'
  },
];

const quickActions = [
  { icon: UserPlus, label: 'Register New Member', color: 'text-green-600' },
  { icon: CreditCard, label: 'Approve Loan Application', color: 'text-blue-600' },
  { icon: DollarSign, label: 'Process Bulk Deposits', color: 'text-purple-600' },
  { icon: TrendingUp, label: 'Generate Monthly Report', color: 'text-orange-600' },
];

// New HR Mock Data
const mockHrStats = {
  totalStaff: 15,
  activeStaff: 14,
  departments: 5,
  avgPerformance: 92.5,
};

const mockStaffPerformance = [
  { name: 'Peter Loan', role: 'Loan Officer', metric: '25 Loans Processed', score: 5 },
  { name: 'Grace Auma', role: 'Member Services', metric: '45 Members Assisted', score: 5 },
  { name: 'Jane Manager', role: 'Manager', metric: '98% Team Uptime', score: 4 },
];

const mockDepartmentData = [
  { name: 'Loan Officers', count: 4 },
  { name: 'Member Services', count: 5 },
  { name: 'Cashiers', count: 3 },
  { name: 'Management', count: 2 },
  { name: 'IT & Support', count: 1 },
];

const hrQuickActions = [
  { icon: UserPlus, label: 'Add New Staff', color: 'text-blue-600' },
  { icon: ClipboardList, label: 'View Payroll', color: 'text-green-600' },
  { icon: UserCheck, label: 'Manage Leave Requests', color: 'text-purple-600' },
];

export const AdminDashboard: React.FC = () => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-UG').format(num);
  };

  return (
    <div className="p-6">
      {/* Header Card */}
      <Card
        variant="gradient"
        interactive
        glow
        gradientDirection="diagonal"
        className="flex items-center justify-between mb-6"
        padding="lg"
      >
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Admin Dashboard</h1>
          <p className="text-secondary-600 mt-1">
            Welcome back! Here's what's happening at Kawempe SACCO today.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="success" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
          <Button variant="info" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            View Reports
          </Button>
        </div>
      </Card>

      {/* Financial Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Members"
          value={formatNumber(mockDashboardStats.totalMembers)}
          change="+12.5% from last month"
          changeType="positive"
          icon={Users}
          iconColor="text-green-600"
        />
        <StatCard
          title="Active Loans"
          value={formatNumber(mockDashboardStats.activeLoans)}
          change="+8.2% from last month"
          changeType="positive"
          icon={CreditCard}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Total Deposits"
          value={formatCurrency(mockDashboardStats.totalDeposits)}
          change="+15.7% from last month"
          changeType="positive"
          icon={DollarSign}
          iconColor="text-purple-600"
        />
        <StatCard
          title="Total Investments"
          value={formatCurrency(mockDashboardStats.totalInvestments)}
          change="+6.3% from last month"
          changeType="positive"
          icon={TrendingUp}
          iconColor="text-orange-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <AreaChart
            data={monthlyDepositsData}
            dataKey="value"
            color="#22c55e"
            title="Monthly Deposits Growth"
          />
        </Card>
        <Card>
          <AreaChart
            data={monthlyLoansData}
            dataKey="value"
            color="#3b82f6"
            title="Monthly Loans Disbursed"
          />
        </Card>
      </div>

      {/* Human Resources Section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-secondary-800 mb-4">Human Resources Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard title="Total Staff" value={formatNumber(mockHrStats.totalStaff)} icon={Users} iconColor="text-blue-600" />
          <StatCard title="Active Staff" value={formatNumber(mockHrStats.activeStaff)} icon={UserCheck} iconColor="text-green-600" />
          <StatCard title="Departments" value={formatNumber(mockHrStats.departments)} icon={Briefcase} iconColor="text-purple-600" />
          <StatCard title="Avg. Performance" value={`${mockHrStats.avgPerformance}%`} icon={Star} iconColor="text-yellow-600" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Recent Staff Activities</h3>
            <div className="space-y-4">
              {mockStaffActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-secondary-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${activity.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-secondary-900">{activity.type}</p>
                    <p className="text-sm text-secondary-600">{activity.description}</p>
                    <p className="text-xs text-secondary-500 mt-1">
                      By <span className="font-semibold">{activity.staffName}</span> • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Top Staff Performance</h3>
              <div className="space-y-3">
                {mockStaffPerformance.map((staff, index) => (
                  <div key={index} className="flex items-center">
                    <div className="flex-1">
                      <p className="font-medium">{staff.name}</p>
                      <p className="text-sm text-secondary-500">{staff.role}</p>
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < staff.score ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">HR Quick Actions</h3>
              <div className="space-y-3">
                {hrQuickActions.map((action, index) => (
                  <Button key={index} variant="outline" className="w-full justify-start py-3" size="sm">
                    <action.icon className={`h-5 w-5 mr-3 ${action.color}`} />
                    {action.label}
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-secondary-900">Pending Actions Required</h4>
            <ul className="mt-2 text-sm text-secondary-700 space-y-1">
              <li>• {mockDashboardStats.pendingApplications} loan applications pending approval</li>
              <li>• 5 members have overdue loan payments</li>
              <li>• 2 investment certificates expiring this month</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
