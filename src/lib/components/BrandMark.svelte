<script lang="ts">
  import { BookMarked } from '@lucide/svelte';

  let { showText = true, light = false }: { showText?: boolean; light?: boolean } = $props();
</script>

<div class="flex items-center gap-2.5">
  <div
    class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-900 text-white shadow-sm">
    <BookMarked size={18} strokeWidth={2.1} />
  </div>
  {#if showText}
    <div class="leading-tight">
      <div class="text-sm font-semibold tracking-tight {light ? 'text-white' : 'text-stone-900'}">
        书循
      </div>
      <div class="text-[10px] tracking-[0.22em] {light ? 'text-white/60' : 'text-stone-400'}">
        BOOKLOOP
      </div>
    </div>
  {/if}
</div>
