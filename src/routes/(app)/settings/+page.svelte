<script lang="ts">
  import { BookMarked, Info, Megaphone, Save, TriangleAlert, Wrench } from '@lucide/svelte';
  import { enhance } from '$app/forms';
  import { untrack } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import { Textarea } from '$lib/components/ui/textarea';
  import Switch from '#lib/components/Switch.svelte';
  import { enhanceWithNotification } from '#lib/enhance';
  import { formatDateTime } from '#lib/format';

  let { data } = $props();

  let defaultLoanDays = $state(untrack(() => data.loanRules.value.defaultLoanDays));
  let maxRenewals = $state(untrack(() => data.loanRules.value.maxRenewals));
  let renewDays = $state(untrack(() => data.loanRules.value.renewDays));
  let blockOverdueBorrow = $state(untrack(() => data.loanRules.value.blockOverdueBorrow));

  let announcementEnabled = $state(untrack(() => data.announcement.value.enabled));
  let announcementLevel = $state<'info' | 'warning'>(untrack(() => data.announcement.value.level));
  let announcementMessage = $state(untrack(() => data.announcement.value.message));

  let maintenanceEnabled = $state(untrack(() => data.maintenance.value.enabled));
  let maintenanceMessage = $state(untrack(() => data.maintenance.value.message));

  // 保存任一表单后刷新 data，只同步对应分区，不影响其他分区的未保存草稿
  $effect.pre(() => {
    defaultLoanDays = data.loanRules.value.defaultLoanDays;
  });
  $effect.pre(() => {
    maxRenewals = data.loanRules.value.maxRenewals;
  });
  $effect.pre(() => {
    renewDays = data.loanRules.value.renewDays;
  });
  $effect.pre(() => {
    blockOverdueBorrow = data.loanRules.value.blockOverdueBorrow;
  });
  $effect.pre(() => {
    announcementEnabled = data.announcement.value.enabled;
  });
  $effect.pre(() => {
    announcementLevel = data.announcement.value.level;
  });
  $effect.pre(() => {
    announcementMessage = data.announcement.value.message;
  });
  $effect.pre(() => {
    maintenanceEnabled = data.maintenance.value.enabled;
  });
  $effect.pre(() => {
    maintenanceMessage = data.maintenance.value.message;
  });

  const submit = enhanceWithNotification();

  const levelItems = [
    { value: 'info', label: '信息（蓝色）' },
    { value: 'warning', label: '提醒（黄色）' },
  ];

  const labelClass = 'mb-1.5 text-xs text-muted-foreground';

  function updatedAtText(updatedAt: number | null): string {
    return updatedAt ? `上次修改：${formatDateTime(updatedAt)}` : '当前使用默认值';
  }
</script>

<svelte:head>
  <title>系统设置 · 书循 BookLoop</title>
</svelte:head>

<div class="space-y-5">
  <div>
    <h2 class="text-xl font-semibold text-foreground">系统设置</h2>
    <p class="mt-1 text-xs text-muted-foreground">
      修改后立即生效；所有保存操作都会记录到审计日志。
    </p>
  </div>

  <div class="grid gap-4 xl:grid-cols-2">
    <!-- 借阅规则 -->
    <Card class="xl:col-span-2">
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-base">
          <BookMarked class="size-4 text-primary" />
          借阅规则
        </CardTitle>
        <CardDescription>
          默认借期用于登记借阅时的应还日期；续借次数与天数在保存后立即生效，已有借阅记录不回溯。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form method="POST" action="?/loanRules" use:enhance={submit} class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label for="defaultLoanDays" class={labelClass}>默认借期（天）</Label>
              <Input
                id="defaultLoanDays"
                name="defaultLoanDays"
                type="number"
                min="1"
                max="365"
                required
                bind:value={defaultLoanDays} />
            </div>
            <div>
              <Label for="maxRenewals" class={labelClass}>最大续借次数</Label>
              <Input
                id="maxRenewals"
                name="maxRenewals"
                type="number"
                min="0"
                max="10"
                required
                bind:value={maxRenewals} />
            </div>
            <div>
              <Label for="renewDays" class={labelClass}>每次续借天数</Label>
              <Input
                id="renewDays"
                name="renewDays"
                type="number"
                min="1"
                max="365"
                required
                bind:value={renewDays} />
            </div>
            <div class="flex items-end pb-2">
              <label class="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  name="blockOverdueBorrow"
                  bind:checked={blockOverdueBorrow}
                  class="size-4 cursor-pointer rounded border-input accent-primary" />
                有逾期未还时禁止再借
              </label>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <span class="text-[11px] text-muted-foreground">
              {updatedAtText(data.loanRules.updatedAt)}
            </span>
            <Button type="submit" size="sm">
              <Save class="size-4" />
              保存借阅规则
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <!-- 站点公告 -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-base">
          <Megaphone class="size-4 text-primary" />
          站点公告
        </CardTitle>
        <CardDescription>显示在导航栏下方，用户可手动关闭；内容修改后会重新显示。</CardDescription>
      </CardHeader>
      <CardContent>
        <form method="POST" action="?/announcement" use:enhance={submit} class="space-y-4">
          <input type="hidden" name="enabled" value={announcementEnabled ? 'on' : ''} />
          <div
            class="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 px-3.5 py-3">
            <Switch bind:checked={announcementEnabled} label="启用公告" />
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground">级别</span>
              <Select.Root
                type="single"
                name="level"
                bind:value={announcementLevel}
                items={levelItems}>
                <Select.Trigger class="h-8 w-32 text-xs">
                  <Select.Value placeholder="选择级别" />
                </Select.Trigger>
                <Select.Content>
                  {#each levelItems as item (item.value)}
                    <Select.Item value={item.value} label={item.label}>{item.label}</Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>
          </div>

          <div>
            <Label for="announcement-message" class={labelClass}>公告正文</Label>
            <Textarea
              id="announcement-message"
              name="message"
              rows={3}
              maxlength={500}
              bind:value={announcementMessage}
              placeholder="例如：本周六 18:00 起闭馆整理书架，请提前归还到期图书。" />
          </div>

          <div class="overflow-hidden rounded-lg border">
            <div class="border-b bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground">
              效果预览（以保存后的实际展示为准）
            </div>
            {#if announcementMessage.trim()}
              <div
                class="flex items-start gap-2 px-3 py-2.5 text-xs {announcementLevel === 'warning'
                  ? 'bg-amber-50 text-amber-800'
                  : 'bg-sky-50 text-sky-800'}">
                {#if announcementLevel === 'warning'}
                  <TriangleAlert class="mt-0.5 size-3.5 shrink-0" />
                {:else}
                  <Info class="mt-0.5 size-3.5 shrink-0" />
                {/if}
                <span class="min-w-0 flex-1 whitespace-pre-line">{announcementMessage}</span>
              </div>
            {:else}
              <p class="px-3 py-4 text-center text-xs text-muted-foreground">填写正文后可预览</p>
            {/if}
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <span class="text-[11px] text-muted-foreground">
              {updatedAtText(data.announcement.updatedAt)}
            </span>
            <Button type="submit" size="sm">
              <Save class="size-4" />
              保存公告
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <!-- 维护模式 -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-base">
          <Wrench class="size-4 text-primary" />
          维护模式
        </CardTitle>
        <CardDescription>开启后暂停新的借出与续借，归还仍可正常办理。</CardDescription>
      </CardHeader>
      <CardContent>
        <form method="POST" action="?/maintenance" use:enhance={submit} class="space-y-4">
          <input type="hidden" name="enabled" value={maintenanceEnabled ? 'on' : ''} />
          <div
            class="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 px-3.5 py-3">
            <div>
              <p class="text-sm font-medium text-foreground">暂停借出与续借</p>
              <p class="mt-0.5 text-[11px] text-muted-foreground">归还不受影响，便于整理馆藏。</p>
            </div>
            <Switch bind:checked={maintenanceEnabled} label="启用维护模式" />
          </div>

          <div>
            <Label for="maintenance-message" class={labelClass}>提示文案</Label>
            <Textarea
              id="maintenance-message"
              name="message"
              rows={3}
              maxlength={500}
              bind:value={maintenanceMessage}
              placeholder="留空时使用默认提示：系统维护中，暂停借出与续借，归还仍可正常办理。" />
          </div>

          {#if maintenanceEnabled}
            <div
              role="status"
              class="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-5 text-amber-800">
              <TriangleAlert class="mt-0.5 size-4 shrink-0" />
              保存后全站将暂停借出与续借，导航栏下方会显示维护提示。
            </div>
          {/if}

          <div class="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <span class="text-[11px] text-muted-foreground">
              {updatedAtText(data.maintenance.updatedAt)}
            </span>
            <Button type="submit" size="sm">
              <Save class="size-4" />
              保存维护设置
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</div>
