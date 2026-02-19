<script lang="ts">
	import type { Auditorium } from '../types';

	export let auditorium: Auditorium | null = null;
	export let onClose: () => void = () => {};

	function getScheduleLink(auditorium: Auditorium): string {
		return `/raspaudience?audience=${auditorium.name}`;
	}
</script>

{#if auditorium}
	<div
		class="fixed top-20 right-4 z-40 w-full max-w-sm rounded-2xl bg-slate-900/95 p-4 shadow-lg ring-1 ring-blue-500/30 backdrop-blur-sm"
	>
		<div class="mb-3 flex items-center justify-between">
			<h3 class="text-lg font-semibold text-white">Аудитория {auditorium.name}</h3>
			<button
				on:click={onClose}
				class="text-gray-400 transition-colors hover:text-white"
				aria-label="Закрыть"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					></path>
				</svg>
			</button>
		</div>

		<div class="space-y-3">
			<div>
				<span class="text-sm text-gray-400">Этаж:</span>
				<span class="ml-2 text-white">{auditorium.floor}</span>
			</div>

			<div>
				<span class="text-sm text-gray-400">Секция:</span>
				<span class="ml-2 text-white">{auditorium.section}</span>
			</div>

			{#if auditorium.capacity}
				<div>
					<span class="text-sm text-gray-400">Вместимость:</span>
					<span class="ml-2 text-white">{auditorium.capacity} мест</span>
				</div>
			{/if}

			{#if auditorium.currentOccupancy !== undefined}
				<div>
					<span class="text-sm text-gray-400">Занятость сейчас:</span>
					<span class="ml-2 text-white">
						{auditorium.currentOccupancy} / {auditorium.capacity || '?'}
					</span>
					<div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-700">
						<div
							class="h-full bg-blue-500 transition-all"
							style="width: {auditorium.capacity
								? (auditorium.currentOccupancy / auditorium.capacity) * 100
								: 0}%"
						></div>
					</div>
				</div>
			{/if}

			<div class="pt-2">
				<a
					href={getScheduleLink(auditorium)}
					class="inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2 text-sm text-blue-400 transition-all hover:bg-blue-500/20"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						></path>
					</svg>
					Расписание
				</a>
			</div>
		</div>
	</div>
{/if}
