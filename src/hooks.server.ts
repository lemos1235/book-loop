import { building } from '$app/environment';
import { auth } from '#lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': "frame-ancestors 'self'",
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

/** 解析会话写入 locals，并把 /api/auth/* 交给 Better Auth 处理 */
const handleAuth: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({ headers: event.request.headers });
  if (session) {
    event.locals.user = session.user;
    event.locals.session = session.session;
  }
  return svelteKitHandler({ event, resolve, auth, building });
};

const handleSecurityHeaders: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  const headers = { ...SECURITY_HEADERS };
  if (event.url.protocol === 'https:') {
    headers['Strict-Transport-Security'] = 'max-age=31536000';
  }
  try {
    for (const [name, value] of Object.entries(headers)) {
      if (!response.headers.has(name)) response.headers.set(name, value);
    }
    return response;
  } catch {
    const copy = new Response(response.body, response);
    for (const [name, value] of Object.entries(headers)) {
      if (!copy.headers.has(name)) copy.headers.set(name, value);
    }
    return copy;
  }
};

export const handle = sequence(handleAuth, handleSecurityHeaders);
