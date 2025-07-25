<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type { RecentlyViewedItem, InstituteId } from '../types';
	import { recentlyViewedStore } from '../stores/recentlyViewedStore';

	const dispatch = createEventDispatcher<{
		viewAgain: { subject: string };
	}>();

	let recentlyViewed: RecentlyViewedItem[] = [];

	function loadRecentlyViewed() {
		recentlyViewedStore.loadFromStorage();
	}

	function getInstituteName(instituteId: InstituteId): string {
		switch (instituteId) {
			case 'btn-digital-systems':
				return 'Институт Цифровых Систем';
			case 'btn-architecture-design':
				return 'Институт Архитектуры и Дизайна';
			case 'btn-civil-transport':
				return 'Институт Инженеров Строительства и Транспорта';
			default:
				return '';
		}
	}

	onMount(loadRecentlyViewed);

	recentlyViewedStore.subscribe((value) => {
		recentlyViewed = value;
	});
</script>

<section class="mt-8 rounded-2xl bg-slate-800 p-6">
	<h2 class="mb-4 text-2xl font-semibold text-white">👀 Вы недавно смотрели</h2>
	<div class="space-y-4">
		{#each recentlyViewed as item}
			<div class="rounded-2xl bg-slate-700 text-white">
				<div class="flex items-center justify-between rounded-2xl bg-gray-700 p-4">
					<div>
						<h3 class="md:text:xl text-sm font-bold">{item.discipline}</h3>
						<p class="text-sm text-slate-400">{getInstituteName(item.institute)}</p>
						<p>Средний балл: {item.stats.average.toFixed(2)}</p>
						<p>
							Оценок: {item.stats.count5 +
								item.stats.count4 +
								item.stats.count3 +
								item.stats.count2}
						</p>
					</div>
					<button
						class="recently-viewed-btn flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-1 text-white shadow-md transition-all hover:bg-blue-600"
						on:click={() => dispatch('viewAgain', { subject: item.discipline })}
					>
						<span class="hidden sm:inline">Посмотреть снова</span>
						<svg
							style="color: white"
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							fill="currentColor"
							class="bi bi-arrow-left-circle-fill"
							viewBox="0 0 16 16"
						>
							<path
								d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.5 7.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5z"
								fill="white"
							></path>
						</svg>
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
		box-shadow: 0 2px 8px 0 rgba(30, 64, 175, 0.1);
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
