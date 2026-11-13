<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page as pageState } from '$app/state';
  import { Archive, ArchiveRestore, BookOpen, Pencil, Plus, Search, Trash2 } from '@lucide/svelte';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Select from '$lib/components/ui/select';
  import { Card } from '$lib/components/ui/card';
  import DataTable, { type DataTableColumn } from '#lib/components/DataTable.svelte';
  import Pagination from '#lib/components/Pagination.svelte';
  import StatusBadge from '#lib/components/StatusBadge.svelte';
  import { enhanceWithNotification } from '#lib/enhance';
  import { formatDate } from '#lib/format';
  import { BOOK_STATUS_LABEL, BOOK_STATUS_TONE } from '#lib/status';
  import type { BookView } from '#lib/types';
  import BookDialog from './components/BookDialog.svelte';

  let { data } = $props();

  const STATUS_TABS = [
    { value: 'all', label: '全部' },
    { value: 'active', label: '在架' },
    { value: 'archived', label: '已下架' },
  ] as const;

  const columns: DataTableColumn<BookView>[] = [
    { key: 'book', header: '图书', minWidth: '250px' },
    { key: 'category', header: '分类', width: '100px', class: 'hidden lg:table-cell' },
    { key: 'stock', header: '可借 / 馆藏', width: '110px', align: 'center' },
    { key: 'shelf', header: '书架', width: '100px', class: 'hidden lg:table-cell' },
    { key: 'status', header: '状态', width: '90px' },
    { key: 'createdAt', header: '录入时间', width: '110px', class: 'hidden xl:table-cell' },
    { key: 'actions', header: '操作', width: '130px', align: 'right' },
  ];

  let keyword = $state('');
  let dialogOpen = $state(false);
  let editingBook = $state<BookView | null>(null);
  let deleteOpen = $state(false);
  let deleteTarget = $state<BookView | null>(null);
  let deleteForm = $state<HTMLFormElement | null>(null);

  $effect(() => {
    keyword = data.query.q;
  });

  const submit = enhanceWithNotification();
  const deleteSubmit = enhanceWithNotification(() => {
    deleteOpen = false;
    deleteTarget = null;
  });

  function navigate(changes: Record<string, string | number | null>) {
    const params = new URLSearchParams(pageState.url.searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') params.delete(key);
      else params.set(key, String(value));
    }
    if (!('page' in changes)) params.delete('page');
    const search = params.toString();
    goto(`/books${search ? `?${search}` : ''}`, { keepFocus: true });
  }

  function submitSearch(event: SubmitEvent) {
    event.preventDefault();
    navigate({ q: keyword.trim() || null });
  }

  function openCreate() {
    editingBook = null;
    dialogOpen = true;
  }

  function openEdit(book: BookView) {
    editingBook = book;
    dialogOpen = true;
  }

  function askDelete(book: BookView) {
    deleteTarget = book;
    deleteOpen = true;
  }

  const categoryItems = $derived([
    { value: 'all', label: '全部分类' },
    ...data.categories.map((category) => ({ value: category, label: category })),
  ]);
</script>

<svelte:head>
  <title>图书管理 · 书循 BookLoop</title>
</svelte:head>

<div class="space-y-5">
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h2 class="text-xl font-semibold text-foreground">图书管理</h2>
      <p class="mt-1 text-xs text-muted-foreground">
        共 {data.total} 种图书 · 当前筛选下可按书名、作者、ISBN 或出版社搜索
      </p>
    </div>
    <Button size="sm" class="h-8 w-full px-3 text-xs sm:w-auto" onclick={openCreate}>
      <Plus class="size-4" />
      新增图书
    </Button>
  </div>

  <div class="flex flex-wrap items-center gap-2">
    <div class="flex rounded-lg border bg-card p-0.5 shadow-xs">
      {#each STATUS_TABS as tab (tab.value)}
        {@const active = data.query.status === tab.value}
        <Button
          variant="ghost"
          size="sm"
          class="h-7 rounded-md px-3 text-xs font-medium {active
            ? 'bg-brand-900 text-white hover:bg-brand-900 hover:text-white'
            : 'text-muted-foreground hover:text-foreground'}"
          onclick={() => navigate({ status: tab.value === 'all' ? null : tab.value })}>
          {tab.label}
        </Button>
      {/each}
    </div>

    <Select.Root
      type="single"
      value={data.query.category || 'all'}
      items={categoryItems}
      onValueChange={(value) => navigate({ category: value === 'all' ? null : String(value) })}>
      <Select.Trigger size="sm" class="h-8 w-40 text-xs">
        <Select.Value placeholder="全部分类" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="all" label="全部分类">全部分类</Select.Item>
        {#each data.categories as category (category)}
          <Select.Item value={category} label={category}>{category}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>

    <form onsubmit={submitSearch} class="relative w-full sm:max-w-sm sm:min-w-56 sm:flex-1">
      <Search
        size={14}
        class="pointer-events-none absolute top-1/2 left-2.5 z-10 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        bind:value={keyword}
        placeholder="搜索书名、作者、ISBN…"
        class="h-8 pl-8 text-xs" />
    </form>
  </div>

  <div class="hidden md:block">
    <DataTable
      {columns}
      rows={data.rows}
      totalItems={data.total}
      maxHeight="56vh"
      page={data.query.page}
      pageSize={data.query.pageSize}
      onPageChange={(page) => navigate({ page })}
      onPageSizeChange={(pageSize) => navigate({ pageSize })}
      emptyMessage="没有找到符合条件的图书">
      {#snippet empty()}
        <div class="flex flex-col items-center gap-2 py-2">
          <BookOpen class="size-6 text-muted-foreground/50" />
          <p class="text-sm text-muted-foreground">没有找到符合条件的图书</p>
          <Button variant="link" size="sm" class="mt-1 h-auto p-0 text-xs" onclick={openCreate}>
            新增第一本图书
          </Button>
        </div>
      {/snippet}

      {#snippet cell({ row, column })}
        {#if column.key === 'book'}
          <div class="max-w-72">
            <p class="truncate font-medium text-foreground">{row.title}</p>
            <p class="mt-0.5 truncate text-[11px] text-muted-foreground">
              {row.author}
              {#if row.isbn}· ISBN {row.isbn}{/if}
              {#if row.publisher}· {row.publisher}{/if}
            </p>
          </div>
        {:else if column.key === 'category'}
          <span class="text-muted-foreground">{row.category}</span>
        {:else if column.key === 'stock'}
          <div class="flex flex-col items-center gap-0.5">
            <span
              class="text-sm font-semibold tabular-nums {row.availableCopies > 0
                ? 'text-emerald-600'
                : 'text-red-500'}">
              {row.availableCopies}
            </span>
            <span class="text-[10px] text-muted-foreground">/ {row.totalCopies} 册</span>
          </div>
        {:else if column.key === 'shelf'}
          <span class="text-muted-foreground">{row.shelf || '—'}</span>
        {:else if column.key === 'status'}
          <StatusBadge label={BOOK_STATUS_LABEL[row.status]} tone={BOOK_STATUS_TONE[row.status]} />
        {:else if column.key === 'createdAt'}
          <span class="text-muted-foreground tabular-nums">{formatDate(row.createdAt)}</span>
        {:else if column.key === 'actions'}
          <div class="flex items-center justify-end gap-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              class="size-7 text-muted-foreground"
              title="编辑"
              aria-label="编辑"
              onclick={() => openEdit(row)}>
              <Pencil class="size-4" />
            </Button>

            <form method="POST" action="?/toggle" use:enhance={submit} class="inline-flex">
              <input type="hidden" name="id" value={row.id} />
              <Button
                type="submit"
                variant="ghost"
                size="icon-sm"
                class="size-7 text-muted-foreground"
                title={row.status === 'active' ? '下架' : '重新上架'}
                aria-label={row.status === 'active' ? '下架' : '重新上架'}>
                {#if row.status === 'active'}
                  <Archive class="size-4" />
                {:else}
                  <ArchiveRestore class="size-4" />
                {/if}
              </Button>
            </form>

            <Button
              variant="ghost"
              size="icon-sm"
              class="size-7 text-muted-foreground hover:bg-red-50 hover:text-red-600"
              title="删除"
              aria-label="删除"
              onclick={() => askDelete(row)}>
              <Trash2 class="size-4" />
            </Button>
          </div>
        {/if}
      {/snippet}
    </DataTable>
  </div>

  <!-- 移动端卡片列表 -->
  <div class="space-y-3 md:hidden">
    {#each data.rows as book (book.id)}
      <Card class="gap-0 rounded-xl p-4 shadow-xs">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-foreground">{book.title}</p>
            <p class="mt-0.5 truncate text-xs text-muted-foreground">
              {book.author}
              {#if book.isbn}· {book.isbn}{/if}
            </p>
          </div>
          <StatusBadge
            label={BOOK_STATUS_LABEL[book.status]}
            tone={BOOK_STATUS_TONE[book.status]} />
        </div>

        <div class="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-muted/50 px-3 py-2 text-[11px]">
          <div>
            <p class="text-muted-foreground">分类</p>
            <p class="mt-0.5 truncate font-medium text-foreground">{book.category}</p>
          </div>
          <div>
            <p class="text-muted-foreground">可借</p>
            <p
              class="mt-0.5 font-medium tabular-nums {book.availableCopies > 0
                ? 'text-emerald-600'
                : 'text-red-500'}">
              {book.availableCopies} / {book.totalCopies}
            </p>
          </div>
          <div>
            <p class="text-muted-foreground">书架</p>
            <p class="mt-0.5 truncate font-medium text-foreground">{book.shelf || '—'}</p>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-end gap-1 border-t pt-3">
          <Button
            variant="ghost"
            size="icon-sm"
            class="size-8 text-muted-foreground"
            title="编辑"
            aria-label="编辑"
            onclick={() => openEdit(book)}>
            <Pencil class="size-4" />
          </Button>
          <form method="POST" action="?/toggle" use:enhance={submit} class="inline-flex">
            <input type="hidden" name="id" value={book.id} />
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              class="size-8 text-muted-foreground"
              title={book.status === 'active' ? '下架' : '重新上架'}
              aria-label={book.status === 'active' ? '下架' : '重新上架'}>
              {#if book.status === 'active'}
                <Archive class="size-4" />
              {:else}
                <ArchiveRestore class="size-4" />
              {/if}
            </Button>
          </form>
          <Button
            variant="ghost"
            size="icon-sm"
            class="size-8 text-muted-foreground hover:bg-red-50 hover:text-red-600"
            title="删除"
            aria-label="删除"
            onclick={() => askDelete(book)}>
            <Trash2 class="size-4" />
          </Button>
        </div>
      </Card>
    {/each}

    {#if data.rows.length === 0}
      <Card class="items-center gap-2 rounded-xl p-8 text-center shadow-xs">
        <BookOpen class="size-6 text-muted-foreground/50" />
        <p class="text-sm text-muted-foreground">没有找到符合条件的图书</p>
        <Button variant="link" size="sm" class="h-auto p-0 text-xs" onclick={openCreate}>
          新增第一本图书
        </Button>
      </Card>
    {/if}

    {#if data.total > 0}
      <Pagination
        totalItems={data.total}
        page={data.query.page}
        pageSize={data.query.pageSize}
        onPageChange={(page) => navigate({ page })}
        onPageSizeChange={(pageSize) => navigate({ pageSize })} />
    {/if}
  </div>
</div>

<BookDialog bind:open={dialogOpen} book={editingBook} categories={data.categories} />

<AlertDialog.Root bind:open={deleteOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>删除图书</AlertDialog.Title>
      <AlertDialog.Description>
        确定删除《{deleteTarget?.title ??
          ''}》吗？此操作不可恢复。已有借阅记录的图书不能删除，可改为下架。
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>取消</AlertDialog.Cancel>
      <AlertDialog.Action variant="destructive" onclick={() => deleteForm?.requestSubmit()}>
        删除
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<form
  bind:this={deleteForm}
  method="POST"
  action="?/delete"
  use:enhance={deleteSubmit}
  class="hidden">
  <input type="hidden" name="id" value={deleteTarget?.id ?? ''} />
</form>
