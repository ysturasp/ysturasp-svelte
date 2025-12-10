<script lang="ts">
	import type { ToiletSearchResult } from '../types';
	import { fade } from 'svelte/transition';

	export let result: ToiletSearchResult | null = null;

	$: hasResult = result && result.toilet;
	$: hasAlternatives =
		result && result.alternativeToilets && result.alternativeToilets.length > 0;

	function getDistanceLabel(distance: number, userFloor?: number, toiletFloor?: number): string {
		if (distance === 0) {
			return 'В вашей секции';
		}
		if (distance < 1) {
			return 'В соседней секции';
		}

		if (userFloor && toiletFloor) {
			const diff = toiletFloor - userFloor;
			const absDiff = Math.abs(diff);
			if (absDiff === 0) {
				return 'На вашем этаже';
			}
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
			<div class="space-y-1 rounded-2xl bg-slate-800 p-1 text-center">
				<div
					class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-600/20"
				>
					<svg
						class="h-7 w-7 text-green-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				</div>
				<h3 class="text-xl font-semibold text-white">Туалет найден</h3>
				<p class="text-sm text-slate-300">{result.message}</p>
				<p class="text-xs text-slate-400">
					{getDistanceLabel(result.distance, result.userFloor, result.toilet!.floor)}
				</p>
				{#if hasAlternatives}
					<div class="space-y-1 text-xs text-slate-400">
						<p class="font-semibold text-slate-300">Альтернативы:</p>
						{#each result.alternativeToilets as alternative}
							<p>
								{alternative.floor} этаж, секция {alternative.section} — {alternative.location}
							</p>
						{/each}
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
						<h3 class="mb-1 text-xl font-semibold text-white">
							{#if result.error === 'format'}
								Аудитория введена некорректно
							{:else if result.error === 'out_of_range'}
								Такой аудитории не существует
							{:else}
								Туалет не найден
							{/if}
						</h3>
						<p class="text-sm text-slate-400">{result.message}</p>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}
