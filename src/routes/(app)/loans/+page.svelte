<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page as pageState } from '$app/state';
  import { ArrowLeftRight, Plus, Search } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Card } from '$lib/components/ui/card';
  import DataTable, { type DataTableColumn } from '#lib/components/DataTable.svelte';
  import Pagination from '#lib/components/Pagination.svelte';
  import StatusBadge from '#lib/components/StatusBadge.svelte';
  import { enhanceWithNotification } from '#lib/enhance';
  import { formatDate, overdueDays } from '#lib/format';
  import { LOAN_STATUS_LABEL, LOAN_STATUS_TONE } from '#lib/status';
  import type { LoanView } from '#lib/types';
  import LoanDialog from './components/LoanDialog.svelte';

  let { data } = $props();

  const STATUS_TABS = [
    { value: 'all', label: '全部' },
    { value: 'borrowed', label: '在借' },
    { value: 'overdue', label: '逾期' },
    { value: 'returned', label: '已归还' },
  ] as const;

  const columns: DataTableColumn<LoanView>[] = [
    { key: 'bookTitle', header: '图书', minWidth: '200px' },
    { key: 'memberName', header: '读者', minWidth: '130px' },
    { key: 'borrowedAt', header: '借出日期', width: '105px', class: 'hidden lg:table-cell' },
    { key: 'dueAt', header: '应还日期', width: '105px' },
    { key: 'status', header: '状态', width: '120px' },
    { key: 'actions', header: '操作', width: '120px', align: 'right' },
  ];

  let keyword = $state('');
  let dialogOpen = $state(false);

  $effect(() => {
    keyword = data.query.q;
  });

  const submit = enhanceWithNotification();

  function navigate(changes: Record<string, string | number | null>) {
    const params = new URLSearchParams(pageState.url.searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') params.delete(key);
      else params.set(key, String(value));
    }
    if (!('page' in changes)) params.delete('page');
    const search = params.toString();
    goto(`/loans${search ? `?${search}` : ''}`, { keepFocus: true });
  }

  function submitSearch(event: SubmitEvent) {
    event.preventDefault();
    navigate({ q: keyword.trim() || null });
  }

  function tabCount(value: (typeof STATUS_TABS)[number]['value']): number {
    return data.counts[value];
  }
</script>

<svelte:head>
  <title>借阅管理 · 书循 BookLoop</title>
</svelte:head>

<div class="space-y-5">
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h2 class="text-xl font-semibold text-foreground">借阅管理</h2>
      <p class="mt-1 text-xs text-muted-foreground">
        当前在借 {data.counts.borrowed} 条 · 逾期 {data.counts.overdue} 条 · 历史记录 {data.counts
          .all} 条
      </p>
    </div>
    <Button size="sm" class="h-8 w-full px-3 text-xs sm:w-auto" onclick={() => (dialogOpen = true)}>
      <Plus class="size-4" />
      登记借阅
    </Button>
  </div>

  <div class="flex flex-wrap items-center gap-2">
    <div class="flex rounded-lg border bg-card p-0.5 shadow-xs">
      {#each STATUS_TABS as tab (tab.value)}
        {@const active = data.query.status === tab.value}
        <Button
          variant="ghost"
          size="sm"
          class="h-7 gap-1.5 rounded-md px-3 text-xs font-medium {active
            ? 'bg-brand-900 text-white hover:bg-brand-900 hover:text-white'
            : 'text-muted-foreground hover:text-foreground'}"
          onclick={() => navigate({ status: tab.value === 'all' ? null : tab.value })}>
          {tab.label}
          <span
            class="rounded-full px-1.5 py-px text-[10px] tabular-nums {active
              ? 'bg-white/20 text-white'
              : tab.value === 'overdue' && tabCount(tab.value) > 0
                ? 'bg-red-50 text-red-600'
                : 'bg-muted text-muted-foreground'}">
            {tabCount(tab.value)}
          </span>
        </Button>
      {/each}
    </div>

    <form onsubmit={submitSearch} class="relative w-full sm:max-w-sm sm:min-w-56 sm:flex-1">
      <Search
        size={14}
        class="pointer-events-none absolute top-1/2 left-2.5 z-10 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        bind:value={keyword}
        placeholder="搜索书名、读者、编号…"
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
      emptyMessage="暂无借阅记录">
      {#snippet empty()}
        <div class="flex flex-col items-center gap-2 py-2">
          <ArrowLeftRight class="size-6 text-muted-foreground/50" />
          <p class="text-sm text-muted-foreground">暂无借阅记录</p>
          <Button
            variant="link"
            size="sm"
            class="mt-1 h-auto p-0 text-xs"
            onclick={() => (dialogOpen = true)}>
            登记第一笔借阅
          </Button>
        </div>
      {/snippet}

      {#snippet cell({ row, column })}
        {#if column.key === 'bookTitle'}
          <div class="max-w-64">
            <p class="truncate font-medium text-foreground">{row.bookTitle}</p>
            <p class="truncate text-[11px] text-muted-foreground">{row.bookAuthor}</p>
          </div>
        {:else if column.key === 'memberName'}
          <div>
            <p class="truncate text-foreground/90">{row.memberName}</p>
            <p class="font-mono text-[11px] text-muted-foreground">{row.memberNo}</p>
          </div>
        {:else if column.key === 'borrowedAt'}
          <span class="text-muted-foreground tabular-nums">{formatDate(row.borrowedAt)}</span>
        {:else if column.key === 'dueAt'}
          <span
            class="tabular-nums {row.status === 'overdue'
              ? 'font-medium text-red-600'
              : 'text-muted-foreground'}">
            {formatDate(row.dueAt)}
          </span>
        {:else if column.key === 'status'}
          <div class="flex flex-col items-start gap-1">
            <StatusBadge
              label={LOAN_STATUS_LABEL[row.status]}
              tone={LOAN_STATUS_TONE[row.status]} />
            {#if row.status === 'overdue'}
              <span class="text-[10px] text-red-500">
                逾期 {overdueDays(row.dueAt, data.now)} 天
              </span>
            {:else if row.status === 'returned'}
              <span class="text-[10px] text-muted-foreground">
                归还于 {formatDate(row.returnedAt)}
              </span>
            {:else if row.renewCount > 0}
              <span class="text-[10px] text-muted-foreground">已续借 {row.renewCount} 次</span>
            {/if}
          </div>
        {:else if column.key === 'actions'}
          {#if row.status === 'returned'}
            <span class="text-muted-foreground/40">—</span>
          {:else}
            <div class="flex items-center justify-end gap-1">
              <form method="POST" action="?/return" use:enhance={submit} class="inline-flex">
                <input type="hidden" name="id" value={row.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  class="h-7 px-2 text-[11px] text-primary hover:text-primary">
                  归还
                </Button>
              </form>
              <form method="POST" action="?/renew" use:enhance={submit} class="inline-flex">
                <input type="hidden" name="id" value={row.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  class="h-7 px-2 text-[11px] text-muted-foreground"
                  disabled={row.status === 'overdue' || row.renewCount >= 2}
                  title={row.status === 'overdue'
                    ? '逾期记录不能续借'
                    : row.renewCount >= 2
                      ? '已达最大续借次数'
                      : '续借 14 天'}>
                  续借
                </Button>
              </form>
            </div>
          {/if}
        {/if}
      {/snippet}
    </DataTable>
  </div>

  <!-- 移动端卡片列表 -->
  <div class="space-y-3 md:hidden">
    {#each data.rows as loan (loan.id)}
      <Card class="gap-0 rounded-xl p-4 shadow-xs">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-foreground">{loan.bookTitle}</p>
            <p class="mt-0.5 truncate text-[11px] text-muted-foreground">{loan.bookAuthor}</p>
          </div>
          <StatusBadge
            label={LOAN_STATUS_LABEL[loan.status]}
            tone={LOAN_STATUS_TONE[loan.status]} />
        </div>

        <div class="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-muted/50 px-3 py-2 text-[11px]">
          <div>
            <p class="text-muted-foreground">读者</p>
            <p class="mt-0.5 truncate font-medium text-foreground">{loan.memberName}</p>
            <p class="truncate font-mono text-[10px] text-muted-foreground">{loan.memberNo}</p>
          </div>
          <div>
            <p class="text-muted-foreground">应还日期</p>
            <p
              class="mt-0.5 font-medium tabular-nums {loan.status === 'overdue'
                ? 'text-red-600'
                : 'text-foreground'}">
              {formatDate(loan.dueAt)}
            </p>
            {#if loan.status === 'overdue'}
              <p class="text-[10px] text-red-500">逾期 {overdueDays(loan.dueAt, data.now)} 天</p>
            {:else if loan.status === 'returned'}
              <p class="text-[10px] text-muted-foreground">归还于 {formatDate(loan.returnedAt)}</p>
            {:else if loan.renewCount > 0}
              <p class="text-[10px] text-muted-foreground">已续借 {loan.renewCount} 次</p>
            {/if}
          </div>
        </div>

        {#if loan.status !== 'returned'}
          <div class="mt-3 flex items-center justify-end gap-1 border-t pt-3">
            <form method="POST" action="?/return" use:enhance={submit} class="inline-flex">
              <input type="hidden" name="id" value={loan.id} />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                class="h-8 px-3 text-xs text-primary">
                归还
              </Button>
            </form>
            <form method="POST" action="?/renew" use:enhance={submit} class="inline-flex">
              <input type="hidden" name="id" value={loan.id} />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                class="h-8 px-3 text-xs text-muted-foreground"
                disabled={loan.status === 'overdue' || loan.renewCount >= 2}
                title={loan.status === 'overdue'
                  ? '逾期记录不能续借'
                  : loan.renewCount >= 2
                    ? '已达最大续借次数'
                    : '续借 14 天'}>
                续借
              </Button>
            </form>
          </div>
        {/if}
      </Card>
    {/each}

    {#if data.rows.length === 0}
      <Card class="items-center gap-2 rounded-xl p-8 text-center shadow-xs">
        <ArrowLeftRight class="size-6 text-muted-foreground/50" />
        <p class="text-sm text-muted-foreground">暂无借阅记录</p>
        <Button
          variant="link"
          size="sm"
          class="h-auto p-0 text-xs"
          onclick={() => (dialogOpen = true)}>
          登记第一笔借阅
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

<LoanDialog
  bind:open={dialogOpen}
  bookOptions={data.bookOptions}
  memberOptions={data.memberOptions}
  defaultDueDate={data.defaultDueDate} />
