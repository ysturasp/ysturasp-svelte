<script lang="ts">
  import { onMount } from 'svelte';
  import type { NotificationType } from '$lib/types';

  export let message: string;
  export let type: NotificationType = 'info';
  export let duration: number = 5000;

  let isVisible = false;
  let isSwiping = false;
  let touchStartX = 0;
  let currentX = 0;
  let moveX = 0;

  const colors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500'
  };

  onMount(() => {
    setTimeout(() => {
      isVisible = true;
    }, 10);

    if (duration > 0) {
      setTimeout(() => {
        hide();
      }, duration);
    }
  });

  function hide() {
    isVisible = false;
  }

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.changedTouches[0].screenX;
    isSwiping = true;
  }

  function handleTouchMove(e: TouchEvent) {
    if (!isSwiping) return;
    currentX = e.changedTouches[0].screenX;
    moveX = currentX - touchStartX;
  }

  function handleTouchEnd() {
    if (!isSwiping) return;
    isSwiping = false;
    if (Math.abs(moveX) > 100) {
      hide();
    }
    moveX = 0;
  }
</script>

<div
  class="fixed bottom-5 right-5 left-5 sm:right-10 sm:left-auto {colors[type]} text-white py-2 px-4 rounded-lg z-50 notification {isVisible ? 'show' : 'hide'}"
  on:touchstart={handleTouchStart}
  on:touchmove={handleTouchMove}
  on:touchend={handleTouchEnd}
  on:click={hide}
  style="transform: translateX({moveX}px)"
>
  {message}
</div>

<style>
  .notification {
    opacity: 0;
    transform: translateY(100%);
    transition: all 0.3s ease-in-out;
  }

  .notification.show {
    opacity: 1;
    transform: translateY(0);
  }

  .notification.hide {
    opacity: 0;
    transform: translateY(100%);
  }
</style> 