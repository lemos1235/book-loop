import { z } from 'zod';
import { BusinessError } from './errors';

const text = (max: number) => z.string().trim().max(max, `最多 ${max} 个字符`);

const optionalYear = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.coerce
    .number()
    .int('出版年份必须是整数')
    .min(0, '出版年份不合法')
    .max(2100, '出版年份不合法')
    .optional(),
);

export const bookSchema = z.object({
  title: z.string().trim().min(1, '请填写书名').max(80, '书名最多 80 个字符'),
  author: z.string().trim().min(1, '请填写作者').max(60, '作者最多 60 个字符'),
  isbn: text(32),
  category: text(20).transform((value) => value || '未分类'),
  publisher: text(60),
  publishedYear: optionalYear,
  totalCopies: z.coerce
    .number()
    .int('馆藏册数必须是整数')
    .min(1, '馆藏册数至少为 1')
    .max(9999, '馆藏册数过大'),
  shelf: text(30),
  note: text(300),
});

export type BookInput = z.infer<typeof bookSchema>;

export const memberSchema = z.object({
  memberNo: text(20),
  name: z.string().trim().min(1, '请填写读者姓名').max(40, '姓名最多 40 个字符'),
  phone: text(20).refine(
    (value) => !value || /^[0-9+\-\s()]{6,20}$/.test(value),
    '手机号格式不正确',
  ),
  email: text(80).refine(
    (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    '邮箱格式不正确',
  ),
  note: text(300),
});

export type MemberInput = z.infer<typeof memberSchema>;

export const loanSchema = z.object({
  bookId: z.coerce.number().int().positive('请选择图书'),
  memberId: z.coerce.number().int().positive('请选择读者'),
  dueAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '请选择应还日期'),
  note: text(300),
});

export type LoanInput = z.infer<typeof loanSchema>;

function formObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') result[key] = value;
  }
  return result;
}

function parseWith<T>(schema: z.ZodType<T>, formData: FormData): T {
  return schema.parse(formObject(formData));
}

export function parseBookForm(formData: FormData): BookInput {
  return parseWith(bookSchema, formData);
}

export function parseMemberForm(formData: FormData): MemberInput {
  return parseWith(memberSchema, formData);
}

export function parseLoanForm(formData: FormData): LoanInput {
  return parseWith(loanSchema, formData);
}

export function parseId(formData: FormData): number {
  const id = Number(formData.get('id'));
  if (!Number.isInteger(id) || id <= 0) throw new BusinessError('参数错误，请刷新页面后重试');
  return id;
}
