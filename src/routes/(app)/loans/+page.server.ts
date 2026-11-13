import { fail } from '@sveltejs/kit';
import { getActor } from '#lib/server/actor';
import { listBookOptions } from '#lib/server/books';
import { toUserMessage } from '#lib/server/errors';
import { addDays, formatDate, toDateInputValue } from '#lib/format';
import { getLoanRules } from '#lib/server/settings';
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
  const rules = getLoanRules();
  return {
    query: { ...query, page: result.page, pageSize: result.pageSize },
    ...result,
    counts: getLoanCounts(),
    bookOptions: listBookOptions(),
    memberOptions: listMemberOptions(),
    rules,
    defaultDueDate: toDateInputValue(addDays(new Date(), rules.defaultLoanDays)),
    now: Date.now(),
  };
};

export const actions: Actions = {
  create: async (event) => {
    const actor = getActor(event);
    try {
      const loan = createLoan(actor, parseLoanForm(await event.request.formData()));
      return {
        ok: true,
        message: `《${loan.bookTitle}》借阅登记成功，应还日期 ${formatDate(loan.dueAt)}`,
      };
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },

  return: async (event) => {
    const actor = getActor(event);
    try {
      const loan = returnLoan(actor, parseId(await event.request.formData()));
      return { ok: true, message: `《${loan.bookTitle}》已归还` };
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },

  renew: async (event) => {
    const actor = getActor(event);
    try {
      const loan = renewLoan(actor, parseId(await event.request.formData()));
      return { ok: true, message: renewResultMessage(loan, getLoanRules().renewDays) };
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },
};
