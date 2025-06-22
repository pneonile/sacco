import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  Building,
  Edit,
  Trash,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  ReceiptText,
  Wallet,
  Banknote,
  ArrowUpCircle,
  ArrowDownCircle,
  ListFilter,
  ClipboardList,
  Percent,
  Scale,
  Hourglass,
  Users,
  Briefcase,
  AlertTriangle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/charts/StatCard';
import { AreaChart } from '../../components/charts/AreaChart';
import { Skeleton } from '../../components/ui/Skeleton';
import { format, parseISO, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import API from '../../services/api';
import { LedgerEntry, LedgerCategory, Vendor, User } from '../../types';

// Enums (should match backend models)
enum LedgerEntryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

enum PaymentMethod {
  CASH = 'cash',
  BANK = 'bank',
  MOBILE_MONEY = 'mobile_money',
  CHECK = 'check',
  ELECTRONIC_TRANSFER = 'electronic_transfer',
}

// Form data interface
interface LedgerEntryFormData {
  id?: string;
  type: LedgerEntryType;
  categoryId: string;
  amount: string;
  description: string;
  transactionDate: string;
  reference?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  hasReceipt: boolean;
  taxAmount?: string;
  taxRate?: string;
  taxExempt: boolean;
  taxReference?: string;
  budgetLineId?: string;
  accountCode?: string;
  vendorId?: string;
  vendorName?: string;
  vendorReference?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  isPaid: boolean;
  paymentDate?: string;
  checkNumber?: string;
  approvalStatus: ApprovalStatus;
  requestedBy?: string;
  approvedBy?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  customFields?: string; // JSON string
  attachments?: string; // JSON string
  notes?: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  projectCode?: string;
  departmentCode?: string;
}

// Mock Data (for development fallback)
const mockCategories: LedgerCategory[] = [
  { id: 'cat1', name: 'Salaries', type: LedgerEntryType.EXPENSE, code: 'EXP001', is_active: true, display_order: 1, annual_budget: 120000000, monthly_budget: 10000000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat2', name: 'Rent', type: LedgerEntryType.EXPENSE, code: 'EXP002', is_active: true, display_order: 2, annual_budget: 24000000, monthly_budget: 2000000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat3', name: 'Utilities', type: LedgerEntryType.EXPENSE, code: 'EXP003', is_active: true, display_order: 3, annual_budget: 6000000, monthly_budget: 500000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat4', name: 'Loan Interest Income', type: LedgerEntryType.INCOME, code: 'INC001', is_active: true, display_order: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat5', name: 'Membership Fees', type: LedgerEntryType.INCOME, code: 'INC002', is_active: true, display_order: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat6', name: 'Stationery', type: LedgerEntryType.EXPENSE, code: 'EXP004', is_active: true, display_order: 4, annual_budget: 1200000, monthly_budget: 100000, createdAt: new Date(), updatedAt: new Date() },
];

const mockVendors: Vendor[] = [
  { id: 'ven1', name: 'Office Supplies Ltd', contact_person: 'Jane Doe', phone_number: '+256771234567', email: 'jane@officesupplies.com', address: 'Kampala', is_active: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ven2', name: 'Power Distribution Co', contact_person: 'John Smith', phone_number: '+256701987654', email: 'john@power.com', address: 'Entebbe', is_active: true, createdAt: new Date(), updatedAt: new Date() },
];

const mockLedgerEntries: LedgerEntry[] = [
  {
    id: 'le1', type: LedgerEntryType.EXPENSE, category_id: 'cat1', amount: 10000000, description: 'June Salaries', transaction_date: '2025-06-20',
    reference: 'SAL-JUN-25', payment_method: PaymentMethod.BANK, is_paid: true, payment_date: '2025-06-20', approval_status: ApprovalStatus.APPROVED,
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'le2', type: LedgerEntryType.EXPENSE, category_id: 'cat2', amount: 2000000, description: 'July Office Rent', transaction_date: '2025-07-01',
    reference: 'RENT-JUL-25', payment_method: PaymentMethod.ELECTRONIC_TRANSFER, is_paid: false, approval_status: ApprovalStatus.PENDING,
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'le3', type: LedgerEntryType.INCOME, category_id: 'cat4', amount: 5000000, description: 'Loan Interest Collection - Q2', transaction_date: '2025-06-30',
    reference: 'INC-Q2-25', payment_method: PaymentMethod.BANK, is_paid: true, payment_date: '2025-06-30', approval_status: ApprovalStatus.APPROVED,
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'le4', type: LedgerEntryType.EXPENSE, category_id: 'cat3', amount: 550000, description: 'June Electricity Bill', transaction_date: '2025-06-15',
    reference: 'UTIL-JUN-25', payment_method: PaymentMethod.MOBILE_MONEY, is_paid: true, payment_date: '2025-06-15', approval_status: ApprovalStatus.APPROVED,
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'le5', type: LedgerEntryType.INCOME, category_id: 'cat5', amount: 1500000, description: 'New Member Registration Fees', transaction_date: '2025-06-25',
    reference: 'MEM-REG-JUN', payment_method: PaymentMethod.CASH, is_paid: true, payment_date: '2025-06-25', approval_status: ApprovalStatus.APPROVED,
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'le6', type: LedgerEntryType.EXPENSE, category_id: 'cat6', amount: 120000, description: 'Office Stationery Purchase', transaction_date: '2025-06-10',
    reference: 'STAT-JUN-25', payment_method: PaymentMethod.CASH, is_paid: true, payment_date: '2025-06-10', approval_status: ApprovalStatus.APPROVED,
    createdAt: new Date(), updatedAt: new Date()
  },
];

export const IncomeExpensePage: React.FC = () => {
  // State for ledger entries data
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [categories, setCategories] = useState<LedgerCategory[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for summary data
  const [summaryData, setSummaryData] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    pendingApprovals: 0,
    budgetUtilization: 0,
  });

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('thisMonth'); // 'thisMonth', 'lastMonth', 'thisYear', 'custom'
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('transactionDate');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // State for modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // State for form
  const [formData, setFormData] = useState<LedgerEntryFormData>({
    type: LedgerEntryType.EXPENSE,
    categoryId: '',
    amount: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
    hasReceipt: false,
    taxExempt: false,
    isPaid: true,
    approvalStatus: ApprovalStatus.PENDING,
    isRecurring: false,
  });

  // Fetch initial data (ledger entries, categories, vendors)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch categories
        const categoriesResponse = await API.accounting.getLedgerCategories();
        setCategories(categoriesResponse.data.categories);

        // Fetch vendors
        const vendorsResponse = await API.settings.getEmployers(); // Assuming vendors are managed as employers for now
        setVendors(vendorsResponse.data);

        // Fetch ledger entries
        const entriesResponse = await API.accounting.getLedgerEntries({
          type: typeFilter !== 'all' ? typeFilter as LedgerEntryType : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchTerm,
          sortBy,
          sortDirection,
          fromDate: dateRangeFilter === 'custom' ? customStartDate : undefined,
          toDate: dateRangeFilter === 'custom' ? customEndDate : undefined,
        });
        setLedgerEntries(entriesResponse.data.ledgerEntries);

        // Calculate summary data
        const totalIncome = entriesResponse.data.ledgerEntries
          .filter(e => e.type === LedgerEntryType.INCOME)
          .reduce((sum, e) => sum + e.amount, 0);
        const totalExpense = entriesResponse.data.ledgerEntries
          .filter(e => e.type === LedgerEntryType.EXPENSE)
          .reduce((sum, e) => sum + e.amount, 0);
        const netProfit = totalIncome - totalExpense;
        const pendingApprovals = entriesResponse.data.ledgerEntries
          .filter(e => e.approval_status === ApprovalStatus.PENDING)
          .length;

        // Simple budget utilization calculation (needs more sophisticated logic with budget lines)
        const totalBudgetedExpense = categories
          .filter(c => c.type === LedgerEntryType.EXPENSE && c.monthly_budget)
          .reduce((sum, c) => sum + (c.monthly_budget || 0), 0);
        const budgetUtilization = totalBudgetedExpense > 0 ? (totalExpense / totalBudgetedExpense) * 100 : 0;

        setSummaryData({
          totalIncome,
          totalExpense,
          netProfit,
          pendingApprovals,
          budgetUtilization,
        });

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');

        // Fallback to mock data for demonstration
        setLedgerEntries(mockLedgerEntries);
        setCategories(mockCategories);
        setVendors(mockVendors);

        const totalIncome = mockLedgerEntries
          .filter(e => e.type === LedgerEntryType.INCOME)
          .reduce((sum, e) => sum + e.amount, 0);
        const totalExpense = mockLedgerEntries
          .filter(e => e.type === LedgerEntryType.EXPENSE)
          .reduce((sum, e) => sum + e.amount, 0);
        const netProfit = totalIncome - totalExpense;
        const pendingApprovals = mockLedgerEntries
          .filter(e => e.approval_status === ApprovalStatus.PENDING)
          .length;

        const totalBudgetedExpense = mockCategories
          .filter(c => c.type === LedgerEntryType.EXPENSE && c.monthly_budget)
          .reduce((sum, c) => sum + (c.monthly_budget || 0), 0);
        const budgetUtilization = totalBudgetedExpense > 0 ? (totalExpense / totalBudgetedExpense) * 100 : 0;

        setSummaryData({
          totalIncome,
          totalExpense,
          netProfit,
          pendingApprovals,
          budgetUtilization,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [typeFilter, categoryFilter, vendorFilter, statusFilter, dateRangeFilter, customStartDate, customEndDate, sortBy, sortDirection, searchTerm]);

  // Filter ledger entries based on search term
  const filteredEntries = useMemo(() => {
    if (!searchTerm) return ledgerEntries;

    return ledgerEntries.filter(entry => 
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ledgerEntries, searchTerm]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  // Get vendor name by ID
  const getVendorName = (vendorId?: string) => {
    if (!vendorId) return '';
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor ? vendor.name : '';
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'categoryId' && value) {
      // When category changes, update the tax rate based on category type
      const selectedCategory = categories.find(c => c.id === value);
      if (selectedCategory) {
        // You could set default tax rates based on category
        setFormData(prev => ({ 
          ...prev, 
          [name]: value,
          // Example: Different tax rates for different category types
          taxRate: selectedCategory.type === LedgerEntryType.INCOME ? '0' : '18',
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'vendorId' && value) {
      // When vendor changes, update the vendor name
      const selectedVendor = vendors.find(v => v.id === value);
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        vendorName: selectedVendor ? selectedVendor.name : '',
      }));
    } else if (name === 'amount' || name === 'taxRate') {
      // When amount or tax rate changes, calculate tax amount
      setFormData(prev => {
        const updatedData = { ...prev, [name]: value };
        
        if (!updatedData.taxExempt && updatedData.amount && updatedData.taxRate) {
          const amount = parseFloat(updatedData.amount);
          const taxRate = parseFloat(updatedData.taxRate);
          if (!isNaN(amount) && !isNaN(taxRate)) {
            updatedData.taxAmount = ((amount * taxRate) / 100).toFixed(2);
          }
        }
        
        return updatedData;
      });
    } else if (name === 'taxExempt') {
      // When tax exempt changes, clear or recalculate tax amount
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => {
        const updatedData = { ...prev, [name]: checked };
        
        if (checked) {
          updatedData.taxAmount = '0';
          updatedData.taxRate = '0';
        } else if (updatedData.amount && prev.taxRate) {
          const amount = parseFloat(updatedData.amount);
          const taxRate = parseFloat(prev.taxRate);
          if (!isNaN(amount) && !isNaN(taxRate)) {
            updatedData.taxAmount = ((amount * taxRate) / 100).toFixed(2);
          }
        }
        
        return updatedData;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Reset form to default values
  const resetForm = () => {
    setFormData({
      type: LedgerEntryType.EXPENSE,
      categoryId: '',
      amount: '',
      description: '',
      transactionDate: new Date().toISOString().split('T')[0],
      hasReceipt: false,
      taxExempt: false,
      isPaid: true,
      approvalStatus: ApprovalStatus.PENDING,
      isRecurring: false,
    });
    setIsEditing(false);
    setSelectedEntry(null);
  };

  // Open edit modal with entry data
  const handleEditEntry = (entry: LedgerEntry) => {
    setSelectedEntry(entry);
    setIsEditing(true);
    
    setFormData({
      id: entry.id,
      type: entry.type,
      categoryId: entry.category_id,
      amount: entry.amount.toString(),
      description: entry.description,
      transactionDate: entry.transaction_date,
      reference: entry.reference || '',
      receiptNumber: entry.receipt_number || '',
      receiptUrl: entry.receipt_url || '',
      hasReceipt: !!entry.receipt_url,
      taxAmount: entry.tax_amount?.toString() || '',
      taxRate: entry.tax_rate?.toString() || '',
      taxExempt: entry.tax_exempt || false,
      taxReference: entry.tax_reference || '',
      budgetLineId: entry.budget_line_id || '',
      accountCode: entry.account_code || '',
      vendorId: entry.vendor_id || '',
      vendorName: entry.vendor_name || '',
      vendorReference: entry.vendor_reference || '',
      invoiceNumber: entry.invoice_number || '',
      invoiceDate: entry.invoice_date || '',
      dueDate: entry.due_date || '',
      paymentMethod: entry.payment_method,
      paymentReference: entry.payment_reference || '',
      isPaid: entry.is_paid,
      paymentDate: entry.payment_date || '',
      checkNumber: entry.check_number || '',
      approvalStatus: entry.approval_status,
      requestedBy: entry.requested_by || '',
      approvedBy: entry.approved_by || '',
      approvalNotes: entry.approval_notes || '',
      rejectionReason: entry.rejection_reason || '',
      customFields: entry.custom_fields || '',
      attachments: entry.attachments || '',
      notes: entry.notes || '',
      isRecurring: entry.is_recurring || false,
      recurrencePattern: entry.recurrence_pattern || '',
      projectCode: entry.project_code || '',
      departmentCode: entry.department_code || '',
    });
    
    setShowAddEditModal(true);
  };

  // Open view modal with entry data
  const handleViewEntry = (entry: LedgerEntry) => {
    setSelectedEntry(entry);
    setShowViewModal(true);
  };

  // Handle add/edit form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Prepare data for API
      const entryData: Partial<LedgerEntry> = {
        type: formData.type,
        category_id: formData.categoryId,
        amount: parseFloat(formData.amount),
        description: formData.description,
        transaction_date: formData.transactionDate,
        reference: formData.reference,
        receipt_number: formData.receiptNumber,
        receipt_url: formData.receiptUrl,
        tax_amount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
        tax_rate: formData.taxRate ? parseFloat(formData.taxRate) : undefined,
        tax_exempt: formData.taxExempt,
        tax_reference: formData.taxReference,
        budget_line_id: formData.budgetLineId,
        account_code: formData.accountCode,
        vendor_id: formData.vendorId,
        vendor_name: formData.vendorName,
        vendor_reference: formData.vendorReference,
        invoice_number: formData.invoiceNumber,
        invoice_date: formData.invoiceDate,
        due_date: formData.dueDate,
        payment_method: formData.paymentMethod,
        payment_reference: formData.paymentReference,
        is_paid: formData.isPaid,
        payment_date: formData.paymentDate,
        check_number: formData.checkNumber,
        approval_status: formData.approvalStatus,
        requested_by: formData.requestedBy,
        approved_by: formData.approvedBy,
        approval_notes: formData.approvalNotes,
        rejection_reason: formData.rejectionReason,
        custom_fields: formData.customFields,
        attachments: formData.attachments,
        notes: formData.notes,
        is_recurring: formData.isRecurring,
        recurrence_pattern: formData.recurrencePattern,
        project_code: formData.projectCode,
        department_code: formData.departmentCode,
      };
      
      let response;
      
      if (isEditing && formData.id) {
        // Update existing entry
        response = await API.accounting.updateLedgerEntry(formData.id, entryData);
        
        // Update local state
        setLedgerEntries(prev => 
          prev.map(entry => entry.id === formData.id ? response.data : entry)
        );
      } else {
        // Create new entry
        response = await API.accounting.createLedgerEntry(entryData);
        
        // Update local state
        setLedgerEntries(prev => [response.data, ...prev]);
      }
      
      // Close modal and reset form
      setShowAddEditModal(false);
      resetForm();
      
      // Update summary data
      const updatedEntry = response.data;
      setSummaryData(prev => {
        let newSummary = { ...prev };
        
        if (isEditing && selectedEntry) {
          // Remove old entry from totals
          if (selectedEntry.type === LedgerEntryType.INCOME) {
            newSummary.totalIncome -= selectedEntry.amount;
          } else {
            newSummary.totalExpense -= selectedEntry.amount;
          }
          
          // Remove from pending approvals if status changed
          if (selectedEntry.approval_status === ApprovalStatus.PENDING && 
              updatedEntry.approval_status !== ApprovalStatus.PENDING) {
            newSummary.pendingApprovals--;
          }
        }
        
        // Add new/updated entry to totals
        if (updatedEntry.type === LedgerEntryType.INCOME) {
          newSummary.totalIncome += updatedEntry.amount;
        } else {
          newSummary.totalExpense += updatedEntry.amount;
        }
        
        // Add to pending approvals if needed
        if (updatedEntry.approval_status === ApprovalStatus.PENDING &&
            (!selectedEntry || selectedEntry.approval_status !== ApprovalStatus.PENDING)) {
          newSummary.pendingApprovals++;
        }
        
        // Recalculate net profit
        newSummary.netProfit = newSummary.totalIncome - newSummary.totalExpense;
        
        return newSummary;
      });
      
    } catch (err) {
      console.error('Error saving ledger entry:', err);
      setError('Failed to save entry. Please try again later.');
      
      // For demonstration, update local state anyway
      const mockEntry: LedgerEntry = {
        id: isEditing && formData.id ? formData.id : `temp-${Date.now()}`,
        type: formData.type,
        category_id: formData.categoryId,
        amount: parseFloat(formData.amount),
        description: formData.description,
        transaction_date: formData.transactionDate,
        reference: formData.reference,
        receipt_number: formData.receiptNumber,
        receipt_url: formData.receiptUrl,
        tax_amount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
        tax_rate: formData.taxRate ? parseFloat(formData.taxRate) : undefined,
        tax_exempt: formData.taxExempt,
        tax_reference: formData.taxReference,
        budget_line_id: formData.budgetLineId,
        account_code: formData.accountCode,
        vendor_id: formData.vendorId,
        vendor_name: formData.vendorName,
        vendor_reference: formData.vendorReference,
        invoice_number: formData.invoiceNumber,
        invoice_date: formData.invoiceDate,
        due_date: formData.dueDate,
        payment_method: formData.paymentMethod,
        payment_reference: formData.paymentReference,
        is_paid: formData.isPaid,
        payment_date: formData.paymentDate,
        check_number: formData.checkNumber,
        approval_status: formData.approvalStatus,
        requested_by: formData.requestedBy,
        approved_by: formData.approvedBy,
        approval_notes: formData.approvalNotes,
        rejection_reason: formData.rejectionReason,
        custom_fields: formData.customFields,
        attachments: formData.attachments,
        notes: formData.notes,
        is_recurring: formData.isRecurring,
        recurrence_pattern: formData.recurrencePattern,
        project_code: formData.projectCode,
        department_code: formData.departmentCode,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      if (isEditing && formData.id) {
        // Update existing entry
        setLedgerEntries(prev => 
          prev.map(entry => entry.id === formData.id ? mockEntry : entry)
        );
      } else {
        // Create new entry
        setLedgerEntries(prev => [mockEntry, ...prev]);
      }
      
      // Close modal and reset form
      setShowAddEditModal(false);
      resetForm();
      
      // Update summary data
      setSummaryData(prev => {
        let newSummary = { ...prev };
        
        if (isEditing && selectedEntry) {
          // Remove old entry from totals
          if (selectedEntry.type === LedgerEntryType.INCOME) {
            newSummary.totalIncome -= selectedEntry.amount;
          } else {
            newSummary.totalExpense -= selectedEntry.amount;
          }
          
          // Remove from pending approvals if status changed
          if (selectedEntry.approval_status === ApprovalStatus.PENDING && 
              mockEntry.approval_status !== ApprovalStatus.PENDING) {
            newSummary.pendingApprovals--;
          }
        }
        
        // Add new/updated entry to totals
        if (mockEntry.type === LedgerEntryType.INCOME) {
          newSummary.totalIncome += mockEntry.amount;
        } else {
          newSummary.totalExpense += mockEntry.amount;
        }
        
        // Add to pending approvals if needed
        if (mockEntry.approval_status === ApprovalStatus.PENDING &&
            (!selectedEntry || selectedEntry.approval_status !== ApprovalStatus.PENDING)) {
          newSummary.pendingApprovals++;
        }
        
        // Recalculate net profit
        newSummary.netProfit = newSummary.totalIncome - newSummary.totalExpense;
        
        return newSummary;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Find the entry to be deleted (for updating summary data later)
      const entryToDelete = ledgerEntries.find(e => e.id === entryId);
      if (!entryToDelete) return;
      
      // Call API to delete entry
      await API.accounting.deleteLedgerEntry(entryId);
      
      // Update local state
      setLedgerEntries(prev => prev.filter(entry => entry.id !== entryId));
      
      // Update summary data
      setSummaryData(prev => {
        let newSummary = { ...prev };
        
        // Remove entry from totals
        if (entryToDelete.type === LedgerEntryType.INCOME) {
          newSummary.totalIncome -= entryToDelete.amount;
        } else {
          newSummary.totalExpense -= entryToDelete.amount;
        }
        
        // Remove from pending approvals if needed
        if (entryToDelete.approval_status === ApprovalStatus.PENDING) {
          newSummary.pendingApprovals--;
        }
        
        // Recalculate net profit
        newSummary.netProfit = newSummary.totalIncome - newSummary.totalExpense;
        
        return newSummary;
      });
      
    } catch (err) {
      console.error('Error deleting ledger entry:', err);
      setError('Failed to delete entry. Please try again later.');
      
      // For demonstration, update local state anyway
      setLedgerEntries(prev => prev.filter(entry => entry.id !== entryId));
      
      // Find the entry to be deleted (for updating summary data)
      const entryToDelete = ledgerEntries.find(e => e.id === entryId);
      if (!entryToDelete) return;
      
      // Update summary data
      setSummaryData(prev => {
        let newSummary = { ...prev };
        
        // Remove entry from totals
        if (entryToDelete.type === LedgerEntryType.INCOME) {
          newSummary.totalIncome -= entryToDelete.amount;
        } else {
          newSummary.totalExpense -= entryToDelete.amount;
        }
        
        // Remove from pending approvals if needed
        if (entryToDelete.approval_status === ApprovalStatus.PENDING) {
          newSummary.pendingApprovals--;
        }
        
        // Recalculate net profit
        newSummary.netProfit = newSummary.totalIncome - newSummary.totalExpense;
        
        return newSummary;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle approve/reject entry
  const handleApproveReject = async (entryId: string, status: ApprovalStatus, notes?: string) => {
    setIsLoading(true);
    
    try {
      // Call API to update approval status
      const response = await API.accounting.updateLedgerEntry(entryId, {
        approval_status: status,
        approval_notes: notes,
        approved_by: 'current-user-id', // In a real app, this would be the current user's ID
      });
      
      // Update local state
      setLedgerEntries(prev => 
        prev.map(entry => entry.id === entryId ? response.data : entry)
      );
      
      // Update summary data
      setSummaryData(prev => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1,
      }));
      
      // Close view modal if open
      if (showViewModal) {
        setShowViewModal(false);
        setSelectedEntry(null);
      }
      
    } catch (err) {
      console.error('Error updating approval status:', err);
      setError('Failed to update approval status. Please try again later.');
      
      // For demonstration, update local state anyway
      setLedgerEntries(prev => 
        prev.map(entry => {
          if (entry.id === entryId) {
            return {
              ...entry,
              approval_status: status,
              approval_notes: notes,
              approved_by: 'current-user-id',
            };
          }
          return entry;
        })
      );
      
      // Update summary data
      setSummaryData(prev => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1,
      }));
      
      // Close view modal if open
      if (showViewModal) {
        setShowViewModal(false);
        setSelectedEntry(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle export to CSV
  const handleExport = () => {
    // Prepare CSV data
    const headers = [
      'Type', 'Category', 'Amount', 'Description', 'Transaction Date',
      'Reference', 'Vendor', 'Invoice Number', 'Payment Method', 'Status',
      'Tax Amount', 'Tax Rate', 'Tax Exempt'
    ];
    
    const rows = filteredEntries.map(entry => [
      entry.type,
      getCategoryName(entry.category_id),
      entry.amount,
      entry.description,
      entry.transaction_date,
      entry.reference || '',
      entry.vendor_name || '',
      entry.invoice_number || '',
      entry.payment_method || '',
      entry.approval_status,
      entry.tax_amount || '0',
      entry.tax_rate || '0',
      entry.tax_exempt ? 'Yes' : 'No'
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Wrap text fields in quotes and escape any quotes within
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(','))
    ].join('\n');
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `income-expense-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle date range filter changes
  const handleDateRangeChange = (range: string) => {
    setDateRangeFilter(range);
    
    const today = new Date();
    
    if (range === 'thisMonth') {
      const startDate = startOfMonth(today);
      const endDate = endOfMonth(today);
      setCustomStartDate(format(startDate, 'yyyy-MM-dd'));
      setCustomEndDate(format(endDate, 'yyyy-MM-dd'));
    } else if (range === 'lastMonth') {
      const lastMonth = subMonths(today, 1);
      const startDate = startOfMonth(lastMonth);
      const endDate = endOfMonth(lastMonth);
      setCustomStartDate(format(startDate, 'yyyy-MM-dd'));
      setCustomEndDate(format(endDate, 'yyyy-MM-dd'));
    } else if (range === 'thisYear') {
      const startDate = new Date(today.getFullYear(), 0, 1);
      const endDate = new Date(today.getFullYear(), 11, 31);
      setCustomStartDate(format(startDate, 'yyyy-MM-dd'));
      setCustomEndDate(format(endDate, 'yyyy-MM-dd'));
    }
    // For 'custom', we don't set the dates here; the user will input them
  };

  // Calculate monthly data for charts
  const monthlyData = useMemo(() => {
    const months = [];
    const today = new Date();
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(today, i);
      const monthName = format(month, 'MMM');
      
      const startDate = startOfMonth(month);
      const endDate = endOfMonth(month);
      
      // Filter entries for this month
      const monthEntries = ledgerEntries.filter(entry => {
        const entryDate = parseISO(entry.transaction_date);
        return entryDate >= startDate && entryDate <= endDate;
      });
      
      // Calculate income and expense totals
      const income = monthEntries
        .filter(e => e.type === LedgerEntryType.INCOME)
        .reduce((sum, e) => sum + e.amount, 0);
      
      const expense = monthEntries
        .filter(e => e.type === LedgerEntryType.EXPENSE)
        .reduce((sum, e) => sum + e.amount, 0);
      
      months.push({
        name: monthName,
        income,
        expense,
        profit: income - expense
      });
    }
    
    return months;
  }, [ledgerEntries]);

  // Calculate category breakdown for charts
  const categoryBreakdown = useMemo(() => {
    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};
    
    // Group entries by category
    ledgerEntries.forEach(entry => {
      const categoryName = getCategoryName(entry.category_id);
      
      if (entry.type === LedgerEntryType.INCOME) {
        incomeByCategory[categoryName] = (incomeByCategory[categoryName] || 0) + entry.amount;
      } else {
        expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + entry.amount;
      }
    });
    
    // Convert to arrays for charts
    const incomeCategories = Object.entries(incomeByCategory).map(([name, value]) => ({
      name,
      value
    }));
    
    const expenseCategories = Object.entries(expenseByCategory).map(([name, value]) => ({
      name,
      value
    }));
    
    return {
      income: incomeCategories,
      expense: expenseCategories
    };
  }, [ledgerEntries, categories]);

  // Calculate budget vs actual for expense categories
  const budgetVsActual = useMemo(() => {
    // Get current month
    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = endOfMonth(today);
    
    // Filter entries for current month
    const currentMonthEntries = ledgerEntries.filter(entry => {
      const entryDate = parseISO(entry.transaction_date);
      return entry.type === LedgerEntryType.EXPENSE &&
             entryDate >= startDate && entryDate <= endDate;
    });
    
    // Calculate actual expenses by category
    const actualByCategory: Record<string, number> = {};
    currentMonthEntries.forEach(entry => {
      const categoryId = entry.category_id;
      actualByCategory[categoryId] = (actualByCategory[categoryId] || 0) + entry.amount;
    });
    
    // Combine with budget data
    return categories
      .filter(category => category.type === LedgerEntryType.EXPENSE && category.monthly_budget)
      .map(category => {
        const actual = actualByCategory[category.id] || 0;
        const budget = category.monthly_budget || 0;
        const variance = budget - actual;
        const utilizationPercentage = budget > 0 ? (actual / budget) * 100 : 0;
        
        return {
          category: category.name,
          budget,
          actual,
          variance,
          utilizationPercentage
        };
      })
      .sort((a, b) => b.actual - a.actual); // Sort by highest actual expense
  }, [ledgerEntries, categories]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Income & Expense Management</h1>
        <p className="text-secondary-600 mt-1">
          Track financial transactions, manage budget, and generate reports
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
          title="Total Income"
          value={formatCurrency(summaryData.totalIncome)}
          icon={ArrowUpCircle}
          iconColor="text-green-600"
          loading={isLoading}
        />
        
        <StatCard
          title="Total Expenses"
          value={formatCurrency(summaryData.totalExpense)}
          icon={ArrowDownCircle}
          iconColor="text-red-600"
          loading={isLoading}
        />
        
        <StatCard
          title="Net Profit"
          value={formatCurrency(summaryData.netProfit)}
          change={`${summaryData.totalIncome > 0 ? ((summaryData.netProfit / summaryData.totalIncome) * 100).toFixed(1) : 0}% margin`}
          changeType={summaryData.netProfit >= 0 ? 'positive' : 'negative'}
          icon={Wallet}
          iconColor={summaryData.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}
          loading={isLoading}
        />
        
        <StatCard
          title="Budget Utilization"
          value={`${summaryData.budgetUtilization.toFixed(1)}%`}
          icon={ClipboardList}
          iconColor={
            summaryData.budgetUtilization > 95 ? 'text-red-600' :
            summaryData.budgetUtilization > 80 ? 'text-orange-600' :
            'text-blue-600'
          }
          loading={isLoading}
        />
        
        <StatCard
          title="Pending Approvals"
          value={summaryData.pendingApprovals.toString()}
          icon={Hourglass}
          iconColor={summaryData.pendingApprovals > 0 ? 'text-yellow-600' : 'text-gray-600'}
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
                  placeholder="Search transactions..."
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
                <option value={LedgerEntryType.INCOME}>Income</option>
                <option value={LedgerEntryType.EXPENSE}>Expense</option>
              </select>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />Export
              </Button>
              <Button onClick={() => {
                resetForm();
                setShowAddEditModal(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />Add Entry
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 border-t border-secondary-200 pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-secondary-500" />
              <label className="text-sm font-medium text-secondary-700">Date Range:</label>
              <select
                value={dateRangeFilter}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisYear">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
              
              {dateRangeFilter === 'custom' && (
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              <Filter className="h-4 w-4 text-secondary-500" />
              <label className="text-sm font-medium text-secondary-700">Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="transactionDate">Date</option>
                <option value="amount">Amount</option>
                <option value="description">Description</option>
                <option value="categoryId">Category</option>
              </select>
              
              <select
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Transactions Table */}
      <Card className="mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap"><Skeleton height={20} width={80} /></td>
                    <td className="px-6 py-4 whitespace-nowrap"><Skeleton height={20} width={60} /></td>
                    <td className="px-6 py-4 whitespace-nowrap"><Skeleton height={20} width={100} /></td>
                    <td className="px-6 py-4 whitespace-nowrap"><Skeleton height={20} width={150} /></td>
                    <td className="px-6 py-4 whitespace-nowrap"><Skeleton height={20} width={80} /></td>
                    <td className="px-6 py-4 whitespace-nowrap"><Skeleton height={20} width={70} /></td>
                    <td className="px-6 py-4 whitespace-nowrap"><Skeleton height={20} width={100} /></td>
                  </tr>
                ))
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-secondary-500">
                    No transactions found. Add your first entry to get started.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(parseISO(entry.transaction_date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.type === LedgerEntryType.INCOME 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {entry.type === LedgerEntryType.INCOME ? (
                          <ArrowUpCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownCircle className="h-3 w-3 mr-1" />
                        )}
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCategoryName(entry.category_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-secondary-900">{entry.description}</span>
                        {entry.reference && (
                          <span className="text-xs text-secondary-500">Ref: {entry.reference}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${
                        entry.type === LedgerEntryType.INCOME 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {entry.type === LedgerEntryType.INCOME ? '+' : '-'}{formatCurrency(entry.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        entry.approval_status === ApprovalStatus.APPROVED 
                          ? 'bg-green-100 text-green-800' 
                          : entry.approval_status === ApprovalStatus.REJECTED
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {entry.approval_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewEntry(entry)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditEntry(entry)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteEntry(entry.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Income/Expense Chart */}
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Monthly Financial Overview</h3>
            <AreaChart
              data={monthlyData}
              dataKey="income"
              secondaryDataKey="expense"
              color="#10b981"
              secondaryColor="#ef4444"
              title="Income vs Expense"
            />
          </div>
        </Card>
        
        {/* Budget vs Actual */}
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Budget vs Actual (This Month)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Category</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Budget</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Actual</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Variance</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-200">
                  {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2"><Skeleton height={20} width={100} /></td>
                        <td className="px-4 py-2"><Skeleton height={20} width={80} /></td>
                        <td className="px-4 py-2"><Skeleton height={20} width={80} /></td>
                        <td className="px-4 py-2"><Skeleton height={20} width={80} /></td>
                        <td className="px-4 py-2"><Skeleton height={20} width={60} /></td>
                      </tr>
                    ))
                  ) : budgetVsActual.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-2 text-center text-secondary-500">
                        No budget data available.
                      </td>
                    </tr>
                  ) : (
                    budgetVsActual.map((item, index) => (
                      <tr key={index} className="hover:bg-secondary-50">
                        <td className="px-4 py-2 font-medium">{item.category}</td>
                        <td className="px-4 py-2">{formatCurrency(item.budget)}</td>
                        <td className="px-4 py-2">{formatCurrency(item.actual)}</td>
                        <td className={`px-4 py-2 ${
                          item.variance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center">
                            <div className="w-full bg-secondary-200 rounded-full h-2.5 mr-2">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  item.utilizationPercentage > 95 ? 'bg-red-600' :
                                  item.utilizationPercentage > 80 ? 'bg-yellow-500' :
                                  'bg-green-600'
                                }`}
                                style={{ width: `${Math.min(item.utilizationPercentage, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs whitespace-nowrap">{item.utilizationPercentage.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Income Categories */}
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Income by Category</h3>
            {isLoading ? (
              <div className="space-y-2">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton height={20} width={100} />
                    <Skeleton height={20} width={80} />
                  </div>
                ))}
              </div>
            ) : categoryBreakdown.income.length === 0 ? (
              <p className="text-center text-secondary-500 py-4">
                No income data available.
              </p>
            ) : (
              <div className="space-y-4">
                {categoryBreakdown.income
                  .sort((a, b) => b.value - a.value)
                  .map((category, index) => {
                    const percentage = summaryData.totalIncome > 0 
                      ? (category.value / summaryData.totalIncome) * 100 
                      : 0;
                    
                    return (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-secondary-900">{category.name}</span>
                          <span className="text-green-600 font-medium">{formatCurrency(category.value)}</span>
                        </div>
                        <div className="w-full bg-secondary-200 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full bg-green-600"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-secondary-500">{percentage.toFixed(1)}% of total income</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </Card>
        
        {/* Expense Categories */}
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Expenses by Category</h3>
            {isLoading ? (
              <div className="space-y-2">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton height={20} width={100} />
                    <Skeleton height={20} width={80} />
                  </div>
                ))}
              </div>
            ) : categoryBreakdown.expense.length === 0 ? (
              <p className="text-center text-secondary-500 py-4">
                No expense data available.
              </p>
            ) : (
              <div className="space-y-4">
                {categoryBreakdown.expense
                  .sort((a, b) => b.value - a.value)
                  .map((category, index) => {
                    const percentage = summaryData.totalExpense > 0 
                      ? (category.value / summaryData.totalExpense) * 100 
                      : 0;
                    
                    return (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-secondary-900">{category.name}</span>
                          <span className="text-red-600 font-medium">{formatCurrency(category.value)}</span>
                        </div>
                        <div className="w-full bg-secondary-200 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full bg-red-600"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-secondary-500">{percentage.toFixed(1)}% of total expenses</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </Card>
      </div>
      
      {/* Pending Approvals */}
      <Card className="mb-6">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            <Hourglass className="h-5 w-5 inline-block mr-2 text-yellow-600" />
            Pending Approvals
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Description</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Requested By</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2"><Skeleton height={20} width={80} /></td>
                      <td className="px-4 py-2"><Skeleton height={20} width={60} /></td>
                      <td className="px-4 py-2"><Skeleton height={20} width={150} /></td>
                      <td className="px-4 py-2"><Skeleton height={20} width={80} /></td>
                      <td className="px-4 py-2"><Skeleton height={20} width={100} /></td>
                      <td className="px-4 py-2"><Skeleton height={20} width={120} /></td>
                    </tr>
                  ))
                ) : (
                  ledgerEntries
                    .filter(entry => entry.approval_status === ApprovalStatus.PENDING)
                    .map(entry => (
                      <tr key={entry.id} className="hover:bg-secondary-50">
                        <td className="px-4 py-2 whitespace-nowrap">
                          {format(parseISO(entry.transaction_date), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            entry.type === LedgerEntryType.INCOME 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className="font-medium">{entry.description}</span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap font-medium">
                          {formatCurrency(entry.amount)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {entry.requested_by || 'Unknown'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="success" 
                              onClick={() => handleApproveReject(entry.id, ApprovalStatus.APPROVED)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="danger" 
                              onClick={() => handleApproveReject(entry.id, ApprovalStatus.REJECTED, 'Rejected by admin')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
                
                {!isLoading && ledgerEntries.filter(entry => entry.approval_status === ApprovalStatus.PENDING).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-2 text-center text-secondary-500">
                      No pending approvals.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
      
      {/* Add/Edit Entry Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-screen overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {isEditing ? 'Edit' : 'Add'} {formData.type === LedgerEntryType.INCOME ? 'Income' : 'Expense'} Entry
                </h3>
                
                {/* Transaction Type Tabs */}
                <div className="flex mb-6 border-b border-secondary-200">
                  <button
                    type="button"
                    className={`py-2 px-4 font-medium ${
                      formData.type === LedgerEntryType.INCOME
                        ? 'text-primary-600 border-b-2 border-primary-500'
                        : 'text-secondary-500 hover:text-secondary-700'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, type: LedgerEntryType.INCOME }))}
                  >
                    <ArrowUpCircle className="h-4 w-4 inline-block mr-1" />
                    Income
                  </button>
                  <button
                    type="button"
                    className={`py-2 px-4 font-medium ${
                      formData.type === LedgerEntryType.EXPENSE
                        ? 'text-primary-600 border-b-2 border-primary-500'
                        : 'text-secondary-500 hover:text-secondary-700'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, type: LedgerEntryType.EXPENSE }))}
                  >
                    <ArrowDownCircle className="h-4 w-4 inline-block mr-1" />
                    Expense
                  </button>
                </div>
                
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Category *</label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="">Select Category</option>
