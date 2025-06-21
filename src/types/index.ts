export interface User {
  id: string;
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
}

export interface Account {
  id: string;
  memberId: string;
  accountType: 'savings' | 'fixed' | 'special';
  balance: number;
  interestRate: number;
  openingDate: string;
  lastTransactionDate: string;
  status: 'active' | 'dormant' | 'closed';
}

export interface Loan {
  id: string;
  memberId: string;
  loanType: 'emergency' | 'development' | 'education' | 'business';
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  outstandingBalance: number;
  applicationDate: string;
  approvalDate?: string;
  disbursementDate?: string;
  status: 'pending' | 'approved' | 'disbursed' | 'active' | 'completed' | 'defaulted';
  guarantors: string[];
  purpose: string;
}

export interface Transaction {
  id: string;
  memberId: string;
  accountId?: string;
  loanId?: string;
  type: 'deposit' | 'withdrawal' | 'loan_payment' | 'fine' | 'checkoff' | 'transfer';
  amount: number;
  description: string;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  channel: 'cash' | 'bank' | 'mobile_money' | 'checkoff';
  /**
   * For mobile-money channels capture the provider explicitly.
   * Undefined for non-mobile-money channels.
   */
  mobileMoneyProvider?: 'mtn' | 'airtel';
}

export interface Fine {
  id: string;
  memberId: string;
  category: 'late_payment' | 'meeting_absence' | 'policy_violation' | 'other';
  amount: number;
  description: string;
  dateIssued: string;
  datePaid?: string;
  status: 'pending' | 'paid' | 'waived';
}

export interface Investment {
  id: string;
  name: string;
  type: 'fixed_deposit' | 'government_bonds' | 'treasury_bills' | 'real_estate' | 'equity';
  amount: number;
  interestRate: number;
  maturityDate: string;
  currentValue: number;
  status: 'active' | 'matured' | 'sold';
  purchaseDate: string;
}

export interface Communication {
  id: string;
  title: string;
  message: string;
  type: 'sms' | 'email' | 'push';
  recipients: string[];
  scheduledDate: string;
  sentDate?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
}

export interface DashboardStats {
  totalMembers: number;
  activeLoans: number;
  totalDeposits: number;
  monthlyGrowth: number;
  pendingApplications: number;
  totalInvestments: number;
}

/* ------------------------------------------------------------------
 *  UG-SACCO Extended Domain Models
 * ----------------------------------------------------------------*/

/**
 * Captures the full onboarding / approval lifecycle for a prospective member.
 */
export interface MemberOnboarding {
  id: string;
  /** User record created for the prospect (optional until approved) */
  userId?: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    phoneNumber: string;
    email: string;
    address: string;
    idNumber: string; // National ID / Passport
  };
  financialInfo: {
    monthlyIncome: number; // UGX
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
  approvedBy?: string; // userId of staff
}

/**
 * A single deposit transaction grouped for reporting
 */
export interface Deposit {
  id: string;
  memberId: string;
  category: 'savings' | 'fixed' | 'special';
  amount: number; // UGX
  date: string;
  receiptNumber: string;
  channel: 'cash' | 'bank' | 'mobile_money';
  reference?: string;
}

/**
 * Payroll check-off record posted from an employer
 */
export interface Checkoff {
  id: string;
  memberId: string;
  employerId: string;
  period: string; // e.g. '2025-06'
  amount: number; // UGX
  postedAt: string;
  status: 'pending' | 'processed' | 'failed';
}

/**
 * Master definition for a loan product configured by the SACCO.
 */
export interface LoanProduct {
  id: string;
  name: string;
  loanType: 'emergency' | 'development' | 'education' | 'business' | 'other';
  maxAmount: number; // UGX
  minAmount: number; // UGX
  interestRate: number; // Annual percentage
  termMonths: number;
  eligibilityRules: string; // markdown / rich text
  collateralRequired: boolean;
  createdAt: string;
  status: 'active' | 'inactive';
}

/**
 * Member e-wallet linked to MTN MoMo or Airtel Money
 */
export interface MobileWallet {
  id: string;
  memberId: string;
  provider: 'mtn' | 'airtel';
  phoneNumber: string;
  balance: number; // UGX
  status: 'active' | 'suspended' | 'closed';
  createdAt: string;
  updatedAt: string;
}

/**
 * Specific shape for mobile money transactions (extends core Transaction).
 */
export interface MobileMoneyTransaction extends Transaction {
  provider: 'mtn' | 'airtel';
  phoneNumber: string;
  fees: number; // UGX
}

/**
 * Generated report metadata
 */
export interface Report {
  id: string;
  type:
    | 'financial_statement'
    | 'trial_balance'
    | 'membership'
    | 'loans'
    | 'deposits'
    | 'custom';
  parameters: Record<string, unknown>;
  generatedAt: string;
  generatedBy: string; // userId
  url: string; // Download link (PDF/Excel)
}

/**
 * Member account / loan statement
 */
export interface Statement {
  id: string;
  memberId: string;
  periodFrom: string;
  periodTo: string;
  generatedAt: string;
  url: string;
}

/**
 * Employer record for payroll integration
 */
export interface Employer {
  id: string;
  name: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  address: string;
  payrollSchedule: 'monthly' | 'biweekly';
}

/**
 * Ledger entry for income / expenses
 */
export interface LedgerEntry {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number; // UGX
  description: string;
  date: string;
  reference?: string;
}

/**
 * SACCO bank account for reconciliation
 */
export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  branch: string;
  balance: number; // UGX
  lastReconciledAt?: string;
  status: 'active' | 'closed';
}