<script lang="ts">
  let {
    checked = $bindable(false),
    label = '',
    disabled = false,
  }: {
    checked?: boolean;
    label?: string;
    disabled?: boolean;
  } = $props();
</script>

<div class="inline-flex items-center gap-2.5 select-none">
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label || '开关'}
    {disabled}
    onclick={() => (checked = !checked)}
    class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 {checked
      ? 'bg-primary'
      : 'bg-muted-foreground/25'}">
    <span
      aria-hidden="true"
      class="pointer-events-none inline-block size-5 rounded-full bg-white shadow-xs transition-transform duration-200 {checked
        ? 'translate-x-5'
        : 'translate-x-0'}">
    </span>
  </button>
  {#if label}
    <span class="text-xs text-muted-foreground">{label}</span>
  {/if}
</div>
