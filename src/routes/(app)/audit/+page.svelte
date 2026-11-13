<script lang="ts">
  import { goto } from '$app/navigation';
  import { page as pageState } from '$app/state';
  import { untrack } from 'svelte';
  import { ScrollText, X } from '@lucide/svelte';
  import { Card } from '$lib/components/ui/card';
  import * as Select from '$lib/components/ui/select';
  import DataTable, { type DataTableColumn } from '#lib/components/DataTable.svelte';
  import Pagination from '#lib/components/Pagination.svelte';
  import {
    ACTION_LABELS,
    auditTargetText,
    describeAuditChange,
    type AuditLogView,
  } from '#lib/audit';
  import { formatDateTime } from '#lib/format';

  let { data } = $props();

  const columns: DataTableColumn<AuditLogView>[] = [
    { key: 'createdAt', header: '时间', width: '150px' },
    { key: 'actor', header: '操作者', minWidth: '180px', class: 'hidden lg:table-cell' },
    { key: 'action', header: '动作', width: '110px' },
    { key: 'target', header: '对象', width: '110px' },
    { key: 'change', header: '变更内容', minWidth: '260px' },
  ];

  let actionFilter = $state<string>(untrack(() => data.query.action ?? 'all'));

  $effect.pre(() => {
    actionFilter = data.query.action ?? 'all';
  });

  const actionOptions = $derived([
    { value: 'all', label: '全部动作' },
    ...data.actions.map((value) => ({ value, label: ACTION_LABELS[value] ?? value })),
  ]);

  const targetFilter = $derived(
    data.query.targetId && data.query.targetType
      ? { targetType: data.query.targetType, targetId: data.query.targetId }
      : null,
  );

  function navigate(changes: Record<string, string | number | null>) {
    const params = new URLSearchParams(pageState.url.searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') params.delete(key);
      else params.set(key, String(value));
    }
    if (!('page' in changes)) params.delete('page');
    const search = params.toString();
    goto(`/audit${search ? `?${search}` : ''}`, { keepFocus: true });
  }
</script>

<svelte:head>
  <title>审计日志 · 书循 BookLoop</title>
</svelte:head>

<div class="space-y-5">
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h2 class="text-xl font-semibold text-foreground">审计日志</h2>
      <p class="mt-1 text-xs text-muted-foreground">
        共 {data.total} 条记录 · 只增不改，记录所有写操作的操作者与变更内容
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      {#if targetFilter}
        <span
          class="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
          {auditTargetText(targetFilter)}
          <button
            type="button"
            aria-label="清除对象筛选"
            class="cursor-pointer rounded-full p-0.5 transition-colors hover:bg-black/5"
            onclick={() => navigate({ targetType: null, targetId: null })}>
            <X class="size-3" />
          </button>
        </span>
      {/if}
      <Select.Root
        type="single"
        value={actionFilter}
        items={actionOptions}
        onValueChange={(value) => navigate({ action: value === 'all' ? null : value })}>
        <Select.Trigger class="h-8 min-w-36 text-xs">
          <Select.Value placeholder="全部动作" />
        </Select.Trigger>
        <Select.Content>
          {#each actionOptions as option (option.value)}
            <Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
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
      emptyMessage="暂无审计记录">
      {#snippet empty()}
        <div class="flex flex-col items-center gap-2 py-2">
          <ScrollText class="size-6 text-muted-foreground/50" />
          <p class="text-sm">暂无审计记录</p>
        </div>
      {/snippet}

      {#snippet cell({ row, column })}
        {#if column.key === 'createdAt'}
          <span class="whitespace-nowrap text-muted-foreground tabular-nums">
            {formatDateTime(row.createdAt)}
          </span>
        {:else if column.key === 'actor'}
          <div class="max-w-44 truncate">{row.userEmail}</div>
          {#if row.ip}
            <div class="text-[10px] text-muted-foreground">{row.ip}</div>
          {/if}
        {:else if column.key === 'action'}
          <span class="whitespace-nowrap">{ACTION_LABELS[row.action] ?? row.action}</span>
        {:else if column.key === 'target'}
          {#if row.targetType === 'setting'}
            <a href="/settings" class="text-primary hover:underline">{auditTargetText(row)}</a>
          {:else if row.targetType === 'member'}
            <a href="/members/{row.targetId}" class="text-primary hover:underline">
              {auditTargetText(row)}
            </a>
          {:else}
            <span class="whitespace-nowrap">{auditTargetText(row)}</span>
          {/if}
        {:else if column.key === 'change'}
          <div class="flex flex-col gap-0.5 text-foreground/75">
            {#each describeAuditChange(row) as line, index (index)}
              <span>{line}</span>
            {:else}
              <span class="text-muted-foreground">无字段变化</span>
            {/each}
          </div>
        {/if}
      {/snippet}
    </DataTable>
  </div>

  <!-- 移动端卡片列表 -->
  <div class="space-y-3 md:hidden">
    {#each data.rows as row (row.id)}
      <Card class="gap-0 rounded-xl p-4 shadow-xs">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-medium text-foreground">
              {ACTION_LABELS[row.action] ?? row.action}
            </p>
            <p class="mt-0.5 text-[11px] text-muted-foreground">{auditTargetText(row)}</p>
          </div>
          <span class="shrink-0 text-[11px] text-muted-foreground">
            {formatDateTime(row.createdAt)}
          </span>
        </div>

        <div
          class="mt-2 space-y-0.5 rounded-lg bg-muted/50 px-3 py-2 text-[11px] text-foreground/80">
          {#each describeAuditChange(row) as line, index (index)}
            <p>{line}</p>
          {:else}
            <p class="text-muted-foreground">无字段变化</p>
          {/each}
        </div>

        <p class="mt-2 border-t pt-2 text-[10px] text-muted-foreground">
          {row.userEmail}{row.ip ? ` · ${row.ip}` : ''}
        </p>
      </Card>
    {/each}

    {#if data.rows.length === 0}
      <Card class="items-center gap-2 rounded-xl p-8 text-center shadow-xs">
        <ScrollText class="size-6 text-muted-foreground/50" />
        <p class="text-sm text-muted-foreground">暂无审计记录</p>
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
