<script lang="ts">
  import { dev } from '$app/environment';
  import { goto } from '$app/navigation';
  import { authClient } from '#lib/auth-client';
  import BrandMark from '#lib/components/BrandMark.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import {
    BookOpenCheck,
    CheckCircle2,
    Eye,
    EyeOff,
    Loader2,
    Lock,
    Mail,
    ShieldCheck,
  } from '@lucide/svelte';

  let email = $state('');
  let password = $state('');
  let showPassword = $state(false);
  let submitting = $state(false);
  let errorMessage = $state('');

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (submitting) return;
    errorMessage = '';

    if (!email.trim() || !password) {
      errorMessage = '请输入邮箱和密码';
      return;
    }

    submitting = true;
    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (error) {
        errorMessage =
          error.status === 401 || error.status === 403
            ? '邮箱或密码不正确'
            : (error.message ?? '登录失败，请稍后重试');
        return;
      }
      await goto('/', { invalidateAll: true });
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : '网络异常，请稍后重试';
    } finally {
      submitting = false;
    }
  }

  const features = [
    { icon: BookOpenCheck, text: '馆藏、借出、归还一体化流转' },
    { icon: ShieldCheck, text: '逾期与停用状态清晰可控' },
    { icon: CheckCircle2, text: '借阅数据实时汇总，一目了然' },
  ];
</script>

<svelte:head>
  <title>登录 · 书循 BookLoop</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="grid min-h-dvh lg:grid-cols-2">
  <!-- 品牌展示区 -->
  <div
    class="relative hidden overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-12 py-10 lg:flex lg:flex-col">
    <div class="relative z-10 flex flex-1 flex-col">
      <BrandMark light />

      <div class="mt-auto max-w-md">
        <p class="text-xs font-medium tracking-[0.28em] text-brand-300">LIBRARY OPERATIONS</p>
        <h1 class="mt-4 text-3xl leading-snug font-semibold text-white">
          让每一本书，
          <br />
          都有清晰的去向。
        </h1>
        <p class="mt-4 text-sm leading-relaxed text-brand-200/80">
          面向图书馆与阅读空间的一站式借还管理后台，用更轻的方式管理馆藏与读者。
        </p>

        <ul class="mt-9 space-y-3.5">
          {#each features as feature (feature.text)}
            <li class="flex items-center gap-3 text-sm text-brand-100/90">
              <span
                class="flex size-7 items-center justify-center rounded-lg bg-white/10 text-brand-200">
                <feature.icon class="size-4" />
              </span>
              {feature.text}
            </li>
          {/each}
        </ul>
      </div>

      <p class="mt-auto pt-10 text-[11px] text-brand-300/60">书循 BookLoop · 图书借还管理系统</p>
    </div>

    <!-- 装饰光晕 -->
    <div
      class="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-brand-500/20 blur-3xl">
    </div>
    <div
      class="pointer-events-none absolute right-10 bottom-10 size-48 rounded-full border border-white/10">
    </div>
    <div
      class="pointer-events-none absolute right-24 bottom-24 size-32 rounded-full border border-white/10">
    </div>
  </div>

  <!-- 登录表单 -->
  <div class="flex items-center justify-center bg-muted/30 px-5 py-10 sm:px-8">
    <Card class="w-full max-w-sm gap-0 rounded-2xl p-6 shadow-xs sm:p-8">
      <div class="mb-8 lg:hidden">
        <BrandMark />
      </div>

      <h2 class="text-2xl font-semibold tracking-tight text-foreground">登录管理后台</h2>
      <p class="mt-1.5 text-sm text-muted-foreground">请使用馆内分配的固定邮箱与密码登录。</p>

      <form class="mt-8 space-y-4" onsubmit={handleSubmit} novalidate>
        <div class="space-y-1.5">
          <Label for="email" class="text-xs text-muted-foreground">邮箱</Label>
          <div class="relative">
            <Mail
              class="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              autocomplete="username"
              bind:value={email}
              placeholder="admin@bookloop.local"
              class="h-10 pl-9" />
          </div>
        </div>

        <div class="space-y-1.5">
          <Label for="password" class="text-xs text-muted-foreground">密码</Label>
          <div class="relative">
            <Lock
              class="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autocomplete="current-password"
              bind:value={password}
              placeholder="请输入密码"
              class="h-10 pr-10 pl-9" />
            <button
              type="button"
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              onclick={() => (showPassword = !showPassword)}
              class="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              {#if showPassword}
                <EyeOff class="size-4" />
              {:else}
                <Eye class="size-4" />
              {/if}
            </button>
          </div>
        </div>

        {#if errorMessage}
          <p
            class="rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive">
            {errorMessage}
          </p>
        {/if}

        <Button type="submit" class="h-10 w-full" disabled={submitting}>
          {#if submitting}
            <Loader2 class="size-4 animate-spin" />
            登录中…
          {:else}
            登录
          {/if}
        </Button>
      </form>

      {#if dev}
        <div class="mt-6 rounded-lg border bg-secondary/60 px-4 py-3">
          <p class="text-[11px] font-medium text-secondary-foreground">
            演示账号（仅开发环境显示）
          </p>
          <p class="mt-0.5 font-mono text-[11px] text-secondary-foreground/80">
            admin@bookloop.local / bookloop123
          </p>
          <p class="mt-1 text-[10px] leading-relaxed text-muted-foreground">
            由 <span class="font-mono">npm run db:seed</span>
            创建；可用
            <span class="font-mono">npm run user:password</span>
            修改。
          </p>
        </div>
      {/if}

      <p class="mt-8 text-center text-[11px] text-muted-foreground">
        本系统仅限馆内工作人员使用，账号不开放自助注册。
      </p>
    </Card>
  </div>
</div>
