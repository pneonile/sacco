import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Download, 
  FileText, 
  Calendar, 
  Briefcase, 
  Phone, 
  Mail, 
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { MemberOnboarding } from '../../types';

// Mock data for development purposes
const mockOnboardingApplications: MemberOnboarding[] = [
  {
    id: '1',
    personalInfo: {
      firstName: 'Nakato',
      lastName: 'Sarah',
      dateOfBirth: '1990-05-15',
      gender: 'female',
      phoneNumber: '+256701234567',
      email: 'nakato.sarah@gmail.com',
      address: 'Plot 45, Kawempe Road, Kampala',
      idNumber: 'CM90123456ABCD',
    },
    financialInfo: {
      monthlyIncome: 1500000, // 1.5M UGX
      employerName: 'Kampala City Council',
      employmentStatus: 'employed',
    },
    idDocuments: {
      nationalIdFront: 'https://example.com/id-front-1.jpg',
      nationalIdBack: 'https://example.com/id-back-1.jpg',
      passportPhoto: 'https://example.com/photo-1.jpg',
    },
    status: 'pending',
    submittedAt: '2025-06-18T10:30:00Z',
  },
  {
    id: '2',
    personalInfo: {
      firstName: 'Mugisha',
      lastName: 'Robert',
      dateOfBirth: '1985-09-22',
      gender: 'male',
      phoneNumber: '+256772345678',
      email: 'mugisha.robert@yahoo.com',
      address: '78 Entebbe Road, Kampala',
      idNumber: 'CM85098765WXYZ',
    },
    financialInfo: {
      monthlyIncome: 2200000, // 2.2M UGX
      employerName: 'MTN Uganda',
      employmentStatus: 'employed',
    },
    idDocuments: {
      nationalIdFront: 'https://example.com/id-front-2.jpg',
      nationalIdBack: 'https://example.com/id-back-2.jpg',
      passportPhoto: 'https://example.com/photo-2.jpg',
    },
    status: 'approved',
    submittedAt: '2025-06-15T14:45:00Z',
    reviewedAt: '2025-06-17T09:20:00Z',
    approvedBy: 'admin-1',
    userId: 'user-2',
  },
  {
    id: '3',
    personalInfo: {
      firstName: 'Auma',
      lastName: 'Grace',
      dateOfBirth: '1992-11-03',
      gender: 'female',
      phoneNumber: '+256753456789',
      email: 'auma.grace@gmail.com',
      address: '123 Jinja Road, Kampala',
      idNumber: 'CM92112233EFGH',
    },
    financialInfo: {
      monthlyIncome: 1800000, // 1.8M UGX
      employerName: 'Stanbic Bank',
      employmentStatus: 'employed',
    },
    idDocuments: {
      nationalIdFront: 'https://example.com/id-front-3.jpg',
      nationalIdBack: 'https://example.com/id-back-3.jpg',
      passportPhoto: 'https://example.com/photo-3.jpg',
    },
    status: 'rejected',
    submittedAt: '2025-06-14T11:15:00Z',
    reviewedAt: '2025-06-16T16:30:00Z',
  },
  {
    id: '4',
    personalInfo: {
      firstName: 'Okello',
      lastName: 'David',
      dateOfBirth: '1988-07-12',
      gender: 'male',
      phoneNumber: '+256784567890',
      email: 'okello.david@gmail.com',
      address: '56 Muyenga Hill, Kampala',
      idNumber: 'CM88076543IJKL',
    },
    financialInfo: {
      monthlyIncome: 2500000, // 2.5M UGX
      employerName: 'Airtel Uganda',
      employmentStatus: 'employed',
    },
    idDocuments: {
      nationalIdFront: 'https://example.com/id-front-4.jpg',
      nationalIdBack: 'https://example.com/id-back-4.jpg',
      passportPhoto: 'https://example.com/photo-4.jpg',
    },
    status: 'pending',
    submittedAt: '2025-06-19T09:00:00Z',
  },
  {
    id: '5',
    personalInfo: {
      firstName: 'Namukasa',
      lastName: 'Joyce',
      dateOfBirth: '1995-03-28',
      gender: 'female',
      phoneNumber: '+256712345678',
      email: 'namukasa.joyce@yahoo.com',
      address: '34 Bukoto Street, Kampala',
      idNumber: 'CM95031122MNOP',
    },
    financialInfo: {
      monthlyIncome: 1200000, // 1.2M UGX
      employmentStatus: 'self_employed',
    },
    idDocuments: {
      nationalIdFront: 'https://example.com/id-front-5.jpg',
      nationalIdBack: 'https://example.com/id-back-5.jpg',
      passportPhoto: 'https://example.com/photo-5.jpg',
    },
    status: 'pending',
    submittedAt: '2025-06-20T13:20:00Z',
  },
];

// Utility function for UGX formatting
const formatUGX = (amount: number): string => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Utility function to format dates
const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'dd MMM yyyy, h:mm a');
};

export const OnboardingPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<MemberOnboarding[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<MemberOnboarding[]>([]);
  const [activeTab, setActiveTab] = useState<'applications' | 'register'>('applications');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedApplication, setSelectedApplication] = useState<MemberOnboarding | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Form state for new member registration
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    phoneNumber: '',
    email: '',
    address: '',
    idNumber: '',
    monthlyIncome: '',
    employmentStatus: 'employed',
    employerName: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({
    nationalIdFront: null,
    nationalIdBack: null,
    passportPhoto: null,
  });

  // Load applications data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setApplications(mockOnboardingApplications);
      setFilteredApplications(mockOnboardingApplications);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter applications based on search query and status filter
  useEffect(() => {
    let filtered = applications;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.personalInfo.firstName.toLowerCase().includes(query) ||
        app.personalInfo.lastName.toLowerCase().includes(query) ||
        app.personalInfo.idNumber.toLowerCase().includes(query) ||
        app.personalInfo.phoneNumber.includes(query) ||
        app.personalInfo.email.toLowerCase().includes(query)
      );
    }
    
    setFilteredApplications(filtered);
  }, [applications, searchQuery, statusFilter]);

  // Statistics calculations
  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  };

  // Handle application approval
  const handleApprove = (application: MemberOnboarding) => {
    // In a real app, this would be an API call
    const updatedApplications = applications.map(app => 
      app.id === application.id 
        ? { 
            ...app, 
            status: 'approved', 
            reviewedAt: new Date().toISOString(),
            approvedBy: 'admin-1', // Would be actual user ID in real app
            userId: `user-${app.id}` // Would be generated in backend
          } 
        : app
    );
    
    setApplications(updatedApplications);
    
    // Close modal if open
    if (showDetailsModal) {
      setShowDetailsModal(false);
      // Update the selected application
      const updated = updatedApplications.find(app => app.id === application.id);
      if (updated) {
        setSelectedApplication(updated);
      }
    }
  };

  // Handle application rejection
  const handleReject = (application: MemberOnboarding) => {
    // In a real app, this would be an API call
    const updatedApplications = applications.map(app => 
      app.id === application.id 
        ? { 
            ...app, 
            status: 'rejected', 
            reviewedAt: new Date().toISOString() 
          } 
        : app
    );
    
    setApplications(updatedApplications);
    
    // Close modal if open
    if (showDetailsModal) {
      setShowDetailsModal(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewMember(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if any
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFiles(prev => ({ ...prev, [fieldName]: e.target.files![0] }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Required fields validation
    if (!newMember.firstName) errors.firstName = 'First name is required';
    if (!newMember.lastName) errors.lastName = 'Last name is required';
    if (!newMember.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!newMember.phoneNumber) errors.phoneNumber = 'Phone number is required';
    if (!newMember.idNumber) errors.idNumber = 'National ID number is required';
    
    // Uganda-specific validations
    if (newMember.phoneNumber && !newMember.phoneNumber.match(/^\+256[0-9]{9}$/)) {
      errors.phoneNumber = 'Enter a valid Ugandan phone number (+256XXXXXXXXX)';
    }
    
    // Uganda National ID: 'CM' + 8 digits + 4 uppercase letters  (e.g. CM86022103YAJL)
    if (newMember.idNumber && !newMember.idNumber.match(/^CM[0-9]{8}[A-Z]{4}$/)) {
      errors.idNumber = 'Enter a valid Ugandan National ID (e.g. CM86022103YAJL)';
    }
    
    if (newMember.email && !newMember.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.email = 'Enter a valid email address';
    }
    
    if (newMember.monthlyIncome && isNaN(Number(newMember.monthlyIncome))) {
      errors.monthlyIncome = 'Monthly income must be a number';
    }
    
    // Required files validation
    if (!uploadedFiles.nationalIdFront) errors.nationalIdFront = 'National ID front scan is required';
    if (!uploadedFiles.nationalIdBack) errors.nationalIdBack = 'National ID back scan is required';
    if (!uploadedFiles.passportPhoto) errors.passportPhoto = 'Passport photo is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // In a real app, this would be an API call to create a new application
    const newApplication: MemberOnboarding = {
      id: `new-${Date.now()}`,
      personalInfo: {
        firstName: newMember.firstName,
        lastName: newMember.lastName,
        dateOfBirth: newMember.dateOfBirth,
        gender: newMember.gender as 'male' | 'female' | 'other',
        phoneNumber: newMember.phoneNumber,
        email: newMember.email,
        address: newMember.address,
        idNumber: newMember.idNumber,
      },
      financialInfo: {
        monthlyIncome: Number(newMember.monthlyIncome) || 0,
        employmentStatus: newMember.employmentStatus as 'employed' | 'self_employed' | 'unemployed',
        employerName: newMember.employerName,
      },
      idDocuments: {
        nationalIdFront: uploadedFiles.nationalIdFront ? URL.createObjectURL(uploadedFiles.nationalIdFront) : undefined,
        nationalIdBack: uploadedFiles.nationalIdBack ? URL.createObjectURL(uploadedFiles.nationalIdBack) : undefined,
        passportPhoto: uploadedFiles.passportPhoto ? URL.createObjectURL(uploadedFiles.passportPhoto) : undefined,
      },
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    
    // Add to applications list
    setApplications(prev => [newApplication, ...prev]);
    
    // Reset form
    setNewMember({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'male',
      phoneNumber: '',
      email: '',
      address: '',
      idNumber: '',
      monthlyIncome: '',
      employmentStatus: 'employed',
      employerName: '',
    });
    
    setUploadedFiles({
      nationalIdFront: null,
      nationalIdBack: null,
      passportPhoto: null,
    });
    
    // Switch to applications tab
    setActiveTab('applications');
  };

  // View application details
  const viewApplicationDetails = (application: MemberOnboarding) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Member Onboarding & Enrollment</h1>
        <p className="text-secondary-600 mt-1">
          Manage member applications and register new members
        </p>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="bg-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Applications</p>
                {isLoading ? (
                  <Skeleton height={30} width={60} />
                ) : (
                  <p className="text-2xl font-bold text-secondary-900 mt-1">{stats.total}</p>
                )}
              </div>
              <div className="bg-primary-50 p-3 rounded-full">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Pending Review</p>
                {isLoading ? (
                  <Skeleton height={30} width={60} />
                ) : (
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
                )}
              </div>
              <div className="bg-yellow-50 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Approved</p>
                {isLoading ? (
                  <Skeleton height={30} width={60} />
                ) : (
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</p>
                )}
              </div>
              <div className="bg-green-50 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Rejected</p>
                {isLoading ? (
                  <Skeleton height={30} width={60} />
                ) : (
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
                )}
              </div>
              <div className="bg-red-50 p-3 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex border-b border-secondary-200">
          <button
            className={clsx(
              "px-6 py-4 text-sm font-medium flex items-center",
              activeTab === 'applications' 
                ? "text-primary-600 border-b-2 border-primary-600" 
                : "text-secondary-600 hover:text-secondary-900"
            )}
            onClick={() => setActiveTab('applications')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Applications
          </button>
          <button
            className={clsx(
              "px-6 py-4 text-sm font-medium flex items-center",
              activeTab === 'register' 
                ? "text-primary-600 border-b-2 border-primary-600" 
                : "text-secondary-600 hover:text-secondary-900"
            )}
            onClick={() => setActiveTab('register')}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Register New Member
          </button>
        </div>
        
        {/* Applications Tab Content */}
        {activeTab === 'applications' && (
          <div className="p-6">
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by name, ID, phone, or email..."
                  className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="text-secondary-400 h-5 w-5" />
                <select
                  className="border border-secondary-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            
            {/* Applications List */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Income
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {isLoading ? (
                    Array(5).fill(0).map((_, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton height={20} width={150} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton height={20} width={120} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton height={20} width={80} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton height={20} width={100} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton height={20} width={70} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton height={20} width={100} />
                        </td>
                      </tr>
                    ))
                  ) : filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-secondary-500">
                        No applications found
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((application) => (
                      <tr key={application.id} className="hover:bg-secondary-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-medium">
                                {application.personalInfo.firstName.charAt(0)}
                                {application.personalInfo.lastName.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-secondary-900">
                                {application.personalInfo.firstName} {application.personalInfo.lastName}
                              </div>
                              <div className="text-sm text-secondary-500">
                                ID: {application.personalInfo.idNumber}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-secondary-900">{application.personalInfo.phoneNumber}</div>
                          <div className="text-sm text-secondary-500">{application.personalInfo.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-secondary-900">
                            {formatUGX(application.financialInfo.monthlyIncome)}
                          </div>
                          <div className="text-sm text-secondary-500">
                            {application.financialInfo.employmentStatus === 'employed' 
                              ? application.financialInfo.employerName 
                              : application.financialInfo.employmentStatus}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          {formatDate(application.submittedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={clsx(
                            "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                            application.status === 'pending' ? "bg-yellow-100 text-yellow-800" :
                            application.status === 'approved' ? "bg-green-100 text-green-800" :
                            "bg-red-100 text-red-800"
                          )}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewApplicationDetails(application)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            {application.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(application)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <CheckCircle className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleReject(application)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <XCircle className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Register New Member Tab Content */}
        {activeTab === 'register' && (
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium text-secondary-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-secondary-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={newMember.firstName}
                      onChange={handleInputChange}
                      className={clsx(
                        "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500",
                        formErrors.firstName ? "border-red-300" : "border-secondary-300"
                      )}
                    />
                    {formErrors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-secondary-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={newMember.lastName}
                      onChange={handleInputChange}
                      className={clsx(
                        "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500",
                        formErrors.lastName ? "border-red-300" : "border-secondary-300"
                      )}
                    />
                    {formErrors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-secondary-700 mb-1">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={newMember.dateOfBirth}
                      onChange={handleInputChange}
                      className={clsx(
                        "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500",
                        formErrors.dateOfBirth ? "border-red-300" : "border-secondary-300"
                      )}
                    />
                    {formErrors.dateOfBirth && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.dateOfBirth}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-secondary-700 mb-1">
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={newMember.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-secondary-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 h-5 w-5" />
                      <input
                        type="text"
                        id="phoneNumber"
                        name="phoneNumber"
                        placeholder="+256XXXXXXXXX"
                        value={newMember.phoneNumber}
                        onChange={handleInputChange}
                        className={clsx(
                          "w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500",
                          formErrors.phoneNumber ? "border-red-300" : "border-secondary-300"
                        )}
                      />
                    </div>
                    {formErrors.phoneNumber && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.phoneNumber}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 h-5 w-5" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={newMember.email}
                        onChange={handleInputChange}
                        className={clsx(
                          "w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500",
                          formErrors.email ? "border-red-300" : "border-secondary-300"
                        )}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-secondary-700 mb-1">
                      Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-secondary-400 h-5 w-5" />
                      <textarea
                        id="address"
                        name="address"
                        rows={3}
                        value={newMember.address}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="idNumber" className="block text-sm font-medium text-secondary-700 mb-1">
                      National ID Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="idNumber"
                      name="idNumber"
                      placeholder="CM86022103YAJL"
                      value={newMember.idNumber}
                      onChange={handleInputChange}
                      className={clsx(
                        "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500",
                        formErrors.idNumber ? "border-red-300" : "border-secondary-300"
                      )}
                    />
                    {formErrors.idNumber && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.idNumber}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Financial Information */}
              <div>
                <h3 className="text-lg font-medium text-secondary-900 mb-4">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="monthlyIncome" className="block text-sm font-medium text-secondary-700 mb-1">
                      Monthly Income (UGX)
                    </label>
                    <input
                      type="text"
                      id="monthlyIncome"
                      name="monthlyIncome"
                      placeholder="e.g. 1500000"
                      value={newMember.monthlyIncome}
                      onChange={handleInputChange}
                      className={clsx(
                        "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500",
                        formErrors.monthlyIncome ? "border-red-300" : "border-secondary-300"
                      )}
                    />
                    {formErrors.monthlyIncome && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.monthlyIncome}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="employmentStatus" className="block text-sm font-medium text-secondary-700 mb-1">
                      Employment Status
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 h-5 w-5" />
                      <select
                        id="employmentStatus"
                        name="employmentStatus"
                        value={newMember.employmentStatus}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="employed">Employed</option>
                        <option value="self_employed">Self-Employed</option>
                        <option value="unemployed">Unemployed</option>
                      </select>
                    </div>
                  </div>
                  
                  {newMember.employmentStatus === 'employed' && (
                    <div>
                      <label htmlFor="employerName" className="block text-sm font-medium text-secondary-700 mb-1">
                        Employer Name
                      </label>
                      <input
                        type="text"
                        id="employerName"
                        name="employerName"
                        value={newMember.employerName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* ID Documents */}
              <div>
                <h3 className="text-lg font-medium text-secondary-900 mb-4">ID Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="nationalIdFront" className="block text-sm font-medium text-secondary-700 mb-1">
                      National ID (Front) <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-secondary-300 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        {uploadedFiles.nationalIdFront ? (
                          <div className="text-sm text-secondary-600">
                            <p className="text-primary-600 font-medium">
                              {uploadedFiles.nationalIdFront.name}
                            </p>
                            <p className="text-xs text-secondary-500 mt-1">
                              {(uploadedFiles.nationalIdFront.size / 1024).toFixed(2)} KB
                            </p>
                            <button
                              type="button"
                              onClick={() => setUploadedFiles(prev => ({ ...prev, nationalIdFront: null }))}
                              className="mt-2 text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <>
                            <svg
                              className="mx-auto h-12 w-12 text-secondary-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="flex text-sm text-secondary-600">
                              <label
                                htmlFor="nationalIdFront"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
                              >
                                <span>Upload file</span>
                                <input
                                  id="nationalIdFront"
                                  name="nationalIdFront"
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={(e) => handleFileUpload(e, 'nationalIdFront')}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-secondary-500">PNG, JPG, GIF up to 10MB</p>
                          </>
                        )}
                      </div>
                    </div>
                    {formErrors.nationalIdFront && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.nationalIdFront}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="nationalIdBack" className="block text-sm font-medium text-secondary-700 mb-1">
                      National ID (Back) <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-secondary-300 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        {uploadedFiles.nationalIdBack ? (
                          <div className="text-sm text-secondary-600">
                            <p className="text-primary-600 font-medium">
                              {uploadedFiles.nationalIdBack.name}
                            </p>
                            <p className="text-xs text-secondary-500 mt-1">
                              {(uploadedFiles.nationalIdBack.size / 1024).toFixed(2)} KB
                            </p>
                            <button
                              type="button"
                              onClick={() => setUploadedFiles(prev => ({ ...prev, nationalIdBack: null }))}
                              className="mt-2 text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <>
                            <svg
                              className="mx-auto h-12 w-12 text-secondary-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="flex text-sm text-secondary-600">
                              <label
                                htmlFor="nationalIdBack"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
                              >
                                <span>Upload file</span>
                                <input
                                  id="nationalIdBack"
                                  name="nationalIdBack"
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={(e) => handleFileUpload(e, 'nationalIdBack')}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-secondary-500">PNG, JPG, GIF up to 10MB</p>
                          </>
                        )}
                      </div>
                    </div>
                    {formErrors.nationalIdBack && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.nationalIdBack}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="passportPhoto" className="block text-sm font-medium text-secondary-700 mb-1">
                      Passport Photo <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-secondary-300 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        {uploadedFiles.passportPhoto ? (
                          <div className="text-sm text-secondary-600">
                            <p className="text-primary-600 font-medium">
                              {uploadedFiles.passportPhoto.name}
                            </p>
                            <p className="text-xs text-secondary-500 mt-1">
                              {(uploadedFiles.passportPhoto.size / 1024).toFixed(2)} KB
                            </p>
                            <button
                              type="button"
                              onClick={() => setUploadedFiles(prev => ({ ...prev, passportPhoto: null }))}
                              className="mt-2 text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <>
                            <svg
                              className="mx-auto h-12 w-12 text-secondary-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="flex text-sm text-secondary-600">
                              <label
                                htmlFor="passportPhoto"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
                              >
                                <span>Upload file</span>
                                <input
                                  id="passportPhoto"
                                  name="passportPhoto"
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={(e) => handleFileUpload(e, 'passportPhoto')}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-secondary-500">PNG, JPG, GIF up to 10MB</p>
                          </>
                        )}
                      </div>
                    </div>
                    {formErrors.passportPhoto && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.passportPhoto}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setNewMember({
                      firstName: '',
                      lastName: '',
                      dateOfBirth: '',
                      gender: 'male',
                      phoneNumber: '',
                      email: '',
                      address: '',
                      idNumber: '',
                      monthlyIncome: '',
                      employmentStatus: 'employed',
                      employerName: '',
                    });
                    setUploadedFiles({
                      nationalIdFront: null,
                      nationalIdBack: null,
                      passportPhoto: null,
                    });
                    setFormErrors({});
                  }}
                >
                  Reset Form
                </Button>
                <Button type="submit">
                  Register Member
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
      
      {/* Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-secondary-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowDetailsModal(false)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg leading-6 font-medium text-secondary-900">
                    Application Details
                  </h3>
                  <button
                    type="button"
                    className="bg-white rounded-md text-secondary-400 hover:text-secondary-500 focus:outline-none"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium text-lg">
                        {selectedApplication.personalInfo.firstName.charAt(0)}
                        {selectedApplication.personalInfo.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-medium text-secondary-900">
                        {selectedApplication.personalInfo.firstName} {selectedApplication.personalInfo.lastName}
                      </h4>
                      <p className="text-sm text-secondary-500">
                        Applied on {formatDate(selectedApplication.submittedAt)}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <span className={clsx(
                        "px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full",
                        selectedApplication.status === 'pending' ? "bg-yellow-100 text-yellow-800" :
                        selectedApplication.status === 'approved' ? "bg-green-100 text-green-800" :
                        "bg-red-100 text-red-800"
                      )}>
                        {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="bg-secondary-50 p-4 rounded-lg">
                      <h5 className="text-sm font-medium text-secondary-700 mb-3">Personal Information</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-secondary-500">Full Name</span>
                          <span className="text-sm text-secondary-900 font-medium">
                            {selectedApplication.personalInfo.firstName} {selectedApplication.personalInfo.lastName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-secondary-500">Gender</span>
                          <span className="text-sm text-secondary-900 font-medium">
                            {selectedApplication.personalInfo.gender.charAt(0).toUpperCase() + selectedApplication.personalInfo.gender.slice(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-secondary-500">Date of Birth</span>
                          <span className="text-sm text-secondary-900 font-medium">
                            {selectedApplication.personalInfo.dateOfBirth}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-secondary-500">National ID</span>
                          <span className="text-sm text-secondary-900 font-medium">
                            {selectedApplication.personalInfo.idNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-secondary-500">Phone</span>
                          <span className="text-sm text-secondary-900 font-medium">
                            {selectedApplication.personalInfo.phoneNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-secondary-500">Email</span>
                          <span className="text-sm text-secondary-900 font-medium">
                            {selectedApplication.personalInfo.email}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-secondary-500">Address</span>
                          <span className="text-sm text-secondary-900 font-medium">
                            {selectedApplication.personalInfo.address}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Financial Information */}
                    <div className="bg-secondary-50 p-4 rounded-lg">
                      <h5 className="text-sm font-medium text-secondary-700 mb-3">Financial Information</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-secondary-500">Monthly Income</span>
                          <span className="text-sm text-secondary-900 font-medium">
                            {formatUGX(selectedApplication.financialInfo.monthlyIncome)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-secondary-500">Employment Status</span>
                          <span className="text-sm text-secondary-900 font-medium">
                            {selectedApplication.financialInfo.employmentStatus === 'employed' ? 'Employed' :
                             selectedApplication.financialInfo.employmentStatus === 'self_employed' ? 'Self-Employed' : 'Unemployed'}
                          </span>
                        </div>
                        {selectedApplication.financialInfo.employerName && (
                          <div className="flex justify-between">
                            <span className="text-sm text-secondary-500">Employer</span>
                            <span className="text-sm text-secondary-900 font-medium">
                              {selectedApplication.financialInfo.employerName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* ID Documents */}
                  <div className="mt-6">
                    <h5 className="text-sm font-medium text-secondary-700 mb-3">ID Documents</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedApplication.idDocuments.nationalIdFront && (
                        <div className="border border-secondary-200 rounded-lg overflow-hidden">
                          <div className="bg-secondary-100 px-3 py-2 flex justify-between items-center">
                            <span className="text-xs font-medium text-secondary-700">National ID (Front)</span>
                            <button className="text-primary-600 hover:text-primary-800">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="p-2">
                            <img
                              src={selectedApplication.idDocuments.nationalIdFront}
                              alt="National ID Front"
                              className="w-full h-32 object-cover rounded"
                            />
                          </div>
                        </div>
                      )}
                      
                      {selectedApplication.idDocuments.nationalIdBack && (
                        <div className="border border-secondary-200 rounded-lg overflow-hidden">
                          <div className="bg-secondary-100 px-3 py-2 flex justify-between items-center">
                            <span className="text-xs font-medium text-secondary-700">National ID (Back)</span>
                            <button className="text-primary-600 hover:text-primary-800">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="p-2">
                            <img
                              src={selectedApplication.idDocuments.nationalIdBack}
                              alt="National ID Back"
                              className="w-full h-32 object-cover rounded"
                            />
                          </div>
                        </div>
                      )}
                      
                      {selectedApplication.idDocuments.passportPhoto && (
                        <div className="border border-secondary-200 rounded-lg overflow-hidden">
                          <div className="bg-secondary-100 px-3 py-2 flex justify-between items-center">
                            <span className="text-xs font-medium text-secondary-700">Passport Photo</span>
                            <button className="text-primary-600 hover:text-primary-800">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="p-2">
                            <img
                              src={selectedApplication.idDocuments.passportPhoto}
                              alt="Passport Photo"
                              className="w-full h-32 object-cover rounded"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Application Timeline */}
                  <div className="mt-6">
                    <h5 className="text-sm font-medium text-secondary-700 mb-3">Application Timeline</h5>
                    <div className="border-l-2 border-secondary-200 pl-4 ml-2 space-y-4">
                      <div className="relative">
                        <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-green-500"></div>
                        <p className="text-sm font-medium text-secondary-900">Application Submitted</p>
                        <p className="text-xs text-secondary-500">{formatDate(selectedApplication.submittedAt)}</p>
                      </div>
                      
                      {selectedApplication.reviewedAt && (
                        <div className="relative">
                          <div className={clsx(
                            "absolute -left-6 mt-1 w-4 h-4 rounded-full",
                            selectedApplication.status === 'approved' ? "bg-green-500" : "bg-red-500"
                          )}></div>
                          <p className="text-sm font-medium text-secondary-900">
                            Application {selectedApplication.status === 'approved' ? 'Approved' : 'Rejected'}
                          </p>
                          <p className="text-xs text-secondary-500">{formatDate(selectedApplication.reviewedAt)}</p>
                          {selectedApplication.status === 'approved' && selectedApplication.approvedBy && (
                            <p className="text-xs text-secondary-500">
                              Approved by: Admin #{selectedApplication.approvedBy}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {selectedApplication.status === 'approved' && selectedApplication.userId && (
                        <div className="relative">
                          <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-green-500"></div>
                          <p className="text-sm font-medium text-secondary-900">Member Account Created</p>
                          <p className="text-xs text-secondary-500">User ID: {selectedApplication.userId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-secondary-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedApplication.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => handleApprove(selectedApplication)}
                      variant="success"
                      className="w-full sm:w-auto sm:ml-3"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Application
                    </Button>
                    <Button
                      onClick={() => handleReject(selectedApplication)}
                      variant="danger"
                      className="mt-3 sm:mt-0 w-full sm:w-auto sm:ml-3"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Application
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => setShowDetailsModal(false)}
                  variant="outline"
                  className="mt-3 sm:mt-0 w-full sm:w-auto"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Alert for Successful Registration */}
      {/* This would be shown after successful registration in a real app */}
    </div>
  );
};
