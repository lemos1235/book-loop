<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { authClient } from '#lib/auth-client';
  import BrandMark from '#lib/components/BrandMark.svelte';
  import { formatFullDate } from '#lib/format';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import {
    ArrowLeftRight,
    BookOpen,
    ChevronDown,
    LayoutDashboard,
    Loader2,
    LogOut,
    Users,
  } from '@lucide/svelte';

  let { data, children } = $props();

  let userMenuOpen = $state(false);
  let signingOut = $state(false);

  const NAV_ITEMS = [
    { href: '/', label: '工作台', icon: LayoutDashboard },
    { href: '/books', label: '图书管理', icon: BookOpen },
    { href: '/members', label: '读者管理', icon: Users },
    { href: '/loans', label: '借阅管理', icon: ArrowLeftRight },
  ];

  const PAGE_TITLES: Record<string, string> = {
    '/': '工作台',
    '/books': '图书管理',
    '/members': '读者管理',
    '/loans': '借阅管理',
  };

  const pathname = $derived(page.url.pathname);
  const pageTitle = $derived(PAGE_TITLES[pathname] ?? '书循');
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const user = $derived(data.user);
  const displayName = $derived(user?.name || user?.email || '管理员');
  const initial = $derived((displayName.trim()[0] ?? '管').toUpperCase());

  async function signOut() {
    if (signingOut) return;
    signingOut = true;
    try {
      await authClient.signOut();
      await goto('/login', { invalidateAll: true });
    } finally {
      signingOut = false;
    }
  }
</script>

<svelte:head>
  <title>{pageTitle} · 书循 BookLoop</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<!-- 顶栏：品牌语境 + 运行状态 + 日期 + 用户菜单 -->
<header
  class="sticky top-0 z-40 h-16 border-b border-border/70 bg-gradient-to-r from-card via-card to-secondary/50 backdrop-blur-md">
  <!-- 顶部绿色细装饰线 -->
  <div
    class="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-600 via-brand-400 to-brand-600/0">
  </div>

  <div class="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
    <div class="flex min-w-0 items-center gap-3">
      <a
        href="/"
        class="shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <BrandMark />
      </a>
      <span class="hidden h-6 w-px bg-border sm:block"></span>
      <div class="hidden flex-col sm:flex">
        <span class="text-[10px] font-medium tracking-[0.18em] text-muted-foreground">
          LIBRARY CONSOLE
        </span>
        <span class="mt-0.5 flex items-center gap-1.5 text-xs text-foreground/75">
          <span class="relative flex size-1.5">
            <span
              class="absolute inline-flex size-full animate-ping rounded-full bg-brand-400 opacity-60">
            </span>
            <span class="relative inline-flex size-1.5 rounded-full bg-brand-600"></span>
          </span>
          系统运行正常
        </span>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-2 sm:gap-3">
      <span
        class="hidden items-center rounded-full border border-border/70 bg-background/60 px-3 py-1 text-[11px] text-muted-foreground md:inline-flex">
        {formatFullDate(data.now)}
      </span>
      <span class="hidden h-5 w-px bg-border md:block"></span>

      <DropdownMenu.Root bind:open={userMenuOpen}>
        <DropdownMenu.Trigger
          class="flex cursor-pointer items-center gap-2 rounded-full border border-border/70 bg-background/70 py-1 pr-2 pl-1 shadow-xs transition-colors hover:border-brand-200 hover:bg-secondary/60">
          <span
            class="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground ring-1 ring-brand-200/70">
            {initial}
          </span>
          <span class="hidden text-xs font-medium text-foreground/80 sm:block">{displayName}</span>
          <ChevronDown
            class="size-3.5 text-muted-foreground transition-transform {userMenuOpen
              ? 'rotate-180'
              : ''}" />
        </DropdownMenu.Trigger>

        <DropdownMenu.Content align="end" class="w-56">
          <div class="px-2 py-1.5">
            <p class="truncate text-xs font-medium text-foreground">{displayName}</p>
            <p class="mt-0.5 truncate text-[11px] text-muted-foreground">{user?.email}</p>
          </div>
          <DropdownMenu.Separator />
          <DropdownMenu.Item disabled={signingOut} class="gap-2 text-xs" onSelect={() => signOut()}>
            {#if signingOut}
              <Loader2 class="size-4 animate-spin" />
            {:else}
              <LogOut class="size-4" />
            {/if}
            退出登录
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </div>
</header>

<!-- 栏目条：横向胶囊导航 -->
<nav
  class="sticky top-16 z-30 h-12 w-full border-b bg-card/95 backdrop-blur-sm"
  aria-label="管理后台导航">
  <div class="h-full w-full px-4 sm:px-6 lg:px-8">
    <ul
      class="grid h-full grid-cols-4 items-center gap-1 sm:flex sm:gap-1.5 [&::-webkit-scrollbar]:hidden">
      {#each NAV_ITEMS as item (item.href)}
        {@const active = isActive(item.href)}
        <li>
          <a
            href={item.href}
            aria-current={active ? 'page' : undefined}
            class="group inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg px-1 text-[11px] font-medium whitespace-nowrap transition-colors sm:w-auto sm:justify-start sm:gap-2 sm:px-3.5 sm:text-sm {active
              ? 'bg-secondary text-secondary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'}">
            <item.icon
              class="size-4 transition-colors {active
                ? 'text-secondary-foreground'
                : 'text-muted-foreground group-hover:text-foreground'}" />
            <span>{item.label}</span>
          </a>
        </li>
      {/each}
    </ul>
  </div>
</nav>

<main class="w-full px-4 py-6 sm:px-6 lg:px-8">
  {@render children()}
</main>
