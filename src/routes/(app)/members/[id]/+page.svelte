<script lang="ts">
  import {
    ArrowLeft,
    BookOpen,
    CalendarDays,
    CircleUserRound,
    ClipboardList,
    History,
    Mail,
    Phone,
  } from '@lucide/svelte';
  import { buttonVariants } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import StatusBadge from '#lib/components/StatusBadge.svelte';
  import { formatDate } from '#lib/format';
  import {
    LOAN_STATUS_LABEL,
    LOAN_STATUS_TONE,
    MEMBER_STATUS_LABEL,
    MEMBER_STATUS_TONE,
  } from '#lib/status';

  let { data } = $props();

  const activeLoans = $derived(data.loans.filter((loan) => loan.status !== 'returned'));
  const historyLoans = $derived(data.loans.filter((loan) => loan.status === 'returned'));
  const initial = $derived((data.member.name.trim()[0] ?? '读').toUpperCase());

  type LoanRow = (typeof data.loans)[number];
</script>

{#snippet loanRow(loan: LoanRow)}
  <div class="flex items-start justify-between gap-3 py-2.5">
    <div class="min-w-0">
      <p class="truncate text-xs font-medium text-foreground">{loan.bookTitle}</p>
      <p class="mt-0.5 truncate text-[11px] text-muted-foreground">{loan.bookAuthor}</p>
      <p class="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
        借出 {formatDate(loan.borrowedAt)} · 应还 {formatDate(loan.dueAt)}
        {#if loan.returnedAt}
          · 归还 {formatDate(loan.returnedAt)}
        {/if}
      </p>
      {#if loan.renewCount > 0}
        <p class="mt-0.5 text-[10px] text-muted-foreground">已续借 {loan.renewCount} 次</p>
      {/if}
    </div>
    <StatusBadge label={LOAN_STATUS_LABEL[loan.status]} tone={LOAN_STATUS_TONE[loan.status]} />
  </div>
{/snippet}

<svelte:head>
  <title>{data.member.name} · 读者详情 · 书循 BookLoop</title>
</svelte:head>

<div class="space-y-5">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <a
      href="/members"
      class="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
      <ArrowLeft class="size-3.5" />
      返回读者列表
    </a>
    <a
      href="/audit?targetType=member&targetId={data.member.id}"
      class={buttonVariants({ variant: 'outline', size: 'sm' })}>
      <ClipboardList class="size-4" />
      操作记录
    </a>
  </div>

  <!-- 基本信息 -->
  <Card class="gap-0">
    <CardContent>
      <div class="flex flex-wrap items-start gap-4">
        <span
          class="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-semibold text-secondary-foreground ring-1 ring-brand-200/70">
          {initial}
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-xl font-semibold text-foreground">{data.member.name}</h2>
            <StatusBadge
              label={MEMBER_STATUS_LABEL[data.member.status]}
              tone={MEMBER_STATUS_TONE[data.member.status]} />
          </div>
          <p class="mt-1 font-mono text-xs text-muted-foreground">{data.member.memberNo}</p>

          <div class="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            <span class="flex items-center gap-1.5">
              <Phone class="size-3.5" />
              {data.member.phone || '未填写手机号'}
            </span>
            <span class="flex items-center gap-1.5">
              <Mail class="size-3.5" />
              {data.member.email || '未填写邮箱'}
            </span>
            <span class="flex items-center gap-1.5">
              <CalendarDays class="size-3.5" />
              加入于 {formatDate(data.member.joinedAt)}
            </span>
            <span class="flex items-center gap-1.5">
              <BookOpen class="size-3.5" />
              当前在借 {data.member.activeLoans} 册
            </span>
          </div>

          {#if data.member.note}
            <p class="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs leading-5 text-foreground/75">
              {data.member.note}
            </p>
          {/if}
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- 借阅记录 -->
  <Card class="gap-0">
    <CardHeader>
      <CardTitle class="flex items-center gap-2 text-base">
        <History class="size-4 text-primary" />
        借阅记录
      </CardTitle>
      <p class="text-xs text-muted-foreground">
        最近 50 条 · 在借 {activeLoans.length} 条 · 历史 {historyLoans.length} 条
      </p>
    </CardHeader>
    <CardContent>
      {#if data.loans.length === 0}
        <div class="flex flex-col items-center gap-2 py-8 text-center">
          <CircleUserRound class="size-6 text-muted-foreground/50" />
          <p class="text-sm text-muted-foreground">该读者还没有借阅记录</p>
        </div>
      {:else}
        {#if activeLoans.length > 0}
          <p class="mb-2 text-[11px] font-medium text-muted-foreground">当前在借</p>
          <div class="mb-4 divide-y rounded-lg border px-3">
            {#each activeLoans as loan (loan.id)}
              {@render loanRow(loan)}
            {/each}
          </div>
        {/if}

        {#if historyLoans.length > 0}
          <p class="mb-2 text-[11px] font-medium text-muted-foreground">历史借阅</p>
          <div class="divide-y rounded-lg border px-3">
            {#each historyLoans as loan (loan.id)}
              {@render loanRow(loan)}
            {/each}
          </div>
        {/if}
      {/if}
    </CardContent>
  </Card>
</div>
