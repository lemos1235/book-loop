import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
  return new Response('User-agent: *\nDisallow: /\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
