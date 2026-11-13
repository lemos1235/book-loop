<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import type { StatusTone } from '#lib/types';

  let {
    label,
    tone = 'neutral',
    dot = true,
  }: {
    label: string;
    tone?: StatusTone;
    dot?: boolean;
  } = $props();

  const toneClass = $derived(
    tone === 'success'
      ? 'border-emerald-600/15 bg-emerald-50 text-emerald-700'
      : tone === 'warning'
        ? 'border-amber-600/15 bg-amber-50 text-amber-700'
        : tone === 'danger'
          ? 'border-red-600/15 bg-red-50 text-red-700'
          : tone === 'info'
            ? 'border-sky-600/15 bg-sky-50 text-sky-700'
            : 'border-stone-500/10 bg-stone-100 text-stone-600',
  );

  const dotClass = $derived(
    tone === 'success'
      ? 'bg-emerald-500'
      : tone === 'warning'
        ? 'bg-amber-500'
        : tone === 'danger'
          ? 'bg-red-500'
          : tone === 'info'
            ? 'bg-sky-500'
            : 'bg-stone-400',
  );
</script>

<Badge variant="outline" class="h-5 gap-1.5 rounded-full px-2 py-0.5 text-[11px] {toneClass}">
  {#if dot}
    <span class="size-1.5 rounded-full {dotClass}"></span>
  {/if}
  {label}
</Badge>
