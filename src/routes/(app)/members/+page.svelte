<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page as pageState } from '$app/state';
  import { Pencil, Plus, Search, Trash2, UserRoundCheck, UserRoundX, Users } from '@lucide/svelte';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Card } from '$lib/components/ui/card';
  import DataTable, { type DataTableColumn } from '#lib/components/DataTable.svelte';
  import Pagination from '#lib/components/Pagination.svelte';
  import StatusBadge from '#lib/components/StatusBadge.svelte';
  import { enhanceWithNotification } from '#lib/enhance';
  import { formatDate } from '#lib/format';
  import { MEMBER_STATUS_LABEL, MEMBER_STATUS_TONE } from '#lib/status';
  import type { MemberView } from '#lib/types';
  import MemberDialog from './components/MemberDialog.svelte';

  let { data } = $props();

  const STATUS_TABS = [
    { value: 'all', label: '全部' },
    { value: 'active', label: '正常' },
    { value: 'suspended', label: '已停用' },
  ] as const;

  const columns: DataTableColumn<MemberView>[] = [
    { key: 'member', header: '读者', minWidth: '180px' },
    { key: 'contact', header: '联系方式', minWidth: '150px', class: 'hidden md:table-cell' },
    {
      key: 'activeLoans',
      header: '在借',
      width: '90px',
      align: 'center',
      class: 'hidden sm:table-cell',
    },
    { key: 'status', header: '状态', width: '90px' },
    { key: 'joinedAt', header: '加入时间', width: '110px', class: 'hidden lg:table-cell' },
    { key: 'actions', header: '操作', width: '130px', align: 'right' },
  ];

  let keyword = $state('');
  let dialogOpen = $state(false);
  let editingMember = $state<MemberView | null>(null);
  let deleteOpen = $state(false);
  let deleteTarget = $state<MemberView | null>(null);
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
    goto(`/members${search ? `?${search}` : ''}`, { keepFocus: true });
  }

  function submitSearch(event: SubmitEvent) {
    event.preventDefault();
    navigate({ q: keyword.trim() || null });
  }

  function openCreate() {
    editingMember = null;
    dialogOpen = true;
  }

  function openEdit(member: MemberView) {
    editingMember = member;
    dialogOpen = true;
  }

  function askDelete(member: MemberView) {
    deleteTarget = member;
    deleteOpen = true;
  }
</script>

<svelte:head>
  <title>读者管理 · 书循 BookLoop</title>
</svelte:head>

<div class="space-y-5">
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h2 class="text-xl font-semibold text-foreground">读者管理</h2>
      <p class="mt-1 text-xs text-muted-foreground">
        共 {data.total} 位读者 · 可按姓名、编号、手机号或邮箱搜索
      </p>
    </div>
    <Button size="sm" class="h-8 w-full px-3 text-xs sm:w-auto" onclick={openCreate}>
      <Plus class="size-4" />
      新增读者
    </Button>
  </div>

  <div class="flex flex-wrap items-center gap-2">
    <div
      class="inline-flex items-center gap-0.5 rounded-xl border border-border/70 bg-card p-1 shadow-xs">
      {#each STATUS_TABS as tab (tab.value)}
        {@const active = data.query.status === tab.value}
        <Button
          variant="ghost"
          size="sm"
          class="h-7 rounded-md px-3 text-xs font-medium transition-colors {active
            ? 'bg-brand-100 text-brand-800 hover:bg-brand-100 hover:text-brand-800'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}"
          onclick={() => navigate({ status: tab.value === 'all' ? null : tab.value })}>
          {tab.label}
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
        placeholder="搜索姓名、编号、手机号…"
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
      emptyMessage="没有找到符合条件的读者">
      {#snippet empty()}
        <div class="flex flex-col items-center gap-2 py-2">
          <Users class="size-6 text-muted-foreground/50" />
          <p class="text-sm text-muted-foreground">没有找到符合条件的读者</p>
          <Button variant="link" size="sm" class="mt-1 h-auto p-0 text-xs" onclick={openCreate}>
            登记第一位读者
          </Button>
        </div>
      {/snippet}

      {#snippet cell({ row, column })}
        {#if column.key === 'member'}
          <div>
            <a
              href="/members/{row.id}"
              class="font-medium text-foreground transition-colors hover:text-primary hover:underline">
              {row.name}
            </a>
            <p class="mt-0.5 font-mono text-[11px] text-muted-foreground">{row.memberNo}</p>
          </div>
        {:else if column.key === 'contact'}
          <div class="space-y-0.5">
            <p class="text-muted-foreground">{row.phone || '—'}</p>
            {#if row.email}
              <p class="truncate text-[11px] text-muted-foreground">{row.email}</p>
            {/if}
          </div>
        {:else if column.key === 'activeLoans'}
          {#if row.activeLoans > 0}
            <span
              class="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 ring-1 ring-sky-600/10 ring-inset">
              {row.activeLoans} 本
            </span>
          {:else}
            <span class="text-muted-foreground/40">—</span>
          {/if}
        {:else if column.key === 'status'}
          <StatusBadge
            label={MEMBER_STATUS_LABEL[row.status]}
            tone={MEMBER_STATUS_TONE[row.status]} />
        {:else if column.key === 'joinedAt'}
          <span class="text-muted-foreground tabular-nums">{formatDate(row.joinedAt)}</span>
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
                title={row.status === 'active' ? '停用' : '启用'}
                aria-label={row.status === 'active' ? '停用' : '启用'}>
                {#if row.status === 'active'}
                  <UserRoundX class="size-4" />
                {:else}
                  <UserRoundCheck class="size-4" />
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
    {#each data.rows as member (member.id)}
      <Card class="gap-0 rounded-xl p-4 shadow-xs">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <a
              href="/members/{member.id}"
              class="block truncate text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline">
              {member.name}
            </a>
            <p class="mt-0.5 font-mono text-[11px] text-muted-foreground">{member.memberNo}</p>
          </div>
          <StatusBadge
            label={MEMBER_STATUS_LABEL[member.status]}
            tone={MEMBER_STATUS_TONE[member.status]} />
        </div>

        <div class="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-muted/50 px-3 py-2 text-[11px]">
          <div>
            <p class="text-muted-foreground">手机号</p>
            <p class="mt-0.5 truncate font-medium text-foreground">{member.phone || '—'}</p>
          </div>
          <div>
            <p class="text-muted-foreground">在借</p>
            <p class="mt-0.5 font-medium text-foreground">{member.activeLoans} 本</p>
          </div>
        </div>

        {#if member.email}
          <p class="mt-2 truncate text-[11px] text-muted-foreground">{member.email}</p>
        {/if}

        <div class="mt-3 flex items-center justify-end gap-1 border-t pt-3">
          <Button
            variant="ghost"
            size="icon-sm"
            class="size-8 text-muted-foreground"
            title="编辑"
            aria-label="编辑"
            onclick={() => openEdit(member)}>
            <Pencil class="size-4" />
          </Button>
          <form method="POST" action="?/toggle" use:enhance={submit} class="inline-flex">
            <input type="hidden" name="id" value={member.id} />
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              class="size-8 text-muted-foreground"
              title={member.status === 'active' ? '停用' : '启用'}
              aria-label={member.status === 'active' ? '停用' : '启用'}>
              {#if member.status === 'active'}
                <UserRoundX class="size-4" />
              {:else}
                <UserRoundCheck class="size-4" />
              {/if}
            </Button>
          </form>
          <Button
            variant="ghost"
            size="icon-sm"
            class="size-8 text-muted-foreground hover:bg-red-50 hover:text-red-600"
            title="删除"
            aria-label="删除"
            onclick={() => askDelete(member)}>
            <Trash2 class="size-4" />
          </Button>
        </div>
      </Card>
    {/each}

    {#if data.rows.length === 0}
      <Card class="items-center gap-2 rounded-xl p-8 text-center shadow-xs">
        <Users class="size-6 text-muted-foreground/50" />
        <p class="text-sm text-muted-foreground">没有找到符合条件的读者</p>
        <Button variant="link" size="sm" class="h-auto p-0 text-xs" onclick={openCreate}>
          登记第一位读者
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

<MemberDialog bind:open={dialogOpen} member={editingMember} />

<AlertDialog.Root bind:open={deleteOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>删除读者</AlertDialog.Title>
      <AlertDialog.Description>
        确定删除读者「{deleteTarget?.name ??
          ''}」吗？此操作不可恢复。已有借阅记录的读者不能删除，可改为停用。
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
