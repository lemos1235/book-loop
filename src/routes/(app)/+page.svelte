<script lang="ts">
  import { ArrowRight, CalendarDays, CheckCircle2, Library, TrendingUp } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Card } from '$lib/components/ui/card';
  import DataTable, { type DataTableColumn } from '#lib/components/DataTable.svelte';
  import StatCard from '#lib/components/StatCard.svelte';
  import StatusBadge from '#lib/components/StatusBadge.svelte';
  import { formatDate, overdueDays } from '#lib/format';
  import { LOAN_STATUS_LABEL, LOAN_STATUS_TONE } from '#lib/status';
  import type { LoanView } from '#lib/types';

  let { data } = $props();

  const columns: DataTableColumn<LoanView>[] = [
    { key: 'bookTitle', header: '图书', minWidth: '150px' },
    { key: 'memberName', header: '读者', minWidth: '110px', class: 'hidden sm:table-cell' },
    { key: 'dueAt', header: '应还日期', width: '100px' },
    { key: 'status', header: '状态', width: '90px' },
  ];

  const maxTrend = $derived(
    Math.max(1, ...data.trend.flatMap((point) => [point.borrowed, point.returned])),
  );
  const maxCategory = $derived(Math.max(1, ...data.categories.map((item) => item.copies)));
  const availableRate = $derived(
    data.stats.copies > 0 ? Math.round((data.stats.available / data.stats.copies) * 100) : 0,
  );
</script>

<svelte:head>
  <title>工作台 · 书循 BookLoop</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h2 class="text-xl font-semibold text-foreground">工作台</h2>
      <p class="mt-1 text-xs text-muted-foreground">
        欢迎回来，{data.user.name || data.user.email}。这里是今天的馆藏与借阅概览。
      </p>
    </div>
    <Button variant="outline" size="sm" class="h-8 text-xs" href="/loans">
      查看借阅明细
      <ArrowRight class="size-3.5" />
    </Button>
  </div>

  <div class="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
    <StatCard label="馆藏总量" value={data.stats.copies}>
      {#snippet hint()}
        共 {data.stats.titles} 种图书 · 可借 {availableRate}%
      {/snippet}
    </StatCard>

    <StatCard label="在借图书" value={data.stats.activeLoans}>
      {#snippet hint()}
        当前可借 {data.stats.available} 册
      {/snippet}
    </StatCard>

    <StatCard label="逾期未还" value={data.stats.overdueLoans} danger={data.stats.overdueLoans > 0}>
      {#snippet hint()}
        {data.stats.overdueLoans > 0 ? '请及时联系读者归还' : '暂无逾期记录'}
      {/snippet}
    </StatCard>

    <StatCard label="注册读者" value={data.stats.members}>
      {#snippet hint()}
        今日借出 {data.stats.todayBorrowed} 册 · 归还 {data.stats.todayReturned} 册
      {/snippet}
    </StatCard>
  </div>

  <div class="grid gap-4 lg:grid-cols-5">
    <!-- 近 7 日借还趋势 -->
    <Card class="gap-4 rounded-xl p-5 lg:col-span-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 class="text-sm font-semibold text-foreground">近 7 日借还趋势</h3>
          <p class="mt-0.5 text-xs text-muted-foreground">按自然日统计借出与归还册数</p>
        </div>
        <div class="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span class="inline-flex items-center gap-1.5">
            <span class="size-2 rounded-sm bg-chart-1"></span>
            借出
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="size-2 rounded-sm bg-chart-2"></span>
            归还
          </span>
        </div>
      </div>

      <div class="mt-6 flex h-40 items-end gap-2 sm:gap-4">
        {#each data.trend as point (point.key)}
          <div class="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div class="flex h-32 w-full items-end justify-center gap-1">
              <div
                class="group relative w-2.5 rounded-t-sm bg-chart-1 transition-all hover:bg-chart-1/80 sm:w-3"
                style="height: {Math.max(3, (point.borrowed / maxTrend) * 100)}%">
                <span
                  class="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 text-[10px] whitespace-nowrap text-background group-hover:block">
                  借出 {point.borrowed}
                </span>
              </div>
              <div
                class="group relative w-2.5 rounded-t-sm bg-chart-2 transition-all hover:bg-chart-2/80 sm:w-3"
                style="height: {Math.max(3, (point.returned / maxTrend) * 100)}%">
                <span
                  class="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 text-[10px] whitespace-nowrap text-background group-hover:block">
                  归还 {point.returned}
                </span>
              </div>
            </div>
            <div class="text-center">
              <p class="text-[10px] text-muted-foreground">{point.weekday}</p>
              <p class="text-[10px] font-medium text-muted-foreground tabular-nums">
                {point.label}
              </p>
            </div>
          </div>
        {/each}
      </div>
    </Card>

    <!-- 馆藏分类 -->
    <Card class="gap-4 rounded-xl p-5 lg:col-span-2">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-semibold text-foreground">馆藏分类</h3>
          <p class="mt-0.5 text-xs text-muted-foreground">按册数统计的前 5 个分类</p>
        </div>
        <TrendingUp class="size-4 text-muted-foreground/50" />
      </div>

      {#if data.categories.length === 0}
        <div class="flex h-40 flex-col items-center justify-center text-xs text-muted-foreground">
          <Library class="mb-2 size-5 text-muted-foreground/50" />
          暂无馆藏数据
        </div>
      {:else}
        <ul class="mt-2 space-y-3.5">
          {#each data.categories as category (category.name)}
            <li>
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-foreground/80">{category.name}</span>
                <span class="text-muted-foreground tabular-nums">{category.copies} 册</span>
              </div>
              <div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full bg-primary/60"
                  style="width: {Math.max(4, (category.copies / maxCategory) * 100)}%">
                </div>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </Card>
  </div>

  <div class="grid gap-4 lg:grid-cols-5">
    <!-- 最近借阅 -->
    <section class="lg:col-span-3">
      <div class="mb-3 flex items-center justify-between">
        <div>
          <h3 class="text-sm font-semibold text-foreground">最近借阅</h3>
          <p class="mt-0.5 text-xs text-muted-foreground">最新的借出与归还动态</p>
        </div>
        <Button variant="link" size="sm" class="h-auto p-0 text-xs" href="/loans">全部记录</Button>
      </div>

      <DataTable {columns} rows={data.recent} emptyMessage="还没有借阅记录">
        {#snippet cell({ row, column })}
          {#if column.key === 'bookTitle'}
            <div class="max-w-56">
              <p class="truncate font-medium text-foreground">{row.bookTitle}</p>
              <p class="truncate text-[11px] text-muted-foreground">{row.bookAuthor}</p>
            </div>
          {:else if column.key === 'memberName'}
            <div>
              <p class="truncate text-foreground/90">{row.memberName}</p>
              <p class="text-[11px] text-muted-foreground">{row.memberNo}</p>
            </div>
          {:else if column.key === 'dueAt'}
            <span
              class="tabular-nums {row.status === 'overdue'
                ? 'text-red-600'
                : 'text-muted-foreground'}">
              {formatDate(row.dueAt)}
            </span>
          {:else if column.key === 'status'}
            <StatusBadge
              label={LOAN_STATUS_LABEL[row.status]}
              tone={LOAN_STATUS_TONE[row.status]} />
          {/if}
        {/snippet}
      </DataTable>
    </section>

    <!-- 逾期提醒 -->
    <Card class="gap-4 rounded-xl p-5 lg:col-span-2">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-semibold text-foreground">逾期提醒</h3>
          <p class="mt-0.5 text-xs text-muted-foreground">需要尽快跟进归还的图书</p>
        </div>
        <Button variant="link" size="sm" class="h-auto p-0 text-xs" href="/loans?status=overdue">
          处理
        </Button>
      </div>

      {#if data.overdue.length === 0}
        <div class="flex h-48 flex-col items-center justify-center text-center">
          <span
            class="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
            <CheckCircle2 class="size-5" />
          </span>
          <p class="mt-3 text-xs font-medium text-foreground/80">全部按时归还</p>
          <p class="mt-1 text-[11px] text-muted-foreground">当前没有逾期未还的图书</p>
        </div>
      {:else}
        <ul class="mt-2 divide-y">
          {#each data.overdue as item (item.id)}
            <li class="flex items-start justify-between gap-3 py-3 first:pt-0">
              <div class="min-w-0">
                <p class="truncate text-xs font-medium text-foreground">{item.bookTitle}</p>
                <p class="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {item.memberName} · {item.memberNo}
                </p>
                <p class="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <CalendarDays class="size-3" />
                  应还 {formatDate(item.dueAt)}
                </p>
              </div>
              <Badge
                variant="outline"
                class="shrink-0 border-red-600/15 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                逾期 {overdueDays(item.dueAt, data.now)} 天
              </Badge>
            </li>
          {/each}
        </ul>
      {/if}
    </Card>
  </div>
</div>
