import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  User,
  Loan,
  Transaction,
  Account,
  Fine,
  Investment,
  Communication,
  DashboardStats,
  MemberOnboarding,
  Deposit,
  LoanProduct,
  MobileWallet,
  Report,
  Statement,
  Employer,
  LedgerEntry,
  LedgerCategory,
  BankAccount,
  Checkoff,
  MobileMoneyTransaction,
  Vendor
} from '../types';
// Environment-based API URL configuration
const API_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || 'https://api.kawempesacco.com/api/v1'
  : 'http://localhost:3000/api/v1';

// API response interfaces
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ErrorResponse {
  success: boolean;
  error: string;
  message: string;
  statusCode: number;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AuthResponse {
  user: User;
  token: string;
}

// Token management
const TOKEN_KEY = 'kawempe_sacco_token';
const USER_KEY = 'kawempe_sacco_user';

const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
const removeToken = (): void => localStorage.removeItem(TOKEN_KEY);

const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

const setStoredUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const removeStoredUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 seconds
});

// Request interceptor for adding token
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          const { token } = response.data;
          setToken(token);
          
          // Update authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          
          // Retry original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, logout user
        AuthService.logout();
        window.location.href = '/login';
      }
    }
    
    // Handle other errors
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleApiError = (error: any): never => {
  let errorMessage = 'An unexpected error occurred';
  
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;
    if (axiosError.response?.data?.message) {
      errorMessage = axiosError.response.data.message;
    } else if (axiosError.message) {
      errorMessage = axiosError.message;
    }
    
    // Network errors
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. Please try again.';
    } else if (!error.response) {
      errorMessage = 'Network error. Please check your connection.';
    }
  }
  
  throw new Error(errorMessage);
};

// Authentication Service
export const AuthService = {
  async login(email: string, password: string): Promise<User> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
      const { token, user } = response.data.data;
      
      setToken(token);
      setStoredUser(user);
      
      return user;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async logout(): Promise<void> {
    try {
      const token = getToken();
      if (token) {
        await apiClient.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeToken();
      removeStoredUser();
    }
  },
  
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = getToken();
      if (!token) return null;
      
      const response = await apiClient.get<ApiResponse<User>>('/auth/me');
      const user = response.data.data;
      setStoredUser(user);
      return user;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        removeToken();
        removeStoredUser();
        return null;
      }
      return handleApiError(error);
    }
  },
  
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword });
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword });
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Members Service
export const MembersService = {
  async getMembers(page = 1, limit = 10, search = '', status = ''): Promise<PaginatedResponse<User>> {
    try {
      const response = await apiClient.get<PaginatedResponse<User>>('/members', {
        params: { page, limit, search, status }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getMemberById(id: string): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<User>>(`/members/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async createMember(memberData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.post<ApiResponse<User>>('/members', memberData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async updateMember(id: string, memberData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<User>>(`/members/${id}`, memberData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async deleteMember(id: string): Promise<void> {
    try {
      await apiClient.delete(`/members/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getMemberAccounts(memberId: string): Promise<Account[]> {
    try {
      const response = await apiClient.get<ApiResponse<Account[]>>(`/members/${memberId}/accounts`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getMemberLoans(memberId: string): Promise<Loan[]> {
    try {
      const response = await apiClient.get<ApiResponse<Loan[]>>(`/members/${memberId}/loans`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getMemberTransactions(memberId: string, page = 1, limit = 10): Promise<PaginatedResponse<Transaction>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Transaction>>(`/members/${memberId}/transactions`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Onboarding Service
export const OnboardingService = {
  async getOnboardingApplications(page = 1, limit = 10, status = ''): Promise<PaginatedResponse<MemberOnboarding>> {
    try {
      const response = await apiClient.get<PaginatedResponse<MemberOnboarding>>('/onboarding', {
        params: { page, limit, status }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getOnboardingById(id: string): Promise<MemberOnboarding> {
    try {
      const response = await apiClient.get<ApiResponse<MemberOnboarding>>(`/onboarding/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async createOnboarding(data: Partial<MemberOnboarding>): Promise<MemberOnboarding> {
    try {
      const response = await apiClient.post<ApiResponse<MemberOnboarding>>('/onboarding', data);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async updateOnboarding(id: string, data: Partial<MemberOnboarding>): Promise<MemberOnboarding> {
    try {
      const response = await apiClient.put<ApiResponse<MemberOnboarding>>(`/onboarding/${id}`, data);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async approveOnboarding(id: string, approvedBy: string): Promise<MemberOnboarding> {
    try {
      const response = await apiClient.post<ApiResponse<MemberOnboarding>>(`/onboarding/${id}/approve`, { approvedBy });
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async rejectOnboarding(id: string, reason: string): Promise<MemberOnboarding> {
    try {
      const response = await apiClient.post<ApiResponse<MemberOnboarding>>(`/onboarding/${id}/reject`, { reason });
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async uploadDocument(id: string, documentType: string, file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      
      const response = await apiClient.post<ApiResponse<{url: string}>>(`/onboarding/${id}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.data.url;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Loans Service
export const LoansService = {
  async getLoans(page = 1, limit = 10, status = '', loanType = ''): Promise<PaginatedResponse<Loan>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Loan>>('/loans', {
        params: { page, limit, status, loanType }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getLoanById(id: string): Promise<Loan> {
    try {
      const response = await apiClient.get<ApiResponse<Loan>>(`/loans/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async createLoanApplication(loanData: Partial<Loan>): Promise<Loan> {
    try {
      const response = await apiClient.post<ApiResponse<Loan>>('/loans', loanData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async updateLoan(id: string, loanData: Partial<Loan>): Promise<Loan> {
    try {
      const response = await apiClient.put<ApiResponse<Loan>>(`/loans/${id}`, loanData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async approveLoan(id: string, approvedBy: string): Promise<Loan> {
    try {
      const response = await apiClient.post<ApiResponse<Loan>>(`/loans/${id}/approve`, { approvedBy });
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async rejectLoan(id: string, reason: string): Promise<Loan> {
    try {
      const response = await apiClient.post<ApiResponse<Loan>>(`/loans/${id}/reject`, { reason });
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async disburseLoan(id: string, disbursedBy: string): Promise<Loan> {
    try {
      const response = await apiClient.post<ApiResponse<Loan>>(`/loans/${id}/disburse`, { disbursedBy });
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async recordLoanPayment(id: string, paymentData: Partial<Transaction>): Promise<Transaction> {
    try {
      const response = await apiClient.post<ApiResponse<Transaction>>(`/loans/${id}/payments`, paymentData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getLoanProducts(): Promise<LoanProduct[]> {
    try {
      const response = await apiClient.get<ApiResponse<LoanProduct[]>>('/loan-products');
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async createLoanProduct(productData: Partial<LoanProduct>): Promise<LoanProduct> {
    try {
      const response = await apiClient.post<ApiResponse<LoanProduct>>('/loan-products', productData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async updateLoanProduct(id: string, productData: Partial<LoanProduct>): Promise<LoanProduct> {
    try {
      const response = await apiClient.put<ApiResponse<LoanProduct>>(`/loan-products/${id}`, productData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Deposits Service
export const DepositsService = {
  async getDeposits(page = 1, limit = 10, memberId = '', category = ''): Promise<PaginatedResponse<Deposit>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Deposit>>('/deposits', {
        params: { page, limit, memberId, category }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async createDeposit(depositData: Partial<Deposit>): Promise<Deposit> {
    try {
      const response = await apiClient.post<ApiResponse<Deposit>>('/deposits', depositData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getDepositById(id: string): Promise<Deposit> {
    try {
      const response = await apiClient.get<ApiResponse<Deposit>>(`/deposits/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async processCheckoff(checkoffData: Partial<Checkoff>): Promise<Checkoff> {
    try {
      const response = await apiClient.post<ApiResponse<Checkoff>>('/checkoffs', checkoffData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getCheckoffs(page = 1, limit = 10, employerId = '', period = ''): Promise<PaginatedResponse<Checkoff>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Checkoff>>('/checkoffs', {
        params: { page, limit, employerId, period }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async uploadBulkDeposits(file: File): Promise<{processed: number, failed: number}> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post<ApiResponse<{processed: number, failed: number}>>('/deposits/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Transactions Service
export const TransactionsService = {
  async getTransactions(page = 1, limit = 10, type = '', status = ''): Promise<PaginatedResponse<Transaction>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Transaction>>('/transactions', {
        params: { page, limit, type, status }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getTransactionById(id: string): Promise<Transaction> {
    try {
      const response = await apiClient.get<ApiResponse<Transaction>>(`/transactions/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async createTransaction(transactionData: Partial<Transaction>): Promise<Transaction> {
    try {
      const response = await apiClient.post<ApiResponse<Transaction>>('/transactions', transactionData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async updateTransactionStatus(id: string, status: string): Promise<Transaction> {
    try {
      const response = await apiClient.put<ApiResponse<Transaction>>(`/transactions/${id}/status`, { status });
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Fines Service
export const FinesService = {
  async getFines(page = 1, limit = 10, status = '', category = ''): Promise<PaginatedResponse<Fine>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Fine>>('/fines', {
        params: { page, limit, status, category }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getFineById(id: string): Promise<Fine> {
    try {
      const response = await apiClient.get<ApiResponse<Fine>>(`/fines/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async createFine(fineData: Partial<Fine>): Promise<Fine> {
    try {
      const response = await apiClient.post<ApiResponse<Fine>>('/fines', fineData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async updateFine(id: string, fineData: Partial<Fine>): Promise<Fine> {
    try {
      const response = await apiClient.put<ApiResponse<Fine>>(`/fines/${id}`, fineData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async payFine(id: string, paymentData: Partial<Transaction>): Promise<Fine> {
    try {
      const response = await apiClient.post<ApiResponse<Fine>>(`/fines/${id}/pay`, paymentData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async waiveFine(id: string, reason: string): Promise<Fine> {
    try {
      const response = await apiClient.post<ApiResponse<Fine>>(`/fines/${id}/waive`, { reason });
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Mobile Money Service
export const MobileMoneyService = {
  async getWallets(page = 1, limit = 10, provider = ''): Promise<PaginatedResponse<MobileWallet>> {
    try {
      const response = await apiClient.get<PaginatedResponse<MobileWallet>>('/mobile-wallets', {
        params: { page, limit, provider }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getWalletById(id: string): Promise<MobileWallet> {
    try {
      const response = await apiClient.get<ApiResponse<MobileWallet>>(`/mobile-wallets/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async createWallet(walletData: Partial<MobileWallet>): Promise<MobileWallet> {
    try {
      const response = await apiClient.post<ApiResponse<MobileWallet>>('/mobile-wallets', walletData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async updateWalletStatus(id: string, status: string): Promise<MobileWallet> {
    try {
      const response = await apiClient.put<ApiResponse<MobileWallet>>(`/mobile-wallets/${id}/status`, { status });
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getMobileTransactions(page = 1, limit = 10, provider = ''): Promise<PaginatedResponse<MobileMoneyTransaction>> {
    try {
      const response = await apiClient.get<PaginatedResponse<MobileMoneyTransaction>>('/mobile-transactions', {
        params: { page, limit, provider }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async processMobileTransaction(transactionData: Partial<MobileMoneyTransaction>): Promise<MobileMoneyTransaction> {
    try {
      const response = await apiClient.post<ApiResponse<MobileMoneyTransaction>>('/mobile-transactions', transactionData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Reports Service
export const ReportsService = {
  async generateReport(type: string, parameters: Record<string, unknown>): Promise<Report> {
    try {
      const response = await apiClient.post<ApiResponse<Report>>('/reports', { type, parameters });
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getReports(page = 1, limit = 10, type = ''): Promise<PaginatedResponse<Report>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Report>>('/reports', {
        params: { page, limit, type }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getReportById(id: string): Promise<Report> {
    try {
      const response = await apiClient.get<ApiResponse<Report>>(`/reports/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async generateMemberStatement(memberId: string, fromDate: string, toDate: string): Promise<Statement> {
    try {
      const response = await apiClient.post<ApiResponse<Statement>>('/statements', { 
        memberId, 
        periodFrom: fromDate, 
        periodTo: toDate 
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getStatements(page = 1, limit = 10, memberId = ''): Promise<PaginatedResponse<Statement>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Statement>>('/statements', {
        params: { page, limit, memberId }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Dashboard Service
export const DashboardService = {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getMonthlyDepositsData(): Promise<{name: string, value: number}[]> {
    try {
      const response = await apiClient.get<ApiResponse<{name: string, value: number}[]>>('/dashboard/deposits-chart');
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getMonthlyLoansData(): Promise<{name: string, value: number}[]> {
    try {
      const response = await apiClient.get<ApiResponse<{name: string, value: number}[]>>('/dashboard/loans-chart');
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getRecentActivities(): Promise<{id: number, type: string, description: string, staffName: string, time: string, status: string}[]> {
    try {
      const response = await apiClient.get<ApiResponse<{id: number, type: string, description: string, staffName: string, time: string, status: string}[]>>('/dashboard/activities');
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Settings Service
export const SettingsService = {
  async getSystemSettings(): Promise<Record<string, any>> {
    try {
      const response = await apiClient.get<ApiResponse<Record<string, any>>>('/settings');
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async updateSystemSettings(settings: Record<string, any>): Promise<Record<string, any>> {
    try {
      const response = await apiClient.put<ApiResponse<Record<string, any>>>('/settings', settings);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getEmployers(): Promise<Employer[]> {
    try {
      const response = await apiClient.get<ApiResponse<Employer[]>>('/employers');
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async createEmployer(employerData: Partial<Employer>): Promise<Employer> {
    try {
      const response = await apiClient.post<ApiResponse<Employer>>('/employers', employerData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async updateEmployer(id: string, employerData: Partial<Employer>): Promise<Employer> {
    try {
      const response = await apiClient.put<ApiResponse<Employer>>(`/employers/${id}`, employerData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getBankAccounts(): Promise<BankAccount[]> {
    try {
      const response = await apiClient.get<ApiResponse<BankAccount[]>>('/bank-accounts');
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async createBankAccount(accountData: Partial<BankAccount>): Promise<BankAccount> {
    try {
      const response = await apiClient.post<ApiResponse<BankAccount>>('/bank-accounts', accountData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async updateBankAccount(id: string, accountData: Partial<BankAccount>): Promise<BankAccount> {
    try {
      const response = await apiClient.put<ApiResponse<BankAccount>>(`/bank-accounts/${id}`, accountData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Investments Service
export const InvestmentsService = {
  async getInvestments(page = 1, limit = 10, type = '', status = ''): Promise<PaginatedResponse<Investment>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Investment>>('/investments', {
        params: { page, limit, type, status }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getInvestmentById(id: string): Promise<Investment> {
    try {
      const response = await apiClient.get<ApiResponse<Investment>>(`/investments/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async createInvestment(investmentData: Partial<Investment>): Promise<Investment> {
    try {
      const response = await apiClient.post<ApiResponse<Investment>>('/investments', investmentData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async updateInvestment(id: string, investmentData: Partial<Investment>): Promise<Investment> {
    try {
      const response = await apiClient.put<ApiResponse<Investment>>(`/investments/${id}`, investmentData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async sellInvestment(id: string, saleData: {saleValue: number, saleDate: string}): Promise<Investment> {
    try {
      const response = await apiClient.post<ApiResponse<Investment>>(`/investments/${id}/sell`, saleData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Communications Service
export const CommunicationsService = {
  async getCommunications(page = 1, limit = 10, type = '', status = ''): Promise<PaginatedResponse<Communication>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Communication>>('/communications', {
        params: { page, limit, type, status }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getCommunicationById(id: string): Promise<Communication> {
    try {
      const response = await apiClient.get<ApiResponse<Communication>>(`/communications/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async createCommunication(communicationData: Partial<Communication>): Promise<Communication> {
    try {
      const response = await apiClient.post<ApiResponse<Communication>>('/communications', communicationData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async updateCommunication(id: string, communicationData: Partial<Communication>): Promise<Communication> {
    try {
      const response = await apiClient.put<ApiResponse<Communication>>(`/communications/${id}`, communicationData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async sendCommunication(id: string): Promise<Communication> {
    try {
      const response = await apiClient.post<ApiResponse<Communication>>(`/communications/${id}/send`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async deleteCommunication(id: string): Promise<void> {
    try {
      await apiClient.delete(`/communications/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Accounting Service
export const AccountingService = {
  async getLedgerEntries(page = 1, limit = 10, type = '', fromDate = '', toDate = ''): Promise<PaginatedResponse<LedgerEntry>> {
    try {
      const response = await apiClient.get<PaginatedResponse<LedgerEntry>>('/ledger', {
        params: { page, limit, type, fromDate, toDate }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async createLedgerEntry(entryData: Partial<LedgerEntry>): Promise<LedgerEntry> {
    try {
      const response = await apiClient.post<ApiResponse<LedgerEntry>>('/ledger', entryData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async updateLedgerEntry(id: string, entryData: Partial<LedgerEntry>): Promise<LedgerEntry> {
    try {
      const response = await apiClient.put<ApiResponse<LedgerEntry>>(`/ledger/${id}`, entryData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async deleteLedgerEntry(id: string): Promise<void> {
    try {
      await apiClient.delete(`/ledger/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getLedgerCategories(): Promise<{categories: LedgerCategory[]}> {
    try {
      const response = await apiClient.get<ApiResponse<{categories: LedgerCategory[]}>>('/ledger/categories');
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async getFinancialSummary(year: number, month?: number): Promise<Record<string, any>> {
    try {
      const response = await apiClient.get<ApiResponse<Record<string, any>>>('/accounting/summary', {
        params: { year, month }
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async generateTrialBalance(asOfDate: string): Promise<Report> {
    try {
      const response = await apiClient.post<ApiResponse<Report>>('/accounting/trial-balance', { asOfDate });
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async generateFinancialStatement(type: 'income' | 'balance' | 'cash_flow', fromDate: string, toDate: string): Promise<Report> {
    try {
      const response = await apiClient.post<ApiResponse<Report>>('/accounting/financial-statement', { 
        type, 
        fromDate, 
        toDate 
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Export a default API object with all services
const API = {
  auth: AuthService,
  members: MembersService,
  onboarding: OnboardingService,
  loans: LoansService,
  deposits: DepositsService,
  transactions: TransactionsService,
  fines: FinesService,
  mobileMoney: MobileMoneyService,
  reports: ReportsService,
  dashboard: DashboardService,
  settings: SettingsService,
  investments: InvestmentsService,
  communications: CommunicationsService,
  accounting: AccountingService
};

export default API;
