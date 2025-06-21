/**
 * Kawempe SACCO Management System - Backend Domain Models
 * 
 * This file contains TypeScript interfaces for all backend domain models.
 * These extend the frontend models with additional backend-specific fields
 * such as password hashes, timestamps, and soft deletion flags.
 */

/**
 * Base model interface with common fields for all models
 */
export interface BaseModel {
  id: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;
}

/**
 * User model representing members, staff, and admins
 */
export interface User extends BaseModel {
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'staff' | 'member';
  memberNumber?: string;
  phoneNumber: string;
  idNumber: string;
  address: string;
  employerName?: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
  profileImage?: string;
  
  // Backend-specific fields
  password: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLoginAt?: Date;
  failedLoginAttempts?: number;
  lockedUntil?: Date;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  
  // Audit fields
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Account model for member savings, fixed deposits, etc.
 */
export interface Account extends BaseModel {
  memberId: string;
  accountType: 'savings' | 'fixed' | 'special';
  balance: number;
  interestRate: number;
  openingDate: string;
  lastTransactionDate: string;
  status: 'active' | 'dormant' | 'closed';
  
  // Backend-specific fields
  accountNumber?: string;
  minimumBalance?: number;
  interestAccrued?: number;
  lastInterestCalculationDate?: string;
  maturityDate?: string;
  autoRenew?: boolean;
  
  // Audit fields
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Loan model for tracking loan applications and management
 */
export interface Loan extends BaseModel {
  memberId: string;
  loanType: 'emergency' | 'development' | 'education' | 'business' | 'other';
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  outstandingBalance: number;
  applicationDate: string;
  approvalDate?: string;
  disbursementDate?: string;
  status: 'pending' | 'approved' | 'disbursed' | 'active' | 'completed' | 'defaulted' | 'rejected';
  guarantors: string[];
  purpose: string;
  
  // Backend-specific fields
  loanProductId?: string;
  loanNumber?: string;
  collateralDescription?: string;
  collateralValue?: number;
  collateralDocuments?: string[];
  approvedBy?: string;
  rejectionReason?: string;
  disbursedBy?: string;
  nextPaymentDate?: string;
  nextPaymentAmount?: number;
  totalInterestPayable?: number;
  totalAmountPayable?: number;
  paidPrincipal?: number;
  paidInterest?: number;
  remainingPrincipal?: number;
  remainingInterest?: number;
  latePaymentFeeRate?: number;
  paymentSchedule?: LoanPaymentSchedule[];
  
  // Risk assessment
  riskRating?: 'low' | 'medium' | 'high';
  creditScore?: number;
  
  // Audit fields
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Loan payment schedule item
 */
export interface LoanPaymentSchedule {
  id: string;
  loanId: string;
  paymentNumber: number;
  dueDate: string;
  totalAmount: number;
  principalAmount: number;
  interestAmount: number;
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  paidAmount?: number;
  paidDate?: string;
  transactionId?: string;
}

/**
 * Transaction model for all financial movements
 */
export interface Transaction extends BaseModel {
  memberId: string;
  accountId?: string;
  loanId?: string;
  type: 'deposit' | 'withdrawal' | 'loan_payment' | 'fine' | 'checkoff' | 'transfer' | 'interest' | 'fee';
  amount: number;
  description: string;
  date: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  reference: string;
  channel: 'cash' | 'bank' | 'mobile_money' | 'checkoff' | 'internal';
  
  // Mobile money specific fields
  mobileMoneyProvider?: 'mtn' | 'airtel';
  
  // Backend-specific fields
  transactionCode?: string;
  receiptNumber?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  reversalReason?: string;
  reversalTransactionId?: string;
  relatedTransactionId?: string;
  processingFee?: number;
  
  // Bank transfer details
  bankName?: string;
  accountNumber?: string;
  chequeNumber?: string;
  
  // Audit fields
  processedBy?: string;
  approvedBy?: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Fine model for penalties
 */
export interface Fine extends BaseModel {
  memberId: string;
  category: 'late_payment' | 'meeting_absence' | 'policy_violation' | 'other';
  amount: number;
  description: string;
  dateIssued: string;
  datePaid?: string;
  status: 'pending' | 'paid' | 'waived';
  
  // Backend-specific fields
  transactionId?: string;
  waivedReason?: string;
  waivedBy?: string;
  policyReference?: string;
  dueDate?: string;
  
  // Audit fields
  issuedBy?: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Investment model for SACCO investments
 */
export interface Investment extends BaseModel {
  name: string;
  type: 'fixed_deposit' | 'government_bonds' | 'treasury_bills' | 'real_estate' | 'equity' | 'other';
  amount: number;
  interestRate: number;
  maturityDate: string;
  currentValue: number;
  status: 'active' | 'matured' | 'sold';
  purchaseDate: string;
  
  // Backend-specific fields
  investmentNumber?: string;
  institutionName?: string;
  institutionContact?: string;
  documentReferences?: string[];
  interestPaymentSchedule?: 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'maturity';
  lastInterestPaymentDate?: string;
  nextInterestPaymentDate?: string;
  interestEarned?: number;
  interestPaid?: number;
  saleValue?: number;
  saleDate?: string;
  profitLoss?: number;
  
  // Audit fields
  approvedBy?: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Communication model for member notifications
 */
export interface Communication extends BaseModel {
  title: string;
  message: string;
  type: 'sms' | 'email' | 'push';
  recipients: string[];
  scheduledDate: string;
  sentDate?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  
  // Backend-specific fields
  templateId?: string;
  messageVariables?: Record<string, string>;
  deliveryReports?: CommunicationDeliveryReport[];
  failureReason?: string;
  retryCount?: number;
  maxRetries?: number;
  
  // Audit fields
  createdBy?: string;
  updatedBy?: string;
  sentBy?: string;
}

/**
 * Communication delivery report
 */
export interface CommunicationDeliveryReport {
  id: string;
  communicationId: string;
  recipientId: string;
  recipientContact: string;
  status: 'delivered' | 'failed' | 'pending';
  deliveredAt?: string;
  failureReason?: string;
  retryCount?: number;
  externalReference?: string;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalMembers: number;
  activeLoans: number;
  totalDeposits: number;
  monthlyGrowth: number;
  pendingApplications: number;
  totalInvestments: number;
  
  // Backend-specific fields
  activeMembersPercentage?: number;
  inactiveMembersCount?: number;
  maleToFemaleRatio?: number;
  averageSavingsPerMember?: number;
  averageLoanAmount?: number;
  loanToDepositRatio?: number;
  defaultRate?: number;
  liquidityRatio?: number;
  operatingExpenses?: number;
  netIncome?: number;
  returnOnAssets?: number;
  returnOnEquity?: number;
  capitalAdequacyRatio?: number;
}

/**
 * Member onboarding application
 */
export interface MemberOnboarding extends BaseModel {
  userId?: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    phoneNumber: string;
    email: string;
    address: string;
    idNumber: string;
  };
  financialInfo: {
    monthlyIncome: number;
    employerName?: string;
    employmentStatus: 'employed' | 'self_employed' | 'unemployed';
  };
  idDocuments: {
    nationalIdFront?: string;
    nationalIdBack?: string;
    passportPhoto?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  approvedBy?: string;
  
  // Backend-specific fields
  rejectionReason?: string;
  rejectedBy?: string;
  applicationNumber?: string;
  verificationNotes?: string;
  membershipFeeStatus?: 'pending' | 'paid' | 'waived';
  membershipFeeAmount?: number;
  membershipFeeTransactionId?: string;
  nextOfKin?: {
    name: string;
    relationship: string;
    phoneNumber: string;
    address?: string;
  }[];
  
  // Audit fields
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Deposit record
 */
export interface Deposit extends BaseModel {
  memberId: string;
  category: 'savings' | 'fixed' | 'special';
  amount: number;
  date: string;
  receiptNumber: string;
  channel: 'cash' | 'bank' | 'mobile_money';
  reference?: string;
  
  // Backend-specific fields
  accountId?: string;
  transactionId?: string;
  notes?: string;
  
  // Audit fields
  receivedBy?: string;
  verifiedBy?: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Payroll check-off record
 */
export interface Checkoff extends BaseModel {
  memberId: string;
  employerId: string;
  period: string;
  amount: number;
  postedAt: string;
  status: 'pending' | 'processed' | 'failed';
  
  // Backend-specific fields
  batchId?: string;
  transactionId?: string;
  accountId?: string;
  failureReason?: string;
  employeeId?: string;
  deductionType?: 'savings' | 'loan_repayment' | 'both';
  loanId?: string;
  savingsAmount?: number;
  loanAmount?: number;
  
  // Audit fields
  processedBy?: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Loan product definition
 */
export interface LoanProduct extends BaseModel {
  name: string;
  loanType: 'emergency' | 'development' | 'education' | 'business' | 'other';
  maxAmount: number;
  minAmount: number;
  interestRate: number;
  termMonths: number;
  eligibilityRules: string;
  collateralRequired: boolean;
  createdAt: string;
  status: 'active' | 'inactive';
  
  // Backend-specific fields
  processingFeePercentage?: number;
  processingFeeFixed?: number;
  latePaymentFeePercentage?: number;
  latePaymentFeeFixed?: number;
  gracePeriodDays?: number;
  repaymentFrequency?: 'weekly' | 'biweekly' | 'monthly';
  interestType?: 'flat' | 'reducing_balance';
  minCreditScore?: number;
  minMembershipDuration?: number; // in months
  guarantorsRequired?: number;
  earlyRepaymentFeePercentage?: number;
  
  // Audit fields
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Mobile wallet
 */
export interface MobileWallet extends BaseModel {
  memberId: string;
  provider: 'mtn' | 'airtel';
  phoneNumber: string;
  balance: number;
  status: 'active' | 'suspended' | 'closed';
  createdAt: string;
  updatedAt: string;
  
  // Backend-specific fields
  walletNumber?: string;
  lastTransactionDate?: string;
  dailyTransactionLimit?: number;
  monthlyTransactionLimit?: number;
  pinHash?: string;
  pinSalt?: string;
  failedPinAttempts?: number;
  lockedUntil?: Date;
  
  // Audit fields
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Mobile money transaction
 */
export interface MobileMoneyTransaction extends Transaction {
  provider: 'mtn' | 'airtel';
  phoneNumber: string;
  fees: number;
  
  // Backend-specific fields
  externalTransactionId?: string;
  providerStatus?: string;
  providerStatusCode?: string;
  providerTimestamp?: string;
  callbackData?: Record<string, any>;
  callbackReceived?: boolean;
  callbackTimestamp?: string;
}

/**
 * Report metadata
 */
export interface Report extends BaseModel {
  type:
    | 'financial_statement'
    | 'trial_balance'
    | 'membership'
    | 'loans'
    | 'deposits'
    | 'custom';
  parameters: Record<string, unknown>;
  generatedAt: string;
  generatedBy: string;
  url: string;
  
  // Backend-specific fields
  name?: string;
  description?: string;
  format?: 'pdf' | 'excel' | 'csv';
  fileSize?: number;
  filePath?: string;
  accessCount?: number;
  lastAccessedAt?: string;
  expiresAt?: string;
  isScheduled?: boolean;
  scheduleFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  nextScheduledAt?: string;
  
  // Audit fields
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Member statement
 */
export interface Statement extends BaseModel {
  memberId: string;
  periodFrom: string;
  periodTo: string;
  generatedAt: string;
  url: string;
  
  // Backend-specific fields
  statementNumber?: string;
  format?: 'pdf' | 'excel' | 'csv';
  fileSize?: number;
  filePath?: string;
  openingBalance?: number;
  closingBalance?: number;
  totalDeposits?: number;
  totalWithdrawals?: number;
  totalLoanDisbursements?: number;
  totalLoanRepayments?: number;
  
  // Audit fields
  generatedBy?: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Employer record
 */
export interface Employer extends BaseModel {
  name: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  address: string;
  payrollSchedule: 'monthly' | 'biweekly';
  
  // Backend-specific fields
  registrationNumber?: string;
  industry?: string;
  employeeCount?: number;
  website?: string;
  logoUrl?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  contractDocumentUrl?: string;
  checkoffAgreementSigned?: boolean;
  bankName?: string;
  bankAccountNumber?: string;
  bankBranchCode?: string;
  
  // Audit fields
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Ledger entry
 */
export interface LedgerEntry extends BaseModel {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  reference?: string;
  
  // Backend-specific fields
  accountCode?: string;
  taxAmount?: number;
  taxRate?: number;
  receiptUrl?: string;
  budgetLineId?: string;
  paymentMethod?: 'cash' | 'bank' | 'mobile_money';
  paymentReference?: string;
  vendorId?: string;
  vendorName?: string;
  
  // Audit fields
  recordedBy?: string;
  approvedBy?: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * SACCO bank account
 */
export interface BankAccount extends BaseModel {
  bankName: string;
  accountNumber: string;
  branch: string;
  balance: number;
  lastReconciledAt?: string;
  status: 'active' | 'closed';
  
  // Backend-specific fields
  accountName?: string;
  accountType?: 'current' | 'savings' | 'fixed';
  currency?: string;
  swiftCode?: string;
  routingNumber?: string;
  signatories?: string[];
  minimumBalance?: number;
  interestRate?: number;
  interestPaymentFrequency?: 'monthly' | 'quarterly' | 'annual';
  statementDay?: number;
  lastStatementDate?: string;
  
  // Audit fields
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Staff record extending User
 */
export interface Staff extends User {
  staffId: string;
  position: string;
  department: string;
  supervisor?: string;
  employmentDate: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'volunteer';
  salary?: number;
  permissions?: string[];
  lastPerformanceReview?: string;
  performanceRating?: number;
}

/**
 * Audit log
 */
export interface AuditLog extends BaseModel {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * System settings
 */
export interface SystemSettings {
  id: string;
  settingName: string;
  settingValue: string;
  settingGroup: string;
  description?: string;
  dataType: 'string' | 'number' | 'boolean' | 'json';
  isEncrypted: boolean;
  updatedAt: string;
  updatedBy: string;
}

/**
 * Document
 */
export interface Document extends BaseModel {
  documentType: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  entityType: string;
  entityId: string;
  uploadedBy: string;
  status: 'pending' | 'verified' | 'rejected';
  
  // Backend-specific fields
  originalFileName?: string;
  fileHash?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  expiryDate?: string;
  isPublic?: boolean;
  accessUrl?: string;
  
  // Audit fields
  createdBy?: string;
  updatedBy?: string;
}
