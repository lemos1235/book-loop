<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Card } from '$lib/components/ui/card';

  let {
    label,
    value,
    hint,
    danger = false,
  }: {
    label: string;
    value: string | number;
    hint?: Snippet;
    danger?: boolean;
  } = $props();
</script>

<Card class="gap-0 rounded-xl px-3.5 py-3 shadow-xs sm:px-4 sm:py-3.5">
  <div class="text-[11px] text-muted-foreground sm:text-xs">{label}</div>
  <div
    class="mt-1 text-xl font-semibold text-foreground tabular-nums sm:text-2xl {danger
      ? 'text-red-600'
      : ''}">
    {value}
  </div>
  {#if hint}
    <div class="mt-0.5 text-[11px] text-muted-foreground/80 sm:text-xs">
      {@render hint()}
    </div>
  {/if}
</Card>
