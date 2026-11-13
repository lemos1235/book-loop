export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

export type LoanStatus = 'borrowed' | 'overdue' | 'returned';
export type BookStatusFilter = 'all' | 'active' | 'archived';
export type MemberStatusFilter = 'all' | 'active' | 'suspended';
export type LoanStatusFilter = 'all' | LoanStatus;

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type BookView = {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  category: string;
  publisher: string | null;
  publishedYear: number | null;
  totalCopies: number;
  availableCopies: number;
  shelf: string | null;
  status: 'active' | 'archived';
  note: string | null;
  createdAt: number;
  updatedAt: number;
};

export type MemberView = {
  id: number;
  memberNo: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: 'active' | 'suspended';
  joinedAt: number;
  note: string | null;
  activeLoans: number;
  createdAt: number;
  updatedAt: number;
};

export type LoanView = {
  id: number;
  bookId: number;
  bookTitle: string;
  bookAuthor: string;
  memberId: number;
  memberName: string;
  memberNo: string;
  borrowedAt: number;
  dueAt: number;
  returnedAt: number | null;
  renewCount: number;
  note: string | null;
  status: LoanStatus;
};

export interface BookOption {
  id: number;
  title: string;
  author: string;
  availableCopies: number;
}

export interface MemberOption {
  id: number;
  name: string;
  memberNo: string;
}

export interface LoanCounts {
  all: number;
  borrowed: number;
  overdue: number;
  returned: number;
}

export interface TrendPoint {
  key: string;
  label: string;
  weekday: string;
  borrowed: number;
  returned: number;
}

export interface CategoryStat {
  name: string;
  copies: number;
}

export interface DashboardStats {
  titles: number;
  copies: number;
  available: number;
  activeLoans: number;
  overdueLoans: number;
  members: number;
  todayBorrowed: number;
  todayReturned: number;
}

export interface DashboardData {
  stats: DashboardStats;
  trend: TrendPoint[];
  categories: CategoryStat[];
  recent: LoanView[];
  overdue: LoanView[];
  now: number;
}
