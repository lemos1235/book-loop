import { error } from '@sveltejs/kit';
import { listLoansByMember } from '#lib/server/loans';
import { getMember } from '#lib/server/members';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) throw error(404, '读者不存在');

  const member = getMember(id);
  if (!member) throw error(404, '读者不存在');

  return {
    member,
    loans: listLoansByMember(id, 50),
    now: Date.now(),
  };
};
