<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let title: string;
  export let isOpen: boolean = false;
  export let maxWidth: string = 'max-w-2xl';

  const dispatch = createEventDispatcher();

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      dispatch('close');
    }
  }

  function handleEscapeKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) {
      dispatch('close');
    }
  }
</script>

<svelte:window on:keydown={handleEscapeKey} />

{#if isOpen}
  <div
    class="fixed inset-0 bg-gray-800/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
    on:click={handleBackdropClick}
  >
    <div class="bg-slate-900 rounded-2xl p-5 ml-3 mr-3 text-center {maxWidth} w-full mx-auto relative">
      <h2 class="text-xl font-semibold text-white mb-4">{title}</h2>
      <slot />
      <button
        on:click={() => dispatch('close')}
        class="absolute top-2 right-2 text-slate-400 hover:text-white p-2"
      >
        ✕
      </button>
    </div>
  </div>
{/if} 