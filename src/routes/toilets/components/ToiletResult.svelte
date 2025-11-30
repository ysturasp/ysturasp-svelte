<script lang="ts">
	import type { ToiletSearchResult } from '../types';
	import { fade } from 'svelte/transition';

	export let result: ToiletSearchResult | null = null;

	$: hasResult = result && result.toilet;
	$: hasAlternatives =
		result && result.alternativeToilets && result.alternativeToilets.length > 0;

	function getDistanceLabel(distance: number, userFloor?: number, toiletFloor?: number): string {
		if (distance === 0) {
			return 'На вашем этаже';
		}
		if (distance < 0.5) {
			return 'В той же секции';
		}
		if (distance < 1) {
			return 'В соседней секции';
		}

		if (userFloor && toiletFloor) {
			const diff = toiletFloor - userFloor;
			const absDiff = Math.abs(diff);
			const direction = diff > 0 ? 'выше' : 'ниже';

			if (absDiff === 1) {
				return `На 1 этаж ${direction}`;
			}
			return `На ${absDiff} этажа ${direction}`;
		}

		const floorDiff = Math.ceil(distance);
		if (floorDiff === 1) {
			return 'На 1 этаж выше/ниже';
		}
		return `На ${floorDiff} этажа выше/ниже`;
	}
</script>

{#if result}
	<div class="mt-4" transition:fade={{ duration: 300 }}>
		{#if hasResult}
			<div class="rounded-2xl bg-slate-800">
				<div class="mb-2 flex items-start gap-3">
					<div class="flex-1">
						<h3 class="mb-1 text-xl font-semibold text-white">Туалет найден</h3>
						<p class="text-sm text-slate-400">{result.message}</p>
					</div>
				</div>

				<div class="space-y-1 rounded-xl bg-slate-700/50 p-3 md:p-4">
					<div class="flex items-center justify-between">
						<span class="text-slate-400">Этаж:</span>
						<span class="font-semibold text-white">{result.toilet!.floor}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-slate-400">Секция:</span>
						<span class="font-semibold text-white">{result.toilet!.section}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-slate-400">Расположение:</span>
						<span class="font-semibold text-white">{result.toilet!.location}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-slate-400">Расстояние:</span>
						<span class="font-semibold text-green-400"
							>{getDistanceLabel(
								result.distance,
								result.userFloor,
								result.toilet!.floor
							)}</span
						>
					</div>
				</div>

				{#if hasAlternatives}
					<div class="mt-4">
						<h4 class="mb-2 text-sm font-semibold text-slate-300">
							Альтернативные варианты:
						</h4>
						<div class="space-y-2">
							{#each result.alternativeToilets as alternative}
								<div class="rounded-lg border border-slate-600 bg-slate-700/30 p-3">
									<div class="flex items-center justify-between text-sm">
										<span class="text-slate-400">
											{alternative.floor} этаж, секция {alternative.section}
										</span>
										<span class="text-slate-300">{alternative.location}</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div class="rounded-2xl bg-slate-800">
				<div class="flex items-start gap-3">
					<div
						class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-600/20"
					>
						<svg
							class="h-6 w-6 text-red-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<div class="flex-1">
						<h3 class="mb-1 text-xl font-semibold text-white">Туалет не найден</h3>
						<p class="text-sm text-slate-400">{result.message}</p>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}
