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

<section class="bg-slate-800 rounded-lg p-6 mt-8">
  <h2 class="text-2xl font-semibold text-white mb-4">👀 Вы недавно смотрели</h2>
  <div class="space-y-4">
    {#each recentlyViewed as item}
      <div class="rounded-lg bg-slate-700 text-white">
        <div class="flex p-4 bg-gray-700 rounded-lg justify-between items-center">
          <div>
            <h3 class="text-sm md:text:xl font-bold">{item.discipline}</h3>
            <p>Средний балл: {item.stats.average.toFixed(2)}</p>
            <p>Оценок: {item.stats.count5 + item.stats.count4 + item.stats.count3 + item.stats.count2}</p>
          </div>
          <button 
            class="bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-600"
            on:click={() => dispatch('viewAgain', { subject: item.discipline })}
          >
            Посмотреть снова
          </button>
        </div>
      </div>
    {/each}
  </div>
</section> 