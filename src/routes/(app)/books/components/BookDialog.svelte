<script lang="ts">
  import { enhance } from '$app/forms';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { enhanceWithNotification } from '#lib/enhance';
  import type { BookView } from '#lib/types';

  let {
    open = $bindable(false),
    book = null,
    categories = [],
  }: {
    open?: boolean;
    book?: BookView | null;
    categories?: string[];
  } = $props();

  let title = $state('');
  let author = $state('');
  let isbn = $state('');
  let category = $state('');
  let publisher = $state('');
  let publishedYear = $state<number | undefined>(undefined);
  let totalCopies = $state<number | undefined>(1);
  let shelf = $state('');
  let note = $state('');

  $effect(() => {
    if (!open) return;
    title = book?.title ?? '';
    author = book?.author ?? '';
    isbn = book?.isbn ?? '';
    category = book?.category ?? '';
    publisher = book?.publisher ?? '';
    publishedYear = book?.publishedYear ?? undefined;
    totalCopies = book?.totalCopies ?? 1;
    shelf = book?.shelf ?? '';
    note = book?.note ?? '';
  });

  const handleSubmit = enhanceWithNotification(() => {
    open = false;
  });

  const labelClass = 'mb-1.5 text-xs text-muted-foreground';
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-[700px]">
    <Dialog.Header class="border-b px-6 py-5 pr-12">
      <Dialog.Title>{book ? '编辑图书' : '新增图书'}</Dialog.Title>
      <Dialog.Description class="text-xs text-muted-foreground">
        {book
          ? '修改馆藏信息后保存，可借数量会按在借情况自动重算。'
          : '录入一本新书，可借数量默认等于馆藏册数。'}
      </Dialog.Description>
    </Dialog.Header>

    <form
      method="POST"
      action={book ? '?/update' : '?/create'}
      use:enhance={handleSubmit}
      class="flex min-h-0 flex-1 flex-col">
      <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {#if book}
          <input type="hidden" name="id" value={book.id} />
        {/if}

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <Label for="book-title" class={labelClass}>
              书名 <span class="text-destructive">*</span>
            </Label>
            <Input
              id="book-title"
              name="title"
              bind:value={title}
              required
              maxlength={80}
              placeholder="例如：活着" />
          </div>

          <div>
            <Label for="book-author" class={labelClass}>
              作者 <span class="text-destructive">*</span>
            </Label>
            <Input
              id="book-author"
              name="author"
              bind:value={author}
              required
              maxlength={60}
              placeholder="例如：余华" />
          </div>

          <div>
            <Label for="book-isbn" class={labelClass}>ISBN</Label>
            <Input
              id="book-isbn"
              name="isbn"
              bind:value={isbn}
              maxlength={32}
              placeholder="978-7-5063-6456-4" />
          </div>

          <div>
            <Label for="book-category" class={labelClass}>分类</Label>
            <Input
              id="book-category"
              name="category"
              bind:value={category}
              list="book-category-options"
              maxlength={20}
              placeholder="留空归入「未分类」" />
            <datalist id="book-category-options">
              {#each categories as option (option)}
                <option value={option}></option>
              {/each}
            </datalist>
          </div>

          <div>
            <Label for="book-publisher" class={labelClass}>出版社</Label>
            <Input
              id="book-publisher"
              name="publisher"
              bind:value={publisher}
              maxlength={60}
              placeholder="例如：作家出版社" />
          </div>

          <div>
            <Label for="book-year" class={labelClass}>出版年份</Label>
            <Input
              id="book-year"
              name="publishedYear"
              type="number"
              bind:value={publishedYear}
              min={0}
              max={2100}
              placeholder="2012" />
          </div>

          <div>
            <Label for="book-total" class={labelClass}>
              馆藏册数 <span class="text-destructive">*</span>
            </Label>
            <Input
              id="book-total"
              name="totalCopies"
              type="number"
              bind:value={totalCopies}
              min={1}
              max={9999}
              required />
          </div>

          <div>
            <Label for="book-shelf" class={labelClass}>书架位置</Label>
            <Input
              id="book-shelf"
              name="shelf"
              bind:value={shelf}
              maxlength={30}
              placeholder="例如：A-03-02" />
          </div>

          <div class="sm:col-span-2">
            <Label for="book-note" class={labelClass}>备注</Label>
            <Textarea
              id="book-note"
              name="note"
              bind:value={note}
              maxlength={300}
              rows={3}
              placeholder="馆藏状态、版本说明等" />
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
