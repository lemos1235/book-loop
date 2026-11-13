<script lang="ts" module>
  import type { Snippet } from 'svelte';

  export type DataTableRowKey = string | number;

  export interface DataTableColumn<TableRow extends Record<string, unknown> = Record<string, any>> {
    key: keyof TableRow | string;
    header: string;
    align?: 'left' | 'center' | 'right';
    width?: string;
    minWidth?: string;
    class?: string;
    cell?: Snippet<[TableRow, number]>;
  }

  export interface DataTableProps<Row extends Record<string, unknown> = Record<string, any>> {
    columns: DataTableColumn<Row>[];
    rows?: Row[];
    rowKey?: keyof Row | ((row: Row, index: number) => DataTableRowKey);
    selectable?: boolean;
    selectedRowKeys?: DataTableRowKey[];
    onSelectionChange?: (keys: DataTableRowKey[]) => void;
    page?: number;
    pageSize?: number;
    totalItems?: number;
    pageSizeOptions?: number[];
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    showSummary?: boolean;
    loading?: boolean;
    loadingMessage?: string;
    emptyMessage?: string;
    class?: string;
    cellPadding?: string;
    maxHeight?: string;
    cell?: Snippet<[{ row: Row; column: DataTableColumn<Row>; index: number }]>;
    empty?: Snippet;
    pagination?: Snippet;
  }
</script>

<script lang="ts" generics="Row extends Record<string, unknown> = Record<string, any>">
  import Pagination from './Pagination.svelte';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '$lib/components/ui/table';

  let {
    columns,
    rows = [],
    rowKey,
    selectable = false,
    selectedRowKeys = $bindable([]),
    onSelectionChange,
    page = $bindable(1),
    pageSize = $bindable(10),
    totalItems = undefined,
    pageSizeOptions = [10, 20, 50],
    onPageChange,
    onPageSizeChange,
    showSummary = true,
    loading = false,
    loadingMessage = '加载中…',
    emptyMessage = '暂无数据',
    class: containerClass = '',
    cellPadding = 'px-3 py-2.5',
    maxHeight,
    cell,
    empty,
    pagination,
  }: DataTableProps<Row> = $props();

  function getRowKey(row: Row, index: number): DataTableRowKey {
    if (typeof rowKey === 'function') return rowKey(row, index);
    if (rowKey) {
      const val = row[rowKey];
      if (typeof val === 'string' || typeof val === 'number') return val;
    }
    const defaultId = (row as Record<string, unknown>).id;
    if (typeof defaultId === 'string' || typeof defaultId === 'number') return defaultId;
    return index;
  }

  const selectedKeySet = $derived(new Set(selectedRowKeys.map((k) => String(k))));
  const displayRowKeys = $derived(rows.map((row, index) => getRowKey(row, index)));

  const allDisplayRowsSelected = $derived(
    displayRowKeys.length > 0 && displayRowKeys.every((key) => selectedKeySet.has(String(key))),
  );
  const someDisplayRowsSelected = $derived(
    displayRowKeys.some((key) => selectedKeySet.has(String(key))),
  );
  const isIndeterminate = $derived(someDisplayRowsSelected && !allDisplayRowsSelected);

  function indeterminate(node: HTMLInputElement, value: boolean) {
    node.indeterminate = value;
    return {
      update(newValue: boolean) {
        node.indeterminate = newValue;
      },
    };
  }

  function isRowSelected(row: Row, index: number): boolean {
    return selectedKeySet.has(String(getRowKey(row, index)));
  }

  function emitSelection(nextKeys: DataTableRowKey[]) {
    selectedRowKeys = nextKeys;
    onSelectionChange?.(nextKeys);
  }

  function toggleRowSelection(row: Row, index: number, checked: boolean) {
    const key = getRowKey(row, index);
    const nextKeys = selectedRowKeys.filter((k) => String(k) !== String(key));
    if (checked) nextKeys.push(key);
    emitSelection(nextKeys);
  }

  function toggleDisplayRowsSelection(checked: boolean) {
    if (!checked) {
      const displayKeySet = new Set(displayRowKeys.map((k) => String(k)));
      emitSelection(selectedRowKeys.filter((key) => !displayKeySet.has(String(key))));
      return;
    }

    const existingKeySet = new Set(selectedRowKeys.map((k) => String(k)));
    const nextKeys: DataTableRowKey[] = [...selectedRowKeys];
    for (const key of displayRowKeys) {
      if (!existingKeySet.has(String(key))) {
        nextKeys.push(key);
        existingKeySet.add(String(key));
      }
    }
    emitSelection(nextKeys);
  }

  function getCellValue(row: Row, key: keyof Row | string): string {
    const val = row[key as keyof Row];
    if (val === null || val === undefined || val === '') return '—';
    return String(val);
  }

  const tableColumnCount = $derived(columns.length + (selectable ? 1 : 0));
  const skeletonRowCount = $derived(Math.min(Math.max(pageSize, 1), 8));
  const SKELETON_WIDTHS = ['72%', '44%', '58%', '52%', '34%'];

  function skeletonWidth(columnIndex: number): string {
    return SKELETON_WIDTHS[columnIndex % SKELETON_WIDTHS.length];
  }

  function alignClass(align: DataTableColumn<Row>['align']): string {
    return align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  }

  // sticky 必须落在 th 上；只给 thead 加 sticky 在部分浏览器不生效
  const headStickyClass = $derived(
    maxHeight ? 'sticky top-0 z-10 bg-muted shadow-[inset_0_-1px_0_0_var(--color-border)]' : '',
  );
</script>

<div class="w-full space-y-1.5 {containerClass}">
  <div class="relative overflow-hidden rounded-xl border bg-card shadow-xs">
    {#if loading}
      <span class="sr-only" role="status" aria-live="polite">{loadingMessage}</span>
      <div
        class="dt-progress-track pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden bg-muted">
        <div class="dt-progress-bar h-full bg-primary"></div>
      </div>
    {/if}

    <Table
      class="text-xs"
      containerClass="overflow-auto"
      containerStyle={maxHeight ? `max-height: ${maxHeight}` : undefined}>
      <TableHeader class={maxHeight ? 'bg-muted/80 backdrop-blur-sm' : 'bg-muted/40'}>
        <TableRow class="hover:bg-transparent">
          {#if selectable}
            <TableHead class="w-9 pl-4 {headStickyClass}">
              <input
                type="checkbox"
                aria-label="全选当前页"
                checked={allDisplayRowsSelected}
                use:indeterminate={isIndeterminate}
                oninput={(e) => toggleDisplayRowsSelection(e.currentTarget.checked)}
                class="size-3.5 cursor-pointer rounded border-input accent-primary" />
            </TableHead>
          {/if}
          {#each columns as col (col.key)}
            <TableHead
              style="{col.width ? `width: ${col.width};` : ''} {col.minWidth
                ? `min-width: ${col.minWidth};`
                : ''}"
              class="{cellPadding} text-xs font-medium whitespace-nowrap text-muted-foreground {headStickyClass} {alignClass(
                col.align,
              )} {col.class ?? ''}">
              {col.header}
            </TableHead>
          {/each}
        </TableRow>
      </TableHeader>

      <TableBody>
        {#if loading && rows.length === 0}
          {#each Array(skeletonRowCount) as _, rowIndex (rowIndex)}
            <TableRow aria-hidden="true">
              {#if selectable}
                <TableCell class="w-9 pl-4">
                  <Skeleton class="size-3.5 rounded-sm" />
                </TableCell>
              {/if}
              {#each columns as col, columnIndex (col.key)}
                <TableCell class={cellPadding}>
                  <Skeleton class="h-3 rounded" style="width: {skeletonWidth(columnIndex)};" />
                </TableCell>
              {/each}
            </TableRow>
          {/each}
        {:else if rows.length === 0}
          <TableRow class="hover:bg-transparent">
            <TableCell colspan={tableColumnCount} class="py-12 text-center text-muted-foreground">
              {#if empty}
                {@render empty()}
              {:else}
                <div class="text-sm">{emptyMessage}</div>
              {/if}
            </TableCell>
          </TableRow>
        {:else}
          {#each rows as row, index (getRowKey(row, index))}
            {@const isSelected = isRowSelected(row, index)}
            <TableRow class="hover:bg-muted/40 {isSelected ? 'bg-accent/40' : ''}">
              {#if selectable}
                <TableCell class="w-9 pl-4">
                  <input
                    type="checkbox"
                    aria-label="选择第 {index + 1} 行"
                    checked={isSelected}
                    oninput={(e) => toggleRowSelection(row, index, e.currentTarget.checked)}
                    class="size-3.5 cursor-pointer rounded border-input accent-primary" />
                </TableCell>
              {/if}

              {#each columns as col (col.key)}
                <TableCell
                  style="{col.width ? `width: ${col.width};` : ''} {col.minWidth
                    ? `min-width: ${col.minWidth};`
                    : ''}"
                  class="{cellPadding} text-xs text-foreground/90 {alignClass(
                    col.align,
                  )} {col.class ?? ''}">
                  {#if col.cell}
                    {@render col.cell(row, index)}
                  {:else if cell}
                    {@render cell({ row, column: col, index })}
                  {:else}
                    {getCellValue(row, col.key)}
                  {/if}
                </TableCell>
              {/each}
            </TableRow>
          {/each}
        {/if}
      </TableBody>
    </Table>

    {#if totalItems !== undefined && totalItems > 0}
      <div class="border-t px-3.5 py-2">
        <Pagination
          bind:page
          bind:pageSize
          {totalItems}
          {pageSizeOptions}
          {showSummary}
          {onPageChange}
          {onPageSizeChange} />
      </div>
    {/if}
  </div>

  {#if pagination}
    {@render pagination()}
  {/if}
</div>

<style>
  @keyframes dt-indeterminate {
    0% {
      left: -35%;
      width: 35%;
    }
    50% {
      left: 25%;
      width: 55%;
    }
    100% {
      left: 100%;
      width: 35%;
    }
  }

  .dt-progress-bar {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 9999px;
    animation: dt-indeterminate 1.2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
  }
</style>
