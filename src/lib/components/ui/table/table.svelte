<script lang="ts">
  import { cn, type WithElementRef } from '$lib/utils.js';
  import type { HTMLTableAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    containerClass = '',
    containerStyle = undefined,
    children,
    ...restProps
  }: WithElementRef<HTMLTableAttributes> & {
    containerClass?: string;
    containerStyle?: string;
  } = $props();
</script>

<div
  data-slot="table-container"
  class="relative w-full overflow-x-auto {containerClass}"
  style={containerStyle}>
  <table
    bind:this={ref}
    data-slot="table"
    class={cn('w-full caption-bottom text-sm', className)}
    {...restProps}>
    {@render children?.()}
  </table>
</div>
