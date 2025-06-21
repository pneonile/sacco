import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, BarChart3, TrendingUp } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { format } from 'date-fns';

interface Report {
  id: string;
  name: string;
  type: 'financial' | 'membership' | 'loans' | 'deposits' | 'custom';
  generatedAt: string;
  generatedBy: string;
  status: 'ready' | 'generating' | 'failed';
}

export const ReportsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    setTimeout(() => {
      const mockReports: Report[] = [
        {
          id: 'rpt-1',
          name: 'Monthly Financial Statement - June 2025',
          type: 'financial',
          generatedAt: '2025-06-21T09:30:00',
          generatedBy: 'Admin User',
          status: 'ready',
        },
        {
          id: 'rpt-2',
          name: 'Member Loans Report - Q2 2025',
          type: 'loans',
          generatedAt: '2025-06-20T14:15:00',
          generatedBy: 'Admin User',
          status: 'ready',
        },
        {
          id: 'rpt-3',
          name: 'Deposits Summary - June 2025',
          type: 'deposits',
          generatedAt: '2025-06-19T11:45:00',
          generatedBy: 'Admin User',
          status: 'ready',
        },
      ];
      setReports(mockReports);
      setIsLoading(false);
    }, 800);
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Reports Generator</h1>
        <p className="text-secondary-600 mt-1">
          Generate and download comprehensive SACCO reports
        </p>
      </div>

      {/* Report Types Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Financial Reports</p>
                <p className="text-lg font-bold text-blue-600 mt-1">12</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Member Reports</p>
                <p className="text-lg font-bold text-green-600 mt-1">8</p>
              </div>
              <div className="bg-green-50 p-3 rounded-full">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Loan Reports</p>
                <p className="text-lg font-bold text-purple-600 mt-1">15</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Custom Reports</p>
                <p className="text-lg font-bold text-orange-600 mt-1">5</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-full">
                <Filter className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Generate New Report */}
      <Card className="mb-6">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Generate New Report</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select className="px-3 py-2 border border-secondary-300 rounded-lg">
              <option>Financial Statement</option>
              <option>Membership Report</option>
              <option>Loans Analysis</option>
              <option>Deposits Summary</option>
            </select>
            <input
              type="date"
              className="px-3 py-2 border border-secondary-300 rounded-lg"
              defaultValue={format(new Date(), 'yyyy-MM-dd')}
            />
            <select className="px-3 py-2 border border-secondary-300 rounded-lg">
              <option>PDF Format</option>
              <option>Excel Format</option>
            </select>
            <Button>Generate Report</Button>
          </div>
        </div>
      </Card>

      {/* Reports History */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Reports History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-4 py-3 text-left">Report Name</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Generated</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton height={20} width={200} /></td>
                    <td className="px-4 py-3"><Skeleton height={20} width={80} /></td>
                    <td className="px-4 py-3"><Skeleton height={20} width={120} /></td>
                    <td className="px-4 py-3"><Skeleton height={20} width={60} /></td>
                    <td className="px-4 py-3"><Skeleton height={20} width={100} /></td>
                  </tr>
                ))
              ) : (
                reports.map(report => (
                  <tr key={report.id} className="border-b">
                    <td className="px-4 py-3 font-medium">{report.name}</td>
                    <td className="px-4 py-3 capitalize">{report.type}</td>
                    <td className="px-4 py-3">{format(new Date(report.generatedAt), 'MMM dd, yyyy HH:mm')}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
