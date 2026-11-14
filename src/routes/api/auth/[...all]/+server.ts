import { auth } from '#lib/server/auth';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * Better Auth 兜底路由：
 * hooks.server.ts 的 svelteKitHandler 只在请求 origin 与 baseURL 一致时接管
 * /api/auth/*；origin 不一致（如 ORIGIN 配错端口）时会落到这里，仍由 Better Auth 处理。
 */
const handler: RequestHandler = ({ request }) => auth.handler(request);

export const GET = handler;
export const POST = handler;
