import { fail } from '@sveltejs/kit';
import { getActor } from '#lib/server/actor';
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
  create: async (event) => {
    const actor = getActor(event);
    try {
      createBook(actor, parseBookForm(await event.request.formData()));
      return { ok: true, message: '图书已添加' };
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },

  update: async (event) => {
    const actor = getActor(event);
    try {
      const formData = await event.request.formData();
      const id = parseId(formData);
      updateBook(actor, id, parseBookForm(formData));
      return { ok: true, message: '图书信息已更新' };
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },

  toggle: async (event) => {
    const actor = getActor(event);
    try {
      const id = parseId(await event.request.formData());
      toggleBookStatus(actor, id);
      return { ok: true, message: '图书状态已更新' };
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },

  delete: async (event) => {
    const actor = getActor(event);
    try {
      const id = parseId(await event.request.formData());
      deleteBook(actor, id);
      return { ok: true, message: '图书已删除' };
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },
};
