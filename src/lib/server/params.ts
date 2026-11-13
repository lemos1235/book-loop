export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export interface PagingQuery {
  page: number;
  pageSize: number;
}

/** 从 URL 读取分页参数，非法值回落到第一页 / 默认条数 */
export function readPaging(url: URL, defaultPageSize = 10): PagingQuery {
  const page = Number(url.searchParams.get('page') ?? 1);
  const pageSize = Number(url.searchParams.get('pageSize') ?? defaultPageSize);
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: (PAGE_SIZE_OPTIONS as readonly number[]).includes(pageSize)
      ? pageSize
      : defaultPageSize,
  };
}

/** 读取带白名单的枚举参数 */
export function readEnum<T extends string>(
  url: URL,
  key: string,
  values: readonly T[],
  fallback: T,
): T {
  const value = url.searchParams.get(key);
  return values.includes(value as T) ? (value as T) : fallback;
}

/** 裁剪搜索词长度并去掉 LIKE 通配符，避免用户输入影响匹配语义 */
export function readKeyword(url: URL, maxLength = 50): string {
  return (url.searchParams.get('q') ?? '')
    .trim()
    .slice(0, maxLength)
    .replace(/[%_\\]/g, '');
}
