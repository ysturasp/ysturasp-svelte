<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { NotificationType } from '$lib/types';
  import { fade } from 'svelte/transition';

  export let message: string;
  export let type: NotificationType;
  export let id: string;

  const dispatch = createEventDispatcher();
  let notificationElement: HTMLDivElement;
  let isSwiping = false;
  let touchStartX = 0;
  let currentX = 0;
  let moveX = 0;
  let isVisible = false;
  let isHiding = false;

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500'
  };

  onMount(() => {
    if (notificationElement) {
      const height = notificationElement.offsetHeight;
      notificationElement.style.height = height + 'px';
    }
    requestAnimationFrame(() => {
      isVisible = true;
    });
  });

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.changedTouches[0].screenX;
    isSwiping = true;
    notificationElement.style.transition = '';
  }

  function handleTouchMove(e: TouchEvent) {
    if (!isSwiping) return;
    currentX = e.changedTouches[0].screenX;
    moveX = currentX - touchStartX;
    notificationElement.style.transform = `translateX(${moveX}px)`;
  }

  function handleTouchEnd() {
    if (!isSwiping) return;
    isSwiping = false;

    if (Math.abs(moveX) > 100) {
      const direction = moveX < 0 ? '-110%' : '110%';
      notificationElement.style.transition = 'all 0.5s ease';
      notificationElement.style.transform = `translateX(${direction})`;
      hide();
    } else {
      notificationElement.style.transition = 'transform 0.3s ease';
      notificationElement.style.transform = 'translateX(0)';
    }
  }

  function hide() {
    isHiding = true;
    setTimeout(() => {
      dispatch('remove', id);
    }, 500);
  }

  function handleClick() {
    notificationElement.style.transition = 'all 0.5s ease';
    notificationElement.style.transform = 'translateX(100%)';
    hide();
  }

  const remove = () => {
    dispatch('remove', id);
  };
</script>

<div
  bind:this={notificationElement}
  class="py-2 px-4 rounded-2xl notification shadow-lg {colors[type]} text-white {isVisible ? 'show' : ''} {isHiding ? 'hide' : ''}"
  on:touchstart={handleTouchStart}
  on:touchmove={handleTouchMove}
  on:touchend={handleTouchEnd}
  on:click={handleClick}
  role="alert"
>
  <div class="flex items-center justify-between">
    <p>{message}</p>
  </div>
</div>

<style>
  .notification {
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease-in-out, height 0.3s ease-in-out, margin 0.3s ease-in-out, padding 0.3s ease-in-out;
    margin-left: auto;
    overflow: hidden;
    min-width: 200px;
    max-width: 100%;
    width: max-content;
  }

  .notification.show {
    opacity: 1;
    transform: translateX(0);
  }

  .notification.hide {
    opacity: 0;
    transform: translateX(100%);
    margin-top: 0;
    margin-bottom: 0;
    padding-top: 0;
    padding-bottom: 0;
    height: 0 !important;
  }
</style> 