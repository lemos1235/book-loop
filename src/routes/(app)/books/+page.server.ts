import { fail } from '@sveltejs/kit';
import { createBook, deleteBook, listBooks, toggleBookStatus, updateBook } from '#lib/server/books';
import { toUserMessage } from '#lib/server/errors';
import { readEnum, readKeyword, readPaging } from '#lib/server/params';
import { parseBookForm, parseId } from '#lib/server/validation';
import type { Actions, PageServerLoad } from './$types';

const BOOK_STATUSES = ['all', 'active', 'archived'] as const;

export const load: PageServerLoad = ({ url }) => {
  const query = {
    q: readKeyword(url),
    category: (url.searchParams.get('category') ?? '').slice(0, 20),
    status: readEnum(url, 'status', BOOK_STATUSES, 'all'),
    ...readPaging(url),
  };
  const result = listBooks(query);
  return {
    query: { ...query, page: result.page, pageSize: result.pageSize },
    ...result,
  };
};

export const actions: Actions = {
  create: async ({ request }) => {
    try {
      createBook(parseBookForm(await request.formData()));
      return { ok: true, message: '图书已添加' };
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },

  update: async ({ request }) => {
    try {
      const formData = await request.formData();
      const id = parseId(formData);
      updateBook(id, parseBookForm(formData));
      return { ok: true, message: '图书信息已更新' };
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },

  toggle: async ({ request }) => {
    try {
      const id = parseId(await request.formData());
      toggleBookStatus(id);
      return { ok: true, message: '图书状态已更新' };
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },

  delete: async ({ request }) => {
    try {
      const id = parseId(await request.formData());
      deleteBook(id);
      return { ok: true, message: '图书已删除' };
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },
};
