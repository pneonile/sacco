import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Smartphone,
  MessageCircleMore,
  AlertTriangle,
  Plus,
  Eye,
  Activity,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Card } from '../ui/Card';
import { StatCard } from '../charts/StatCard';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import API from '../../services/api';
import { Communication } from '../../types';
import { format, parseISO } from 'date-fns';

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

export const CommunicationsWidget: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [summary, setSummary] = useState({
    totalMessages: 0,
    sentMessages: 0,
    failedMessages: 0,
    pendingMessages: 0,
    deliveryRate: 0,
  });
  const [isWhatsAppIntegrated, setIsWhatsAppIntegrated] = useState(false); // Mock for now

  useEffect(() => {
    const fetchCommunicationsData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await API.communications.getCommunications({ limit: 100 }); // Fetch enough to calculate stats
        const fetchedCommunications = response.data.communications;
        setCommunications(fetchedCommunications);

        const total = fetchedCommunications.length;
        const sent = fetchedCommunications.filter(c => c.status === CommunicationStatus.SENT).length;
        const failed = fetchedCommunications.filter(c => c.status === CommunicationStatus.FAILED).length;
        const pending = fetchedCommunications.filter(c => c.status === CommunicationStatus.SCHEDULED || c.status === CommunicationStatus.DRAFT).length;
        const deliveryRate = total > 0 ? (sent / total) * 100 : 0;

        setSummary({
          totalMessages: total,
          sentMessages: sent,
          failedMessages: failed,
          pendingMessages: pending,
          deliveryRate,
        });

        // Mock WhatsApp integration status for now
        // In a real app, this would come from API.settings.getSystemSettings() or similar
        setIsWhatsAppIntegrated(true); 

      } catch (err) {
        console.error('Failed to fetch communications data:', err);
        setError('Failed to load communications data.');
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

        setSummary({
          totalMessages: total,
          sentMessages: sent,
          failedMessages: failed,
          pendingMessages: pending,
          deliveryRate,
        });
        setIsWhatsAppIntegrated(true); // Mock status
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunicationsData();
  }, []);

  const getCommunicationTypeIcon = (type: CommunicationType) => {
    switch (type) {
      case CommunicationType.SMS:
        return <Smartphone className="h-4 w-4" />;
      case CommunicationType.EMAIL:
        return <Mail className="h-4 w-4" />;
      case CommunicationType.WHATSAPP:
        return <MessageCircleMore className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: CommunicationStatus) => {
    switch (status) {
      case CommunicationStatus.SENT:
        return 'text-green-600';
      case CommunicationStatus.FAILED:
        return 'text-red-600';
      case CommunicationStatus.SCHEDULED:
        return 'text-blue-600';
      case CommunicationStatus.DRAFT:
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getChannelColor = (type: CommunicationType) => {
    switch (type) {
      case CommunicationType.SMS: return 'bg-blue-100 text-blue-800';
      case CommunicationType.EMAIL: return 'bg-purple-100 text-purple-800';
      case CommunicationType.WHATSAPP: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const recentCommunications = useMemo(() => {
    return communications
      .sort((a, b) => {
        const dateA = a.sentDate ? parseISO(a.sentDate) : (a.scheduledDate ? parseISO(a.scheduledDate) : new Date(0));
        const dateB = b.sentDate ? parseISO(b.sentDate) : (b.scheduledDate ? parseISO(b.scheduledDate) : new Date(0));
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }, [communications]);

  const channelPerformance = useMemo(() => {
    const channelStats: Record<string, { total: number; sent: number }> = {};

    communications.forEach(comm => {
      if (!channelStats[comm.type]) {
        channelStats[comm.type] = { total: 0, sent: 0 };
      }
      channelStats[comm.type].total++;
      if (comm.status === CommunicationStatus.SENT) {
        channelStats[comm.type].sent++;
      }
    });

    return Object.entries(channelStats).map(([type, stats]) => ({
      type: type as CommunicationType,
      deliveryRate: stats.total > 0 ? (stats.sent / stats.total) * 100 : 0,
      total: stats.total,
      sent: stats.sent,
    })).sort((a, b) => b.deliveryRate - a.deliveryRate);
  }, [communications]);

  return (
    <Card className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-secondary-900">Communications Overview</h3>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/communications')}>
          <Eye className="h-4 w-4 mr-2" /> View All
        </Button>
      </div>

      {error && (
        <div className="text-red-600 text-sm mb-4 flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <StatCard
          title="Total Messages"
          value={isLoading ? <Skeleton height={24} width={60} /> : summary.totalMessages.toString()}
          icon={MessageSquare}
          iconColor="text-blue-600"
          loading={isLoading}
        />
        <StatCard
          title="Delivery Rate"
          value={isLoading ? <Skeleton height={24} width={60} /> : `${summary.deliveryRate.toFixed(1)}%`}
          icon={Send}
          iconColor="text-purple-600"
          loading={isLoading}
        />
        <StatCard
          title="Sent"
          value={isLoading ? <Skeleton height={24} width={60} /> : summary.sentMessages.toString()}
          icon={CheckCircle}
          iconColor="text-green-600"
          loading={isLoading}
        />
        <StatCard
          title="Failed"
          value={isLoading ? <Skeleton height={24} width={60} /> : summary.failedMessages.toString()}
          icon={XCircle}
          iconColor="text-red-600"
          loading={isLoading}
        />
        <StatCard
          title="Pending"
          value={isLoading ? <Skeleton height={24} width={60} /> : summary.pendingMessages.toString()}
          icon={Clock}
          iconColor="text-orange-600"
          loading={isLoading}
        />
        <Card className="p-3 flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircleMore className={`h-6 w-6 mr-3 ${isWhatsAppIntegrated ? 'text-green-500' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm font-medium text-secondary-700">WhatsApp Integration</p>
              <p className={`text-xs ${isWhatsAppIntegrated ? 'text-green-600' : 'text-red-600'}`}>
                {isWhatsAppIntegrated ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate('/admin/settings?tab=integrations')}>
            {isWhatsAppIntegrated ? 'Manage' : 'Setup'}
          </Button>
        </Card>
      </div>

      <div className="flex justify-end mb-4">
        <Button onClick={() => navigate('/admin/communications?action=new')}>
          <Plus className="h-4 w-4 mr-2" /> Send New Message
        </Button>
      </div>

      <h4 className="text-md font-semibold text-secondary-800 mb-3">Recent Activity</h4>
      <div className="space-y-3 mb-4 flex-grow overflow-y-auto">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-center p-2 bg-secondary-50 rounded-lg">
              <Skeleton height={20} width={20} className="mr-2" />
              <div className="flex-1">
                <Skeleton height={16} width="80%" className="mb-1" />
                <Skeleton height={12} width="50%" />
              </div>
            </div>
          ))
        ) : recentCommunications.length === 0 ? (
          <p className="text-sm text-secondary-500 text-center py-4">No recent messages.</p>
        ) : (
          recentCommunications.map(comm => (
            <div key={comm.id} className="flex items-start p-2 bg-secondary-50 rounded-lg hover:bg-secondary-100">
              <div className={`rounded-full p-1.5 mr-3 ${getChannelColor(comm.type as CommunicationType)}`}>
                {getCommunicationTypeIcon(comm.type as CommunicationType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-secondary-900 truncate">{comm.title}</p>
                <p className="text-xs text-secondary-500 truncate">{comm.message}</p>
                <div className="flex items-center mt-1">
                  <span className={`text-xs ${getStatusColor(comm.status as CommunicationStatus)}`}>
                    {comm.status}
                  </span>
                  <span className="mx-1 text-secondary-300">•</span>
                  <span className="text-xs text-secondary-500">
                    {comm.sentDate 
                      ? format(parseISO(comm.sentDate), 'MMM d, h:mm a')
                      : comm.scheduledDate 
                        ? format(parseISO(comm.scheduledDate), 'MMM d, h:mm a')
                        : 'Not scheduled'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <h4 className="text-md font-semibold text-secondary-800 mb-3">Channel Performance</h4>
      <div className="space-y-2">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-center">
              <Skeleton height={16} width={100} className="mr-2" />
              <div className="flex-1">
                <Skeleton height={8} width="70%" />
              </div>
              <Skeleton height={16} width={40} />
            </div>
          ))
        ) : channelPerformance.length === 0 ? (
          <p className="text-sm text-secondary-500 text-center py-2">No channel data available.</p>
        ) : (
          channelPerformance.map((channel, index) => (
            <div key={index} className="flex items-center">
              <div className="w-24 flex items-center">
                {getCommunicationTypeIcon(channel.type)}
                <span className="ml-2 text-sm font-medium text-secondary-700">
                  {channel.type === CommunicationType.SMS ? 'SMS' : 
                   channel.type === CommunicationType.EMAIL ? 'Email' : 
                   channel.type === CommunicationType.WHATSAPP ? 'WhatsApp' : 
                   'Other'}
                </span>
              </div>
              <div className="flex-1 mx-2">
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      channel.deliveryRate > 90 ? 'bg-green-500' :
                      channel.deliveryRate > 70 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${channel.deliveryRate}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-xs font-medium text-secondary-700">{channel.deliveryRate.toFixed(1)}%</div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
