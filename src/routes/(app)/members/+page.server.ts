import { fail } from '@sveltejs/kit';
import {
  createMember,
  deleteMember,
  listMembers,
  toggleMemberStatus,
  updateMember,
} from '#lib/server/members';
import { toUserMessage } from '#lib/server/errors';
import { readEnum, readKeyword, readPaging } from '#lib/server/params';
import { parseId, parseMemberForm } from '#lib/server/validation';
import type { Actions, PageServerLoad } from './$types';

const MEMBER_STATUSES = ['all', 'active', 'suspended'] as const;

export const load: PageServerLoad = ({ url }) => {
  const query = {
    q: readKeyword(url),
    status: readEnum(url, 'status', MEMBER_STATUSES, 'all'),
    ...readPaging(url),
  };
  const result = listMembers(query);
  return {
    query: { ...query, page: result.page, pageSize: result.pageSize },
    ...result,
  };
};

export const actions: Actions = {
  create: async ({ request }) => {
    try {
      createMember(parseMemberForm(await request.formData()));
      return { ok: true, message: '读者已添加' };
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },

  update: async ({ request }) => {
    try {
      const formData = await request.formData();
      const id = parseId(formData);
      updateMember(id, parseMemberForm(formData));
      return { ok: true, message: '读者信息已更新' };
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },

  toggle: async ({ request }) => {
    try {
      const id = parseId(await request.formData());
      toggleMemberStatus(id);
      return { ok: true, message: '读者状态已更新' };
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },

  delete: async ({ request }) => {
    try {
      const id = parseId(await request.formData());
      deleteMember(id);
      return { ok: true, message: '读者已删除' };
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },
};
