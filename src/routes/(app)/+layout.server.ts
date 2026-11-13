import { redirect } from '@sveltejs/kit';
import { getSiteNotice } from '#lib/server/settings';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
  if (!locals.user) throw redirect(303, '/login');
  return { user: locals.user, now: Date.now(), notice: getSiteNotice() };
};
