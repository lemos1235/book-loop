import { isAuditTargetType } from '#lib/audit';
import { AUDIT_ACTIONS, isAuditAction, listAuditLogs } from '#lib/server/audit';
import { readPaging } from '#lib/server/params';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
  const rawAction = url.searchParams.get('action');
  const rawTargetType = url.searchParams.get('targetType');
  const rawTargetId = (url.searchParams.get('targetId') ?? '').trim().slice(0, 64);

  // 对象筛选必须同时提供类型与 ID，避免不同类型的同号记录混在一起
  const targetType = isAuditTargetType(rawTargetType) ? rawTargetType : null;
  const targetId = targetType && rawTargetId ? rawTargetId : null;

  const query = {
    action: isAuditAction(rawAction) ? rawAction : null,
    targetType,
    targetId,
    ...readPaging(url),
  };
  const result = listAuditLogs(query);
  return {
    query: { ...query, page: result.page, pageSize: query.pageSize },
    ...result,
    actions: AUDIT_ACTIONS,
  };
};
