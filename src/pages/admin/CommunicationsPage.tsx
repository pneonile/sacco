import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Download,
  MessageSquare,
  Mail,
  Smartphone,
  Send,
  History,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Tag,
  Calendar,
  AlertTriangle,
  Eye,
  Edit,
  Trash,
  MessageCircleMore,
  FileText,
  ListFilter
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/charts/StatCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { format, parseISO, addDays } from 'date-fns';
import API from '../../services/api';
import { Communication, User } from '../../types';

// Communication types enum (should match backend)
enum CommunicationType {
  SMS = 'sms',
  EMAIL = 'email',
  PUSH = 'push',
  WHATSAPP = 'whatsapp',
}

// Communication status enum (should match backend)
enum CommunicationStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  FAILED = 'failed',
}

// Message template interface (simplified for frontend)
interface MessageTemplate {
  id: string;
  name: string;
  type: CommunicationType;
  subject?: string;
  message: string;
  whatsappTemplate?: {
    namespace: string;
    name: string;
    language: string;
    components?: any[]; // For WhatsApp interactive messages
  };
}

// Communication form interface
interface CommunicationFormData {
  id?: string;
  title: string;
  message: string;
  type: CommunicationType;
  recipients: string; // Comma-separated list of IDs or contacts
  scheduledDate?: string;
  scheduledTime?: string;
  templateId?: string;
  subject?: string; // For email
  campaignId?: string;
  // WhatsApp specific fields
  whatsappTemplateNamespace?: string;
  whatsappTemplateName?: string;
  whatsappTemplateLanguage?: string;
  whatsappComponents?: string; // JSON string
}

export const CommunicationsPage: React.FC = () => {
  // State for communications data
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for summary data
  const [summaryData, setSummaryData] = useState({
    totalMessages: 0,
    sentMessages: 0,
    failedMessages: 0,
    pendingMessages: 0,
    deliveryRate: 0,
  });

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all'); // e.g., 'today', 'last7days', 'last30days'
  const [sortBy, setSortBy] = useState<string>('scheduledDate');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // State for modals
  const [showSendModal, setShowSendModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);

  // State for communication form
  const [communicationForm, setCommunicationForm] = useState<CommunicationFormData>({
    title: '',
    message: '',
    type: CommunicationType.SMS,
    recipients: '',
    scheduledDate: '',
    scheduledTime: '',
    subject: '',
    campaignId: '',
    whatsappTemplateNamespace: '',
    whatsappTemplateName: '',
    whatsappTemplateLanguage: 'en_US',
    whatsappComponents: '',
  });

  // Mock templates (replace with API call to fetch templates)
  const mockTemplates: MessageTemplate[] = [
    {
      id: '1',
      name: 'Welcome Message (SMS)',
      type: CommunicationType.SMS,
      message: 'Welcome to Kawempe SACCO, {{memberName}}! We are excited to have you. Your member ID is {{memberId}}.',
    },
    {
      id: '2',
      name: 'Loan Approval (Email)',
      type: CommunicationType.EMAIL,
      subject: 'Your Loan Application Has Been Approved!',
      message: 'Dear {{memberName}},\n\nWe are pleased to inform you that your loan application for UGX {{loanAmount}} has been approved. Your first payment is due on {{firstPaymentDate}}.\n\nSincerely,\nKawempe SACCO',
    },
    {
      id: '3',
      name: 'Payment Reminder (WhatsApp)',
      type: CommunicationType.WHATSAPP,
      message: 'Hello {{memberName}}, this is a friendly reminder that your loan payment of UGX {{amount}} is due on {{dueDate}}. Please ensure timely payment to avoid penalties. Thank you, Kawempe SACCO.',
      whatsappTemplate: {
        namespace: 'your_namespace',
        name: 'loan_payment_reminder',
        language: 'en_US',
        components: [
          { type: 'body', parameters: [{ type: 'text', text: '{{memberName}}' }, { type: 'text', text: '{{amount}}' }, { type: 'text', text: '{{dueDate}}' }] },
          { type: 'button', sub_type: 'url', index: 0, parameters: [{ type: 'text', text: '{{paymentLink}}' }] }
        ]
      }
    },
  ];

  // Fetch communications data
  useEffect(() => {
    const fetchCommunications = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await API.communications.getCommunications({
          type: typeFilter !== 'all' ? typeFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          sortBy,
          sortDirection,
          search: searchTerm,
        });

        setCommunications(response.data.communications);

        // Calculate summary data
        const total = response.data.communications.length;
        const sent = response.data.communications.filter(c => c.status === CommunicationStatus.SENT).length;
        const failed = response.data.communications.filter(c => c.status === CommunicationStatus.FAILED).length;
        const pending = response.data.communications.filter(c => c.status === CommunicationStatus.SCHEDULED || c.status === CommunicationStatus.DRAFT).length;
        const deliveryRate = total > 0 ? (sent / total) * 100 : 0;

        setSummaryData({
          totalMessages: total,
          sentMessages: sent,
          failedMessages: failed,
          pendingMessages: pending,
          deliveryRate,
        });

      } catch (err) {
        console.error('Error fetching communications:', err);
        setError('Failed to load communications. Please try again later.');

        // Fallback to mock data for demonstration
        const mockCommunications: Communication[] = [
          {
            id: 'comm1',
            title: 'Monthly Newsletter',
            message: 'Our latest newsletter is out! Read about our new loan products and financial tips.',
            type: CommunicationType.EMAIL,
            recipients: ['all_members'],
            scheduledDate: '2025-06-01T09:00:00Z',
            sentDate: '2025-06-01T09:05:00Z',
            status: CommunicationStatus.SENT,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'comm2',
            title: 'System Maintenance Alert',
            message: 'Dear members, our system will undergo maintenance on 2025-06-25 from 10 PM to 12 AM EAT. Services may be temporarily unavailable.',
            type: CommunicationType.SMS,
            recipients: ['+2567XXXXXXXX', '+2567YYYYYYYY'],
            scheduledDate: '2025-06-24T18:00:00Z',
            sentDate: '2025-06-24T18:01:00Z',
            status: CommunicationStatus.SENT,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'comm3',
            title: 'Loan Payment Due Reminder',
            message: 'Hello John, your loan payment of UGX 500,000 is due on 2025-06-30. Please ensure timely payment.',
            type: CommunicationType.WHATSAPP,
            recipients: ['+256701234567'],
            scheduledDate: '2025-06-28T10:00:00Z',
            sentDate: null,
            status: CommunicationStatus.SCHEDULED,
            whatsappTemplateName: 'loan_payment_reminder',
            whatsappTemplateLanguage: 'en_US',
            whatsappComponents: JSON.stringify([{ type: 'body', parameters: [{ type: 'text', text: 'John' }, { type: 'text', text: '500,000' }, { type: 'text', text: '2025-06-30' }] }]),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'comm4',
            title: 'Failed SMS Delivery',
            message: 'Your transaction of UGX 100,000 was successful.',
            type: CommunicationType.SMS,
            recipients: ['+2567ZZZZZZZZ'],
            scheduledDate: '2025-06-20T14:00:00Z',
            sentDate: '2025-06-20T14:01:00Z',
            status: CommunicationStatus.FAILED,
            failureReason: 'Invalid phone number',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'comm5',
            title: 'Draft Announcement',
            message: 'This is a draft message for an upcoming event.',
            type: CommunicationType.EMAIL,
            recipients: ['internal_staff'],
            scheduledDate: null,
            sentDate: null,
            status: CommunicationStatus.DRAFT,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        setCommunications(mockCommunications);

        const total = mockCommunications.length;
        const sent = mockCommunications.filter(c => c.status === CommunicationStatus.SENT).length;
        const failed = mockCommunications.filter(c => c.status === CommunicationStatus.FAILED).length;
        const pending = mockCommunications.filter(c => c.status === CommunicationStatus.SCHEDULED || c.status === CommunicationStatus.DRAFT).length;
        const deliveryRate = total > 0 ? (sent / total) * 100 : 0;

        setSummaryData({
          totalMessages: total,
          sentMessages: sent,
          failedMessages: failed,
          pendingMessages: pending,
          deliveryRate,
        });

      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunications();
  }, [searchTerm, typeFilter, statusFilter, dateRangeFilter, sortBy, sortDirection]);

  // Filter communications based on search term and date range
  const filteredCommunications = useMemo(() => {
    let filtered = communications;

    if (searchTerm) {
      filtered = filtered.filter(comm =>
        comm.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.recipients.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (dateRangeFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(comm => {
        const commDate = comm.sentDate ? parseISO(comm.sentDate) : (comm.scheduledDate ? parseISO(comm.scheduledDate) : null);
        if (!commDate) return false;

        if (dateRangeFilter === 'today') {
          return format(commDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
        } else if (dateRangeFilter === 'last7days') {
          return commDate >= addDays(now, -7);
        } else if (dateRangeFilter === 'last30days') {
          return commDate >= addDays(now, -30);
        }
        return true;
      });
    }

    return filtered;
  }, [communications, searchTerm, dateRangeFilter]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCommunicationForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle template selection
  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    const selectedTemplate = mockTemplates.find(t => t.id === templateId);
    if (selectedTemplate) {
      setCommunicationForm(prev => ({
        ...prev,
        title: selectedTemplate.name,
        message: selectedTemplate.message,
        type: selectedTemplate.type,
        subject: selectedTemplate.subject || '',
        templateId: selectedTemplate.id,
        whatsappTemplateNamespace: selectedTemplate.whatsappTemplate?.namespace || '',
        whatsappTemplateName: selectedTemplate.whatsappTemplate?.name || '',
        whatsappTemplateLanguage: selectedTemplate.whatsappTemplate?.language || 'en_US',
        whatsappComponents: selectedTemplate.whatsappTemplate?.components ? JSON.stringify(selectedTemplate.whatsappTemplate.components, null, 2) : '',
      }));
    } else {
      // Clear template-related fields if "Select Template" is chosen
      setCommunicationForm(prev => ({
        ...prev,
        title: '',
        message: '',
        type: CommunicationType.SMS, // Default to SMS
        subject: '',
        templateId: undefined,
        whatsappTemplateNamespace: '',
        whatsappTemplateName: '',
        whatsappTemplateLanguage: 'en_US',
        whatsappComponents: '',
      }));
    }
  };

  // Reset form to default values
  const resetForm = () => {
    setCommunicationForm({
      title: '',
      message: '',
      type: CommunicationType.SMS,
      recipients: '',
      scheduledDate: '',
      scheduledTime: '',
      subject: '',
      campaignId: '',
      whatsappTemplateNamespace: '',
      whatsappTemplateName: '',
      whatsappTemplateLanguage: 'en_US',
      whatsappComponents: '',
    });
  };

  // Handle send message form submission
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare data for API
      const recipientsList = communicationForm.recipients
        .split(',')
        .map(r => r.trim())
        .filter(r => r);

      const scheduledDateTime = communicationForm.scheduledDate && communicationForm.scheduledTime
        ? `${communicationForm.scheduledDate}T${communicationForm.scheduledTime}:00Z`
        : undefined;

      const communicationData: Partial<Communication> = {
        title: communicationForm.title,
        message: communicationForm.message,
        type: communicationForm.type,
        recipients: recipientsList,
        scheduledDate: scheduledDateTime,
        status: scheduledDateTime ? CommunicationStatus.SCHEDULED : CommunicationStatus.DRAFT,
      };

      // Add type-specific fields
      if (communicationForm.type === CommunicationType.EMAIL) {
        communicationData.subject = communicationForm.subject;
      } else if (communicationForm.type === CommunicationType.WHATSAPP) {
        communicationData.whatsappTemplateName = communicationForm.whatsappTemplateName;
        communicationData.whatsappTemplateNamespace = communicationForm.whatsappTemplateNamespace;
        communicationData.whatsappTemplateLanguage = communicationForm.whatsappTemplateLanguage;
        communicationData.whatsappComponents = communicationForm.whatsappComponents;
      }

      // Add campaign ID if provided
      if (communicationForm.campaignId) {
        communicationData.campaignId = communicationForm.campaignId;
      }

      // Call API to create communication
      const response = await API.communications.createCommunication(communicationData);

      // Update communications list
      setCommunications(prev => [response.data, ...prev]);

      // Close modal and reset form
      setShowSendModal(false);
      resetForm();

      // Update summary data
      setSummaryData(prev => ({
        ...prev,
        totalMessages: prev.totalMessages + 1,
        pendingMessages: prev.pendingMessages + 1,
      }));

    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again later.');

      // For demonstration, add to local state anyway
      const newId = `temp-${Date.now()}`;
      const recipientsList = communicationForm.recipients
        .split(',')
        .map(r => r.trim())
        .filter(r => r);

      const scheduledDateTime = communicationForm.scheduledDate && communicationForm.scheduledTime
        ? `${communicationForm.scheduledDate}T${communicationForm.scheduledTime}:00Z`
        : undefined;

      const newCommunication: Communication = {
        id: newId,
        title: communicationForm.title,
        message: communicationForm.message,
        type: communicationForm.type,
        recipients: recipientsList,
        scheduledDate: scheduledDateTime,
        sentDate: null,
        status: scheduledDateTime ? CommunicationStatus.SCHEDULED : CommunicationStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add type-specific fields
      if (communicationForm.type === CommunicationType.EMAIL) {
        newCommunication.subject = communicationForm.subject;
      } else if (communicationForm.type === CommunicationType.WHATSAPP) {
        newCommunication.whatsappTemplateName = communicationForm.whatsappTemplateName;
        newCommunication.whatsappTemplateNamespace = communicationForm.whatsappTemplateNamespace;
        newCommunication.whatsappTemplateLanguage = communicationForm.whatsappTemplateLanguage;
        newCommunication.whatsappComponents = communicationForm.whatsappComponents;
      }

      // Add campaign ID if provided
      if (communicationForm.campaignId) {
        newCommunication.campaignId = communicationForm.campaignId;
      }

      // Update communications list
      setCommunications(prev => [newCommunication, ...prev]);

      // Close modal and reset form
      setShowSendModal(false);
      resetForm();

      // Update summary data
      setSummaryData(prev => ({
        ...prev,
        totalMessages: prev.totalMessages + 1,
        pendingMessages: prev.pendingMessages + 1,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view communication details
  const handleViewCommunication = (communication: Communication) => {
    setSelectedCommunication(communication);
    setShowViewModal(true);
  };

  // Handle send now for scheduled or draft communications
  const handleSendNow = async (communicationId: string) => {
    setIsLoading(true);

    try {
      // Call API to send communication immediately
      const response = await API.communications.sendCommunication(communicationId);

      // Update communications list
      setCommunications(prev => prev.map(comm =>
        comm.id === communicationId
          ? { ...comm, status: CommunicationStatus.SENT, sentDate: new Date().toISOString() }
          : comm
      ));

      // Update summary data
      setSummaryData(prev => ({
        ...prev,
        sentMessages: prev.sentMessages + 1,
        pendingMessages: prev.pendingMessages - 1,
      }));

    } catch (err) {
      console.error('Error sending communication:', err);
      setError('Failed to send communication. Please try again later.');

      // For demonstration, update local state anyway
      setCommunications(prev => prev.map(comm =>
        comm.id === communicationId
          ? { ...comm, status: CommunicationStatus.SENT, sentDate: new Date().toISOString() }
          : comm
      ));

      // Update summary data
      setSummaryData(prev => ({
        ...prev,
        sentMessages: prev.sentMessages + 1,
        pendingMessages: prev.pendingMessages - 1,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete communication
  const handleDeleteCommunication = async (communicationId: string) => {
    if (!window.confirm('Are you sure you want to delete this communication?')) {
      return;
    }

    setIsLoading(true);

    try {
      // Call API to delete communication
      await API.communications.deleteCommunication(communicationId);

      // Update communications list
      setCommunications(prev => prev.filter(comm => comm.id !== communicationId));

      // Update summary data
      const deletedComm = communications.find(c => c.id === communicationId);
      if (deletedComm) {
        setSummaryData(prev => ({
          ...prev,
          totalMessages: prev.totalMessages - 1,
          sentMessages: deletedComm.status === CommunicationStatus.SENT ? prev.sentMessages - 1 : prev.sentMessages,
          failedMessages: deletedComm.status === CommunicationStatus.FAILED ? prev.failedMessages - 1 : prev.failedMessages,
          pendingMessages: (deletedComm.status === CommunicationStatus.SCHEDULED || deletedComm.status === CommunicationStatus.DRAFT) ? prev.pendingMessages - 1 : prev.pendingMessages,
        }));
      }

    } catch (err) {
      console.error('Error deleting communication:', err);
      setError('Failed to delete communication. Please try again later.');

      // For demonstration, update local state anyway
      setCommunications(prev => prev.filter(comm => comm.id !== communicationId));

      // Update summary data
      const deletedComm = communications.find(c => c.id === communicationId);
      if (deletedComm) {
        setSummaryData(prev => ({
          ...prev,
          totalMessages: prev.totalMessages - 1,
          sentMessages: deletedComm.status === CommunicationStatus.SENT ? prev.sentMessages - 1 : prev.sentMessages,
          failedMessages: deletedComm.status === CommunicationStatus.FAILED ? prev.failedMessages - 1 : prev.failedMessages,
          pendingMessages: (deletedComm.status === CommunicationStatus.SCHEDULED || deletedComm.status === CommunicationStatus.DRAFT) ? prev.pendingMessages - 1 : prev.pendingMessages,
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle export communications to CSV
  const handleExport = () => {
    const csvContent = [
      ['Title', 'Type', 'Status', 'Recipients', 'Scheduled Date', 'Sent Date', 'Message'],
      ...filteredCommunications.map(comm => [
        comm.title,
        comm.type,
        comm.status,
        comm.recipients.join(', '),
        comm.scheduledDate || '',
        comm.sentDate || '',
        comm.message.replace(/\n/g, ' '),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `communications-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get icon for communication type
  const getCommunicationTypeIcon = (type: CommunicationType) => {
    switch (type) {
      case CommunicationType.SMS:
        return <Smartphone className="h-4 w-4" />;
      case CommunicationType.EMAIL:
        return <Mail className="h-4 w-4" />;
      case CommunicationType.PUSH:
        return <Bell className="h-4 w-4" />;
      case CommunicationType.WHATSAPP:
        return <MessageCircleMore className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Get color for communication status
  const getStatusColor = (status: CommunicationStatus) => {
    switch (status) {
      case CommunicationStatus.SENT:
        return 'bg-green-100 text-green-800';
      case CommunicationStatus.FAILED:
        return 'bg-red-100 text-red-800';
      case CommunicationStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800';
      case CommunicationStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Communications Center</h1>
        <p className="text-secondary-600 mt-1">
          Manage member communications across SMS, Email, and WhatsApp channels
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
          title="Total Messages"
          value={summaryData.totalMessages.toString()}
          icon={MessageSquare}
          iconColor="text-blue-600"
          loading={isLoading}
        />
        
        <StatCard
          title="Sent Messages"
          value={summaryData.sentMessages.toString()}
          icon={CheckCircle}
          iconColor="text-green-600"
          loading={isLoading}
        />
        
        <StatCard
          title="Failed Messages"
          value={summaryData.failedMessages.toString()}
          icon={XCircle}
          iconColor="text-red-600"
          loading={isLoading}
        />
        
        <StatCard
          title="Pending Messages"
          value={summaryData.pendingMessages.toString()}
          icon={Clock}
          iconColor="text-orange-600"
          loading={isLoading}
        />
        
        <StatCard
          title="Delivery Rate"
          value={`${summaryData.deliveryRate.toFixed(1)}%`}
          icon={Send}
          iconColor="text-purple-600"
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
                  placeholder="Search messages by title, content, or recipient..."
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
                <option value={CommunicationType.SMS}>SMS</option>
                <option value={CommunicationType.EMAIL}>Email</option>
                <option value={CommunicationType.WHATSAPP}>WhatsApp</option>
                <option value={CommunicationType.PUSH}>Push Notification</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value={CommunicationStatus.SENT}>Sent</option>
                <option value={CommunicationStatus.FAILED}>Failed</option>
                <option value={CommunicationStatus.SCHEDULED}>Scheduled</option>
                <option value={CommunicationStatus.DRAFT}>Draft</option>
              </select>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />Export
              </Button>
              <Button onClick={() => setShowSendModal(true)}>
                <Plus className="h-4 w-4 mr-2" />New Message
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 border-t border-secondary-200 pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-secondary-500" />
              <label className="text-sm font-medium text-secondary-700">Date Range:</label>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-secondary-500" />
              <label className="text-sm font-medium text-secondary-700">Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="scheduledDate">Scheduled Date</option>
                <option value="sentDate">Sent Date</option>
                <option value="createdAt">Created Date</option>
                <option value="title">Title</option>
              </select>
              
              <select
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Communications Table */}
      <Card className="mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Recipients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Schedule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton height={40} width={150} /></td>
                    <td className="px-6 py-4"><Skeleton height={40} width={80} /></td>
                    <td className="px-6 py-4"><Skeleton height={40} width={120} /></td>
                    <td className="px-6 py-4"><Skeleton height={40} width={120} /></td>
                    <td className="px-6 py-4"><Skeleton height={40} width={80} /></td>
                    <td className="px-6 py-4"><Skeleton height={40} width={100} /></td>
                  </tr>
                ))
              ) : filteredCommunications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-secondary-500">
                    No communications found. Create your first message to get started.
                  </td>
                </tr>
              ) : (
                filteredCommunications.map((communication) => (
                  <tr key={communication.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-secondary-900">{communication.title}</p>
                        <p className="text-sm text-secondary-500 truncate max-w-xs">
                          {communication.message.substring(0, 50)}
                          {communication.message.length > 50 ? '...' : ''}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          communication.type === CommunicationType.SMS ? 'bg-blue-100 text-blue-800' :
                          communication.type === CommunicationType.EMAIL ? 'bg-purple-100 text-purple-800' :
                          communication.type === CommunicationType.WHATSAPP ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getCommunicationTypeIcon(communication.type)}
                          <span className="ml-1">{communication.type}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-secondary-900">
                        {communication.recipients.length > 1 
                          ? `${communication.recipients.length} recipients` 
                          : communication.recipients[0]}
                      </p>
                      {communication.campaignId && (
                        <p className="text-xs text-secondary-500 flex items-center mt-1">
                          <Tag className="h-3 w-3 mr-1" />
                          Campaign: {communication.campaignId}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {communication.scheduledDate ? (
                        <div>
                          <p className="text-secondary-900">
                            {format(parseISO(communication.scheduledDate), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-secondary-500">
                            {format(parseISO(communication.scheduledDate), 'h:mm a')}
                          </p>
                        </div>
                      ) : (
                        <span className="text-secondary-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(communication.status)}`}>
                        {communication.status}
                      </span>
                      {communication.sentDate && (
                        <p className="text-xs text-secondary-500 mt-1">
                          {format(parseISO(communication.sentDate), 'MMM d, h:mm a')}
                        </p>
                      )}
                      {communication.status === CommunicationStatus.FAILED && communication.failureReason && (
                        <p className="text-xs text-red-500 mt-1" title={communication.failureReason}>
                          {communication.failureReason.substring(0, 20)}
                          {communication.failureReason.length > 20 ? '...' : ''}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewCommunication(communication)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {(communication.status === CommunicationStatus.DRAFT || communication.status === CommunicationStatus.SCHEDULED) && (
                          <Button size="sm" variant="outline" onClick={() => handleSendNow(communication.id)}>
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button size="sm" variant="danger" onClick={() => handleDeleteCommunication(communication.id)}>
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

      {/* Send Message Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-screen overflow-y-auto">
            <form onSubmit={handleSendMessage}>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Send New Message</h3>
                
                {/* Template Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Message Template (Optional)</label>
                  <select
                    value={communicationForm.templateId || ''}
                    onChange={handleTemplateSelect}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Template</option>
                    {mockTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-secondary-500 mt-1">
                    Select a template or create a custom message below
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Message Type */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Message Type *</label>
                    <div className="flex gap-3">
                      <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                        communicationForm.type === CommunicationType.SMS 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-secondary-300'
                      }`}>
                        <input
                          type="radio"
                          name="type"
                          value={CommunicationType.SMS}
                          checked={communicationForm.type === CommunicationType.SMS}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <Smartphone className={`h-5 w-5 ${
                          communicationForm.type === CommunicationType.SMS 
                            ? 'text-primary-500' 
                            : 'text-secondary-400'
                        }`} />
                        <span className="ml-2">SMS</span>
                      </label>
                      
                      <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                        communicationForm.type === CommunicationType.EMAIL 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-secondary-300'
                      }`}>
                        <input
                          type="radio"
                          name="type"
                          value={CommunicationType.EMAIL}
                          checked={communicationForm.type === CommunicationType.EMAIL}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <Mail className={`h-5 w-5 ${
                          communicationForm.type === CommunicationType.EMAIL 
                            ? 'text-primary-500' 
                            : 'text-secondary-400'
                        }`} />
                        <span className="ml-2">Email</span>
                      </label>
                      
                      <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                        communicationForm.type === CommunicationType.WHATSAPP 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-secondary-300'
                      }`}>
                        <input
                          type="radio"
                          name="type"
                          value={CommunicationType.WHATSAPP}
                          checked={communicationForm.type === CommunicationType.WHATSAPP}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <MessageCircleMore className={`h-5 w-5 ${
                          communicationForm.type === CommunicationType.WHATSAPP 
                            ? 'text-primary-500' 
                            : 'text-secondary-400'
                        }`} />
                        <span className="ml-2">WhatsApp</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Campaign ID */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Campaign ID (Optional)</label>
                    <input
                      type="text"
                      name="campaignId"
                      value={communicationForm.campaignId || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., june-newsletter"
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-secondary-500 mt-1">
                      Group related messages under a campaign
                    </p>
                  </div>
                </div>
                
                {/* Message Title */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Message Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={communicationForm.title}
                    onChange={handleInputChange}
                    placeholder="e.g., June Newsletter"
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                
                {/* Email Subject (if Email selected) */}
                {communicationForm.type === CommunicationType.EMAIL && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Email Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      value={communicationForm.subject || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., Your Monthly SACCO Update"
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                )}
                
                {/* WhatsApp Template Fields (if WhatsApp selected) */}
                {communicationForm.type === CommunicationType.WHATSAPP && (
                  <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-3">WhatsApp Template Configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-1">Template Namespace *</label>
                        <input
                          type="text"
                          name="whatsappTemplateNamespace"
                          value={communicationForm.whatsappTemplateNamespace || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., your_namespace"
                          className="w-full px-3 py-2 border border-green-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          required={communicationForm.type === CommunicationType.WHATSAPP}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-1">Template Name *</label>
                        <input
                          type="text"
                          name="whatsappTemplateName"
                          value={communicationForm.whatsappTemplateName || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., loan_payment_reminder"
                          className="w-full px-3 py-2 border border-green-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          required={communicationForm.type === CommunicationType.WHATSAPP}
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-green-700 mb-1">Template Language</label>
                      <select
                        name="whatsappTemplateLanguage"
                        value={communicationForm.whatsappTemplateLanguage || 'en_US'}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-green-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="en_US">English (US)</option>
                        <option value="en_GB">English (UK)</option>
                        <option value="sw_KE">Swahili (Kenya)</option>
                        <option value="lg_UG">Luganda (Uganda)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">Template Components (JSON)</label>
                      <textarea
                        name="whatsappComponents"
                        value={communicationForm.whatsappComponents || ''}
                        onChange={handleInputChange}
                        placeholder='[{"type":"body","parameters":[{"type":"text","text":"John"},{"type":"text","text":"500000"},{"type":"text","text":"2023-06-30"}]}]'
                        rows={4}
                        className="w-full px-3 py-2 border border-green-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                      />
                      <p className="text-xs text-green-700 mt-1">
                        JSON array of components with parameters to populate the template
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Recipients */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Recipients *</label>
                  <textarea
                    name="recipients"
                    value={communicationForm.recipients}
                    onChange={handleInputChange}
                    placeholder="Enter phone numbers, emails, or member IDs separated by commas"
                    rows={2}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                  <div className="flex items-center mt-2">
                    <Users className="h-4 w-4 text-secondary-500 mr-1" />
                    <span className="text-xs text-secondary-500">
                      For bulk messaging, separate multiple recipients with commas
                    </span>
                  </div>
                </div>
                
                {/* Message Content */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Message Content *</label>
                  <textarea
                    name="message"
                    value={communicationForm.message}
                    onChange={handleInputChange}
                    placeholder="Enter your message content here..."
                    rows={5}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                  <p className="text-xs text-secondary-500 mt-1">
                    Use {{variableName}} for dynamic content in templates
                  </p>
                </div>
                
                {/* Schedule */}
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <label className="text-sm font-medium text-secondary-700">Schedule (Optional)</label>
                    <p className="text-xs text-secondary-500 ml-2">
                      Leave blank to save as draft
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-secondary-600 mb-1">Date</label>
                      <input
                        type="date"
                        name="scheduledDate"
                        value={communicationForm.scheduledDate || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-secondary-600 mb-1">Time</label>
                      <input
                        type="time"
                        name="scheduledTime"
                        value={communicationForm.scheduledTime || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-secondary-50 p-4 flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setShowSendModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Sending...' : (
                    communicationForm.scheduledDate && communicationForm.scheduledTime
                      ? 'Schedule Message'
                      : 'Save as Draft'
                  )}
                </Button>
                <Button 
                  variant="primary" 
                  type="button" 
                  disabled={isLoading}
                  onClick={(e) => {
                    e.preventDefault();
                    // Clear schedule to send immediately
                    setCommunicationForm(prev => ({
                      ...prev,
                      scheduledDate: '',
                      scheduledTime: '',
                    }));
                    handleSendMessage(e);
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Now
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* View Message Modal */}
      {showViewModal && selectedCommunication && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{selectedCommunication.title}</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedCommunication.status)}`}>
                  {selectedCommunication.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-secondary-700 mb-2">Message Details</h4>
                  <div className="space-y-2">
                    <p>
                      <span className="text-secondary-600">Type:</span>{' '}
                      <span className="inline-flex items-center">
                        {getCommunicationTypeIcon(selectedCommunication.type)}
                        <span className="ml-1 font-medium">{selectedCommunication.type}</span>
                      </span>
                    </p>
                    
                    {selectedCommunication.subject && (
                      <p>
                        <span className="text-secondary-600">Subject:</span>{' '}
                        <span className="font-medium">{selectedCommunication.subject}</span>
                      </p>
                    )}
                    
                    {selectedCommunication.campaignId && (
                      <p>
                        <span className="text-secondary-600">Campaign:</span>{' '}
                        <span className="font-medium">{selectedCommunication.campaignId}</span>
                      </p>
                    )}
                    
                    <p>
                      <span className="text-secondary-600">Created:</span>{' '}
                      <span className="font-medium">
                        {format(new Date(selectedCommunication.createdAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-secondary-700 mb-2">Delivery Details</h4>
                  <div className="space-y-2">
                    <p>
                      <span className="text-secondary-600">Recipients:</span>{' '}
                      <span className="font-medium">
                        {selectedCommunication.recipients.length} {selectedCommunication.recipients.length === 1 ? 'recipient' : 'recipients'}
                      </span>
                    </p>
                    
                    {selectedCommunication.scheduledDate && (
                      <p>
                        <span className="text-secondary-600">Scheduled:</span>{' '}
                        <span className="font-medium">
                          {format(parseISO(selectedCommunication.scheduledDate), 'MMM d, yyyy h:mm a')}
                        </span>
                      </p>
                    )}
                    
                    {selectedCommunication.sentDate && (
                      <p>
                        <span className="text-secondary-600">Sent:</span>{' '}
                        <span className="font-medium">
                          {format(parseISO(selectedCommunication.sentDate), 'MMM d, yyyy h:mm a')}
                        </span>
                      </p>
                    )}
                    
                    {selectedCommunication.status === CommunicationStatus.FAILED && selectedCommunication.failureReason && (
                      <p>
                        <span className="text-secondary-600">Failure Reason:</span>{' '}
                        <span className="font-medium text-red-600">{selectedCommunication.failureReason}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* WhatsApp Template Details */}
              {selectedCommunication.type === CommunicationType.WHATSAPP && selectedCommunication.whatsappTemplateName && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">WhatsApp Template Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-green-700">
                        <span className="font-medium">Template Name:</span>{' '}
                        {selectedCommunication.whatsappTemplateName}
                      </p>
                      {selectedCommunication.whatsappTemplateNamespace && (
                        <p className="text-sm text-green-700">
                          <span className="font-medium">Namespace:</span>{' '}
                          {selectedCommunication.whatsappTemplateNamespace}
                        </p>
                      )}
                      {selectedCommunication.whatsappTemplateLanguage && (
                        <p className="text-sm text-green-700">
                          <span className="font-medium">Language:</span>{' '}
                          {selectedCommunication.whatsappTemplateLanguage}
                        </p>
                      )}
                    </div>
                    
                    {selectedCommunication.whatsappComponents && (
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-1">Template Components:</p>
                        <pre className="text-xs bg-white p-2 rounded border border-green-200 overflow-x-auto">
                          {selectedCommunication.whatsappComponents}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Message Content */}
              <div className="mb-6">
                <h4 className="font-medium text-secondary-700 mb-2">Message Content</h4>
                <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200 whitespace-pre-wrap">
                  {selectedCommunication.message}
                </div>
              </div>
              
              {/* Recipients List */}
              <div className="mb-6">
                <h4 className="font-medium text-secondary-700 mb-2">Recipients</h4>
                <div className="max-h-40 overflow-y-auto p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                  {selectedCommunication.recipients.map((recipient, index) => (
                    <div key={index} className="py-1 border-b border-secondary-100 last:border-b-0">
                      {recipient}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Action buttons based on status */}
              <div className="border-t border-secondary-200 pt-4 mt-4">
                {(selectedCommunication.status === CommunicationStatus.DRAFT || selectedCommunication.status === CommunicationStatus.SCHEDULED) ? (
                  <div className="flex justify-between">
                    <Button size="sm" variant="outline" onClick={() => {
                      setShowViewModal(false);
                      handleDeleteCommunication(selectedCommunication.id);
                    }}>
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                    
                    <Button size="sm" variant="primary" onClick={() => {
                      setShowViewModal(false);
                      handleSendNow(selectedCommunication.id);
                    }}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Now
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => setShowViewModal(false)}>
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
