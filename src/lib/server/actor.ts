import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/** 写操作的操作者，用于审计日志 */
export interface Actor {
  userId: number;
  email: string;
  ip: string | null;
}

/**
 * 从表单 action 的 event 中取得操作者；未登录直接拒绝。
 * form action 不经过 (app) layout 的 load，写操作需要在这里自行校验。
 */
export function getActor(event: Pick<RequestEvent, 'locals' | 'getClientAddress'>): Actor {
  const user = event.locals.user;
  if (!user) throw error(401, '登录已失效，请重新登录');

  let ip: string | null = null;
  try {
    ip = event.getClientAddress();
  } catch {
    // 部分适配器或测试环境无法获取客户端地址，审计中允许为空
  }

  return { userId: Number(user.id), email: user.email.toLowerCase(), ip };
}
