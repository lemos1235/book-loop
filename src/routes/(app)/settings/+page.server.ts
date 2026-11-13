import { fail } from '@sveltejs/kit';
import { getActor } from '#lib/server/actor';
import { toUserMessage } from '#lib/server/errors';
import { getSettingRecord, updateSetting, type SettingKey } from '#lib/server/settings';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
  loanRules: getSettingRecord('loan.rules'),
  announcement: getSettingRecord('announcement'),
  maintenance: getSettingRecord('maintenance'),
});

/** 空输入框提交 ''，而 Number('') 为 0，需单独返回 NaN 交给校验 */
const num = (form: FormData, name: string) => {
  const raw = String(form.get(name) ?? '').trim();
  return raw === '' ? Number.NaN : Number(raw);
};
const text = (form: FormData, name: string) => String(form.get(name) ?? '');
const flag = (form: FormData, name: string) => form.get(name) === 'on';

function save(actor: ReturnType<typeof getActor>, key: SettingKey, value: unknown) {
  const changed = updateSetting(actor, key, value);
  return { ok: true, message: changed ? '设置已保存' : '设置没有变化' };
}

export const actions: Actions = {
  loanRules: async (event) => {
    const actor = getActor(event);
    try {
      const form = await event.request.formData();
      return save(actor, 'loan.rules', {
        defaultLoanDays: num(form, 'defaultLoanDays'),
        maxRenewals: num(form, 'maxRenewals'),
        renewDays: num(form, 'renewDays'),
        blockOverdueBorrow: flag(form, 'blockOverdueBorrow'),
      });
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },

  announcement: async (event) => {
    const actor = getActor(event);
    try {
      const form = await event.request.formData();
      return save(actor, 'announcement', {
        enabled: flag(form, 'enabled'),
        level: text(form, 'level'),
        message: text(form, 'message'),
      });
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },

  maintenance: async (event) => {
    const actor = getActor(event);
    try {
      const form = await event.request.formData();
      return save(actor, 'maintenance', {
        enabled: flag(form, 'enabled'),
        message: text(form, 'message'),
      });
    } catch (error) {
      return fail(400, { error: toUserMessage(error) });
    }
  },
};
