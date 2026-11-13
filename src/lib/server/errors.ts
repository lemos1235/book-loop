import { ZodError } from 'zod';

/** 可预期的业务错误，消息会直接展示给用户 */
export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

export function isUniqueConstraintError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === 'SQLITE_CONSTRAINT_UNIQUE' || code === 'SQLITE_CONSTRAINT_PRIMARYKEY';
}

/** 把任意异常转换为可展示的提示；未知异常打日志后返回兜底文案 */
export function toUserMessage(error: unknown): string {
  if (error instanceof BusinessError) return error.message;
  if (error instanceof ZodError) return error.issues[0]?.message ?? '提交的数据不合法';
  console.error(error);
  return '操作失败，请稍后重试';
}
