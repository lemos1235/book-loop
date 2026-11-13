<script lang="ts" module>
  export interface PaginationProps {
    page?: number;
    pageSize?: number;
    totalItems?: number;
    pageSizeOptions?: number[];
    ariaLabel?: string;
    showSummary?: boolean;
    class?: string;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
  }
</script>

<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Select from '$lib/components/ui/select';

  let {
    page = $bindable(1),
    pageSize = $bindable(10),
    totalItems = 0,
    pageSizeOptions = [10, 20, 50],
    ariaLabel = '分页导航',
    showSummary = true,
    class: containerClass = '',
    onPageChange,
    onPageSizeChange,
  }: PaginationProps = $props();

  const clampPage = (value: number, max: number) => Math.min(Math.max(value, 1), max);

  const totalPages = $derived(Math.max(Math.ceil(totalItems / pageSize), 1));
  const currentPage = $derived(clampPage(page, totalPages));
  const startItem = $derived(totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1);
  const endItem = $derived(Math.min(currentPage * pageSize, totalItems));
  const pages = $derived(getVisiblePages(currentPage, totalPages));
  const sizeItems = $derived(
    pageSizeOptions.map((size) => ({ value: String(size), label: `${size} 条` })),
  );

  function getVisiblePages(current: number, total: number): Array<number | 'ellipsis'> {
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const visible = new Set([1, total, current - 1, current, current + 1]);
    if (current <= 4) {
      visible.add(2);
      visible.add(3);
      visible.add(4);
      visible.add(5);
    }
    if (current >= total - 3) {
      visible.add(total - 4);
      visible.add(total - 3);
      visible.add(total - 2);
      visible.add(total - 1);
    }

    const ordered = [...visible]
      .filter((value) => value >= 1 && value <= total)
      .sort((a, b) => a - b);

    return ordered.reduce<Array<number | 'ellipsis'>>((acc, value, index) => {
      const previous = ordered[index - 1];
      if (index > 0 && value - previous > 1) acc.push('ellipsis');
      acc.push(value);
      return acc;
    }, []);
  }

  function changePage(nextPage: number) {
    const targetPage = clampPage(nextPage, totalPages);
    if (targetPage !== currentPage) {
      page = targetPage;
      onPageChange?.(targetPage);
    }
  }

  function handlePageSizeChange(value: string) {
    const newSize = Number(value);
    if (!Number.isFinite(newSize)) return;
    page = 1;
    onPageSizeChange?.(newSize);
    onPageChange?.(1);
  }
</script>

<nav
  aria-label={ariaLabel}
  class="flex flex-wrap items-center justify-between gap-2.5 text-xs text-muted-foreground {containerClass}">
  {#if showSummary}
    <p class="m-0">
      第 {startItem}–{endItem} 条，共 {totalItems} 条
    </p>
  {:else}
    <div></div>
  {/if}

  <div class="flex items-center gap-2">
    <div class="flex items-center gap-1.5">
      <span>每页</span>
      <Select.Root
        type="single"
        value={String(pageSize)}
        items={sizeItems}
        onValueChange={handlePageSizeChange}>
        <Select.Trigger size="sm" class="h-7 w-[76px] text-xs">
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          {#each pageSizeOptions as size (size)}
            <Select.Item value={String(size)} label={`${size} 条`}>{size} 条</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>

    <div class="flex items-center gap-0.5">
      <Button
        variant="outline"
        size="sm"
        class="h-7 px-2 text-xs"
        disabled={currentPage === 1}
        onclick={() => changePage(currentPage - 1)}>
        上一页
      </Button>

      {#each pages as item, index}
        {#if item === 'ellipsis'}
          <span
            class="flex h-7 min-w-3.5 items-center justify-center text-xs text-muted-foreground select-none"
            aria-hidden="true"
            data-index={index}>
            ...
          </span>
        {:else}
          {@const isActive = item === currentPage}
          <Button
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            aria-current={isActive ? 'page' : undefined}
            class="h-7 min-w-7 px-1.5 text-xs"
            onclick={() => changePage(item)}>
            {item}
          </Button>
        {/if}
      {/each}

      <Button
        variant="outline"
        size="sm"
        class="h-7 px-2 text-xs"
        disabled={currentPage === totalPages}
        onclick={() => changePage(currentPage + 1)}>
        下一页
      </Button>
    </div>
  </div>
</nav>
