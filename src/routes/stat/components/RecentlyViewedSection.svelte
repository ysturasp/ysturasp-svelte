<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { RecentlyViewedItem } from '../types';

  const dispatch = createEventDispatcher<{
    viewAgain: { subject: string };
  }>();

  let recentlyViewed: RecentlyViewedItem[] = [];

  function loadRecentlyViewed() {
    const stored = localStorage.getItem('recentlyViewed');
    if (stored) {
      recentlyViewed = JSON.parse(stored);
    }
  }

  onMount(loadRecentlyViewed);
</script>

<section class="bg-slate-800 rounded-2xl p-6 mt-8">
  <h2 class="text-2xl font-semibold text-white mb-4">👀 Вы недавно смотрели</h2>
  <div class="space-y-4">
    {#each recentlyViewed as item}
      <div class="rounded-2xl bg-slate-700 text-white">
        <div class="flex p-4 bg-gray-700 rounded-2xl justify-between items-center">
          <div>
            <h3 class="text-sm md:text:xl font-bold">{item.discipline}</h3>
            <p>Средний балл: {item.stats.average.toFixed(2)}</p>
            <p>Оценок: {item.stats.count5 + item.stats.count4 + item.stats.count3 + item.stats.count2}</p>
          </div>
          <button 
            class="recently-viewed-btn flex items-center gap-2 bg-blue-700 text-white px-3 py-1 rounded-xl hover:bg-blue-600 transition-all shadow-md"
            on:click={() => dispatch('viewAgain', { subject: item.discipline })}
          >
            <span class="hidden sm:inline">Посмотреть снова</span>
            <svg style="color: white" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-left-circle-fill" viewBox="0 0 16 16"> <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.5 7.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5z" fill="white"></path> </svg>
          </button>
        </div>
      </div>
    {/each}
  </div>
</section> 

<style>
  .recently-viewed-btn {
    min-width: 44px;
    min-height: 36px;
    justify-content: center;
    align-items: center;
    margin-left: 0;
    margin-right: 0;
    box-shadow: 0 2px 8px 0 rgba(30, 64, 175, 0.10);
  }
  @media (max-width: 640px) {
    .recently-viewed-btn {
      width: 44px;
      height: 36px;
      padding: 0;
      justify-content: center;
      align-items: center;
      border-radius: 18px;
    }
    .recently-viewed-btn span {
      display: none;
    }
    .recently-viewed-btn svg {
      margin: 0 auto;
    }
  }
</style> 