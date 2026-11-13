<script lang="ts">
  import { enhance } from '$app/forms';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Select from '$lib/components/ui/select';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { enhanceWithNotification } from '#lib/enhance';
  import type { BookOption, MemberOption } from '#lib/types';

  let {
    open = $bindable(false),
    bookOptions = [],
    memberOptions = [],
    defaultDueDate = '',
  }: {
    open?: boolean;
    bookOptions?: BookOption[];
    memberOptions?: MemberOption[];
    defaultDueDate?: string;
  } = $props();

  let bookId = $state<string | undefined>(undefined);
  let memberId = $state<string | undefined>(undefined);
  let dueAt = $state('');
  let note = $state('');

  $effect(() => {
    if (!open) return;
    bookId = undefined;
    memberId = undefined;
    dueAt = defaultDueDate;
    note = '';
  });

  const handleSubmit = enhanceWithNotification(() => {
    open = false;
  });

  const labelClass = 'mb-1.5 text-xs text-muted-foreground';
  const availableBooks = $derived(bookOptions.filter((book) => book.availableCopies > 0));
  const bookItems = $derived(
    bookOptions.map((book) => ({
      value: String(book.id),
      label: `${book.title} · ${book.author}（可借 ${book.availableCopies} 册）`,
      disabled: book.availableCopies === 0,
    })),
  );
  const memberItems = $derived(
    memberOptions.map((option) => ({
      value: String(option.id),
      label: `${option.name}（${option.memberNo}）`,
    })),
  );
  const canSubmit = $derived(availableBooks.length > 0 && memberOptions.length > 0);
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-[580px]">
    <Dialog.Header class="border-b px-6 py-5 pr-12">
      <Dialog.Title>登记借阅</Dialog.Title>
      <Dialog.Description class="text-xs text-muted-foreground">
        选择图书与读者并设置应还日期，借出后库存会自动扣减。
      </Dialog.Description>
    </Dialog.Header>

    <form
      method="POST"
      action="?/create"
      use:enhance={handleSubmit}
      class="flex min-h-0 flex-1 flex-col">
      <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div class="space-y-4">
          {#if availableBooks.length === 0}
            <p
              class="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700">
              当前没有可借图书。请先在「图书管理」中新增图书或等待读者归还。
            </p>
          {/if}
          {#if memberOptions.length === 0}
            <p
              class="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700">
              当前没有状态正常的读者。请先在「读者管理」中登记读者。
            </p>
          {/if}

          <div>
            <Label class={labelClass}>
              图书 <span class="text-destructive">*</span>
            </Label>
            <Select.Root type="single" name="bookId" bind:value={bookId} items={bookItems} required>
              <Select.Trigger class="w-full">
                <Select.Value placeholder="请选择图书" />
              </Select.Trigger>
              <Select.Content>
                {#each bookOptions as book (book.id)}
                  <Select.Item
                    value={String(book.id)}
                    label={`${book.title} · ${book.author}（可借 ${book.availableCopies} 册）`}
                    disabled={book.availableCopies === 0}>
                    《{book.title}》· {book.author}（可借 {book.availableCopies} 册）
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>

          <div>
            <Label class={labelClass}>
              读者 <span class="text-destructive">*</span>
            </Label>
            <Select.Root
              type="single"
              name="memberId"
              bind:value={memberId}
              items={memberItems}
              required>
              <Select.Trigger class="w-full">
                <Select.Value placeholder="请选择读者" />
              </Select.Trigger>
              <Select.Content>
                {#each memberOptions as option (option.id)}
                  <Select.Item
                    value={String(option.id)}
                    label={`${option.name}（${option.memberNo}）`}>
                    {option.name}（{option.memberNo}）
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>

          <div>
            <Label for="loan-due" class={labelClass}>
              应还日期 <span class="text-destructive">*</span>
            </Label>
            <Input id="loan-due" name="dueAt" type="date" bind:value={dueAt} required />
            <p class="mt-1 text-[11px] text-muted-foreground">
              默认借期 30 天，到期前可续借 2 次。
            </p>
          </div>

          <div>
            <Label for="loan-note" class={labelClass}>备注</Label>
            <Textarea
              id="loan-note"
              name="note"
              bind:value={note}
              maxlength={300}
              rows={2}
              placeholder="选填，例如代借人、特殊说明" />
          </div>
        </div>
      </div>

      <Dialog.Footer class="border-t bg-muted/30 px-6 py-4">
        <Button type="button" variant="outline" onclick={() => (open = false)}>取消</Button>
        <Button type="submit" disabled={!canSubmit}>确认借出</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
