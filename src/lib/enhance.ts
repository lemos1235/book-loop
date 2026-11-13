import type { SubmitFunction } from '@sveltejs/kit';
import { toast } from 'svelte-sonner';

export interface ActionResultData {
  ok?: boolean;
  message?: string;
  error?: string;
}

/**
 * 表单 action 的统一反馈：成功时展示 message 并刷新数据，失败时弹出错误提示。
 * onSuccess 在刷新前执行，用于关闭弹窗、清空选中项等。
 */
export function enhanceWithNotification(
  onSuccess?: (data: ActionResultData) => void,
): SubmitFunction {
  return () =>
    async ({ result, update }) => {
      if (result.type === 'failure') {
        const data = (result.data ?? {}) as ActionResultData;
        toast.error(data.error ?? '提交失败，请检查填写内容');
        return;
      }
      if (result.type === 'error') {
        toast.error(result.error.message ?? '操作失败，请稍后重试');
        return;
      }
      if (result.type === 'success') {
        const data = (result.data ?? {}) as ActionResultData;
        onSuccess?.(data);
        if (data.message) toast.success(data.message);
        await update();
        return;
      }
      await update();
    };
}
