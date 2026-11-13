<script lang="ts">
  import { enhance } from '$app/forms';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { enhanceWithNotification } from '#lib/enhance';
  import type { MemberView } from '#lib/types';

  let {
    open = $bindable(false),
    member = null,
  }: {
    open?: boolean;
    member?: MemberView | null;
  } = $props();

  let name = $state('');
  let memberNo = $state('');
  let phone = $state('');
  let email = $state('');
  let note = $state('');

  $effect(() => {
    if (!open) return;
    name = member?.name ?? '';
    memberNo = member?.memberNo ?? '';
    phone = member?.phone ?? '';
    email = member?.email ?? '';
    note = member?.note ?? '';
  });

  const handleSubmit = enhanceWithNotification(() => {
    open = false;
  });

  const labelClass = 'mb-1.5 text-xs text-muted-foreground';
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-[600px]">
    <Dialog.Header class="border-b px-6 py-5 pr-12">
      <Dialog.Title>{member ? '编辑读者' : '新增读者'}</Dialog.Title>
      <Dialog.Description class="text-xs text-muted-foreground">
        {member ? '修改读者的联系方式与备注。' : '登记一位新读者，编号留空时按年份自动生成。'}
      </Dialog.Description>
    </Dialog.Header>

    <form
      method="POST"
      action={member ? '?/update' : '?/create'}
      use:enhance={handleSubmit}
      class="flex min-h-0 flex-1 flex-col">
      <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {#if member}
          <input type="hidden" name="id" value={member.id} />
        {/if}

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <Label for="member-name" class={labelClass}>
              姓名 <span class="text-destructive">*</span>
            </Label>
            <Input
              id="member-name"
              name="name"
              bind:value={name}
              required
              maxlength={40}
              placeholder="例如：林晓" />
          </div>

          <div>
            <Label for="member-no" class={labelClass}>读者编号</Label>
            <Input
              id="member-no"
              name="memberNo"
              bind:value={memberNo}
              maxlength={20}
              placeholder="留空自动生成" />
          </div>

          <div>
            <Label for="member-phone" class={labelClass}>手机号</Label>
            <Input
              id="member-phone"
              name="phone"
              type="tel"
              bind:value={phone}
              maxlength={20}
              placeholder="138 0000 0000" />
          </div>

          <div>
            <Label for="member-email" class={labelClass}>邮箱</Label>
            <Input
              id="member-email"
              name="email"
              type="email"
              bind:value={email}
              maxlength={80}
              placeholder="reader@example.com" />
          </div>

          <div class="sm:col-span-2">
            <Label for="member-note" class={labelClass}>备注</Label>
            <Textarea
              id="member-note"
              name="note"
              bind:value={note}
              maxlength={300}
              rows={3}
              placeholder="会员等级、联系偏好等" />
          </div>
        </div>
      </div>

      <Dialog.Footer class="border-t bg-muted/30 px-6 py-4">
        <Button type="button" variant="outline" onclick={() => (open = false)}>取消</Button>
        <Button type="submit">保存</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
