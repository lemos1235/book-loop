import { fail } from '@sveltejs/kit';
import { listBookOptions } from '#lib/server/books';
import { toUserMessage } from '#lib/server/errors';
import { addDays, formatDate, toDateInputValue } from '#lib/format';
import {
  createLoan,
  getLoanCounts,
  listLoans,
  renewLoan,
  renewResultMessage,
  returnLoan,
} from '#lib/server/loans';
import { listMemberOptions } from '#lib/server/members';
import { readEnum, readKeyword, readPaging } from '#lib/server/params';
import { parseId, parseLoanForm } from '#lib/server/validation';
import type { Actions, PageServerLoad } from './$types';

const LOAN_STATUSES = ['all', 'borrowed', 'overdue', 'returned'] as const;

export const load: PageServerLoad = ({ url }) => {
  const query = {
    q: readKeyword(url),
    status: readEnum(url, 'status', LOAN_STATUSES, 'all'),
    ...readPaging(url),
  };
  const result = listLoans(query);
  return {
    query: { ...query, page: result.page, pageSize: result.pageSize },
    ...result,
    counts: getLoanCounts(),
    bookOptions: listBookOptions(),
    memberOptions: listMemberOptions(),
    defaultDueDate: toDateInputValue(addDays(new Date(), 30)),
    now: Date.now(),
  };
};

export const actions: Actions = {
  create: async ({ request }) => {
    try {
      const loan = createLoan(parseLoanForm(await request.formData()));
      return {
        ok: true,
        message: `《${loan.bookTitle}》借阅登记成功，应还日期 ${formatDate(loan.dueAt)}`,
      };
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },

  return: async ({ request }) => {
    try {
      const loan = returnLoan(parseId(await request.formData()));
      return { ok: true, message: `《${loan.bookTitle}》已归还` };
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },

  renew: async ({ request }) => {
    try {
      const loan = renewLoan(parseId(await request.formData()));
      return { ok: true, message: renewResultMessage(loan) };
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },
};
