import type { LoanStatus, StatusTone } from '#lib/types';

export const BOOK_STATUS_LABEL = {
  active: '在架',
  archived: '已下架',
} as const;

export const MEMBER_STATUS_LABEL = {
  active: '正常',
  suspended: '已停用',
} as const;

export const LOAN_STATUS_LABEL: Record<LoanStatus, string> = {
  borrowed: '在借',
  overdue: '已逾期',
  returned: '已归还',
};

export const BOOK_STATUS_TONE: Record<'active' | 'archived', StatusTone> = {
  active: 'success',
  archived: 'neutral',
};

export const MEMBER_STATUS_TONE: Record<'active' | 'suspended', StatusTone> = {
  active: 'success',
  suspended: 'danger',
};

export const LOAN_STATUS_TONE: Record<LoanStatus, StatusTone> = {
  borrowed: 'info',
  overdue: 'danger',
  returned: 'success',
};
