import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Briefcase,
  Star,
  CheckSquare,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Building,
  ClipboardList,
  UserCheck,
  BarChart2
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { clsx } from 'clsx';
import { format } from 'date-fns';

// --- Mock Data & Types ---

interface Staff {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: 'Loans' | 'Member Services' | 'Operations' | 'Management' | 'IT';
  status: 'Active' | 'On Leave' | 'Inactive';
  hireDate: string;
  salary: number; // UGX
  performanceScore: number; // out of 100
  profileImage: string;
  address: string;
  nssfNumber: string;
  bank: {
    name: string;
    accountNumber: string;
  };
}

const mockStaff: Staff[] = [
  { id: 'stf1', employeeId: 'EMP-001', name: 'Jane Manager', email: 'jane.m@kawempesacco.com', phone: '+256772111222', role: 'General Manager', department: 'Management', status: 'Active', hireDate: '2020-01-15', salary: 4500000, performanceScore: 95, profileImage: 'https://randomuser.me/api/portraits/women/1.jpg', address: "Plot 1, Kampala Road", nssfNumber: "1234567890", bank: { name: "Stanbic Bank", accountNumber: "9030001234567" } },
  { id: 'stf2', employeeId: 'EMP-002', name: 'Peter Loan', email: 'peter.l@kawempesacco.com', phone: '+256782222333', role: 'Senior Loan Officer', department: 'Loans', status: 'Active', hireDate: '2021-03-10', salary: 2800000, performanceScore: 92, profileImage: 'https://randomuser.me/api/portraits/men/2.jpg', address: "Plot 2, Entebbe Road", nssfNumber: "2345678901", bank: { name: "Centenary Bank", accountNumber: "2019876543" } },
  { id: 'stf3', employeeId: 'EMP-003', name: 'Grace Cashier', email: 'grace.c@kawempesacco.com', phone: '+256752333444', role: 'Head Cashier', department: 'Operations', status: 'Active', hireDate: '2021-07-22', salary: 2200000, performanceScore: 88, profileImage: 'https://randomuser.me/api/portraits/women/3.jpg', address: "Plot 3, Jinja Road", nssfNumber: "3456789012", bank: { name: "DFCU Bank", accountNumber: "0101234567890" } },
  { id: 'stf4', employeeId: 'EMP-004', name: 'Sam Member', email: 'sam.m@kawempesacco.com', phone: '+256702444555', role: 'Member Services Rep', department: 'Member Services', status: 'On Leave', hireDate: '2022-02-01', salary: 1800000, performanceScore: 90, profileImage: 'https://randomuser.me/api/portraits/men/4.jpg', address: "Plot 4, Bombo Road", nssfNumber: "4567890123", bank: { name: "Absa Bank", accountNumber: "6001234567" } },
  { id: 'stf5', employeeId: 'EMP-005', name: 'Alice IT', email: 'alice.it@kawempesacco.com', phone: '+256792555666', role: 'IT Support Specialist', department: 'IT', status: 'Active', hireDate: '2023-01-20', salary: 2500000, performanceScore: 94, profileImage: 'https://randomuser.me/api/portraits/women/5.jpg', address: "Plot 5, Ggaba Road", nssfNumber: "5678901234", bank: { name: "Stanbic Bank", accountNumber: "9030007654321" } },
];

const mockActivityLog = [
  { staff: 'Peter Loan', action: 'Approved Loan', details: 'ID #L00123 for John Mukasa', time: '2h ago' },
  { staff: 'Grace Cashier', action: 'Processed Deposit', details: 'UGX 500,000 from Sarah Nakato', time: '3h ago' },
  { staff: 'Sam Member', action: 'Updated Member Profile', details: 'Robert Mugisha (KS003)', time: '5h ago' },
  { staff: 'Jane Manager', action: 'Generated Report', details: 'Q2 Financial Summary', time: '1d ago' },
];

// --- Utility Functions ---
const formatUGX = (amount: number): string => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(amount);
const formatDate = (dateString: string): string => format(new Date(dateString), 'dd MMM, yyyy');

// --- Main Component ---
export const StaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>(mockStaff);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewStaff, setIsNewStaff] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  const filteredStaff = useMemo(() => {
    return staffList.filter(staff =>
      (staff.name.toLowerCase().includes(searchTerm.toLowerCase()) || staff.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (departmentFilter === 'All' || staff.department === departmentFilter) &&
      (statusFilter === 'All' || staff.status === statusFilter)
    );
  }, [staffList, searchTerm, departmentFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: staffList.length,
    active: staffList.filter(s => s.status === 'Active').length,
    onLeave: staffList.filter(s => s.status === 'On Leave').length,
    departments: [...new Set(staffList.map(s => s.department))].length,
  }), [staffList]);

  const handleViewDetails = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsNewStaff(false);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedStaff({
      id: `stf${Date.now()}`, employeeId: `EMP-${(staffList.length + 1).toString().padStart(3, '0')}`, name: '', email: '', phone: '', role: '', department: 'Member Services', status: 'Active', hireDate: new Date().toISOString(), salary: 0, performanceScore: 0, profileImage: '', address: '', nssfNumber: '', bank: { name: '', accountNumber: '' }
    });
    setIsNewStaff(true);
    setIsModalOpen(true);
  };

  const handleSaveStaff = (staff: Staff) => {
    if (isNewStaff) {
      setStaffList(prev => [staff, ...prev]);
    } else {
      setStaffList(prev => prev.map(s => s.id === staff.id ? staff : s));
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Human Resource Management</h1>
        <p className="text-secondary-600 mt-1">Manage staff, performance, and HR operations.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard title="Total Staff" value={stats.total.toString()} icon={Users} iconColor="text-blue-600" />
        <StatCard title="Active Staff" value={stats.active.toString()} icon={UserCheck} iconColor="text-green-600" />
        <StatCard title="On Leave" value={stats.onLeave.toString()} icon={ClipboardList} iconColor="text-yellow-600" />
        <StatCard title="Departments" value={stats.departments.toString()} icon={Building} iconColor="text-purple-600" />
      </div>

      {/* Staff List & Filters */}
      <Card>
        <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search staff by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select onChange={(e) => setDepartmentFilter(e.target.value)} className="px-3 py-2 border border-secondary-300 rounded-lg text-sm">
              <option value="All">All Departments</option>
              <option>Loans</option>
              <option>Member Services</option>
              <option>Operations</option>
              <option>Management</option>
              <option>IT</option>
            </select>
            <select onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-secondary-300 rounded-lg text-sm">
              <option value="All">All Statuses</option>
              <option>Active</option>
              <option>On Leave</option>
              <option>Inactive</option>
            </select>
            <Button onClick={handleAddNew}><Plus className="h-4 w-4 mr-2" />Add Staff</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-4 py-3 text-left">Staff Member</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={5} className="p-4"><Skeleton height={40} /></td></tr>
              )) : filteredStaff.map(staff => (
                <tr key={staff.id} className="border-b last:border-0 hover:bg-secondary-50">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <img src={staff.profileImage} alt={staff.name} className="h-10 w-10 rounded-full object-cover" />
                      <div>
                        <p className="font-medium text-secondary-900">{staff.name}</p>
                        <p className="text-xs text-secondary-500">{staff.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-secondary-700">{staff.role}</td>
                  <td className="px-4 py-2 text-secondary-700">{staff.department}</td>
                  <td className="px-4 py-2">
                    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium',
                      staff.status === 'Active' && 'bg-green-100 text-green-800',
                      staff.status === 'On Leave' && 'bg-yellow-100 text-yellow-800',
                      staff.status === 'Inactive' && 'bg-red-100 text-red-800'
                    )}>
                      {staff.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewDetails(staff)}><Eye className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => handleViewDetails(staff)}><Edit className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Staff Details Modal */}
      {isModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{isNewStaff ? 'Add New Staff Member' : 'Staff Profile'}</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}><X className="h-5 w-5" /></Button>
              </div>
              <StaffDetailForm staff={selectedStaff} onSave={handleSaveStaff} isNew={isNewStaff} />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// --- Staff Detail Form Sub-component ---
const StaffDetailForm = ({ staff, onSave, isNew }: { staff: Staff, onSave: (staff: Staff) => void, isNew: boolean }) => {
  const [formData, setFormData] = useState(staff);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, bank: { ...prev.bank, [name]: value } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Personal Details */}
        <div>
          <h4 className="font-semibold text-secondary-800 mb-2">Personal & Contact Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
            <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
            <InputField label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} placeholder="+256..." required />
            <InputField label="Home Address" name="address" value={formData.address} onChange={handleChange} />
          </div>
        </div>

        {/* Employment Details */}
        <div>
          <h4 className="font-semibold text-secondary-800 mb-2">Employment Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="Employee ID" name="employeeId" value={formData.employeeId} onChange={handleChange} readOnly={!isNew} />
            <InputField label="Position/Role" name="role" value={formData.role} onChange={handleChange} required />
            <SelectField label="Department" name="department" value={formData.department} onChange={handleChange} options={['Loans', 'Member Services', 'Operations', 'Management', 'IT']} />
            <InputField label="Hire Date" name="hireDate" type="date" value={format(new Date(formData.hireDate), 'yyyy-MM-dd')} onChange={handleChange} />
            <SelectField label="Status" name="status" value={formData.status} onChange={handleChange} options={['Active', 'On Leave', 'Inactive']} />
          </div>
        </div>

        {/* Financial Details */}
        <div>
          <h4 className="font-semibold text-secondary-800 mb-2">Financial & Statutory Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="Monthly Salary (UGX)" name="salary" type="number" value={formData.salary.toString()} onChange={handleChange} />
            <InputField label="NSSF Number" name="nssfNumber" value={formData.nssfNumber} onChange={handleChange} />
            <InputField label="Bank Name" name="name" value={formData.bank.name} onChange={handleBankChange} />
            <InputField label="Bank Account Number" name="accountNumber" value={formData.bank.accountNumber} onChange={handleBankChange} />
          </div>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t flex justify-end">
        <Button type="submit"><Save className="h-4 w-4 mr-2" />{isNew ? 'Add Staff Member' : 'Save Changes'}</Button>
      </div>
    </form>
  );
};

// --- Reusable Form Field Components ---
const InputField = ({ label, ...props }: any) => (
  <div>
    <label className="block text-sm font-medium text-secondary-700 mb-1">{label}</label>
    <input {...props} className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
  </div>
);

const SelectField = ({ label, options, ...props }: any) => (
  <div>
    <label className="block text-sm font-medium text-secondary-700 mb-1">{label}</label>
    <select {...props} className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);
