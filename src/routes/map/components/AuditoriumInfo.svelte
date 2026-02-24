<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { Auditorium } from '../types';

	export let auditorium: Auditorium | null = null;
	export let onClose: () => void = () => {};
	export let status: boolean | null = null;
	export let onSelectAsStart: (auditorium: Auditorium | null) => void = () => {};
	export let onSelectAsEnd: (auditorium: Auditorium | null) => void = () => {};
	export let isStartSelected = false;
	export let isEndSelected = false;

	let panelEl: HTMLElement;
	let overlayEl: HTMLElement;
	let isClosing = false;
	let shouldRender = false;
	let canCloseViaOverlay = false;
	let overlayOpenTimeout: ReturnType<typeof setTimeout>;

	function getScheduleLink(auditorium: Auditorium | null): string {
		if (!auditorium) return '/raspaudience';
		return `/raspaudience?audience=${auditorium.name}`;
	}

	function closePanel() {
		if (!isClosing && shouldRender) {
			isClosing = true;
		}
	}

	function handleAnimationEnd() {
		if (isClosing) {
			shouldRender = false;
			isClosing = false;
			onClose();
		}
	}

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === overlayEl && canCloseViaOverlay) {
			closePanel();
		}
	}

	function handleSelectStart() {
		const selecting = !isStartSelected;
		onSelectAsStart(selecting ? auditorium : null);
		if (selecting) closePanel();
	}

	function handleSelectEnd() {
		const selecting = !isEndSelected;
		onSelectAsEnd(selecting ? auditorium : null);
		if (selecting) closePanel();
	}

	$: {
		if (auditorium && !shouldRender) {
			shouldRender = true;
			isClosing = false;
			canCloseViaOverlay = false;
			if (overlayOpenTimeout) clearTimeout(overlayOpenTimeout);
			overlayOpenTimeout = setTimeout(() => {
				canCloseViaOverlay = true;
			}, 400);
		} else if (!auditorium && shouldRender && !isClosing) {
			closePanel();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (shouldRender && e.key === 'Escape') {
			closePanel();
		}
	}

	onMount(() => {
		if (browser) document.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		if (browser) document.removeEventListener('keydown', handleKeydown);
		if (overlayOpenTimeout) clearTimeout(overlayOpenTimeout);
	});
</script>

{#if shouldRender && auditorium}
	<div
		bind:this={overlayEl}
		class="fixed inset-0 z-[39] bg-black/40 {isClosing
			? 'anim-overlay-out'
			: 'anim-overlay-in'} {!canCloseViaOverlay ? 'pointer-events-none' : ''}"
		on:click={handleOverlayClick}
		role="presentation"
	></div>

	<div
		class="fixed top-[5.5rem] right-0 left-0 z-40 w-full max-w-none origin-top px-3 md:top-[6.5rem] md:right-4 md:left-auto md:max-w-md md:origin-top-right {isClosing
			? 'anim-panel-out'
			: 'anim-panel-in'}"
		bind:this={panelEl}
		on:animationend={handleAnimationEnd}
	>
		<div
			class="max-h-[65vh] overflow-y-auto rounded-2xl bg-slate-900/95 p-4 shadow-xl ring-1 ring-blue-500/30 {!canCloseViaOverlay
				? 'pointer-events-none'
				: ''}"
		>
			<div class="mb-3 flex items-center justify-between gap-3">
				<h3 class="text-lg font-semibold text-white">Аудитория {auditorium.name}</h3>
				<button
					on:click={closePanel}
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

				{#if status !== null}
					<div
						class="flex items-center justify-between rounded-xl bg-slate-800/80 px-3 py-2"
					>
						<div>
							<div class="text-sm text-gray-400">Занятость</div>
							<div class="text-sm font-medium text-white">
								{#if status}
									Свободна
								{:else}
									Скорее всего занята
								{/if}
							</div>
						</div>
						<div
							class={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
								status === true
									? 'bg-emerald-500/15'
									: status === false
										? 'bg-rose-500/15'
										: ''
							}`}
						>
							<div
								class={`h-2.5 w-2.5 rounded-full ${
									status === true
										? 'bg-emerald-400'
										: status === false
											? 'bg-rose-400'
											: ''
								}`}
							></div>
							<span class={status === false ? 'text-rose-300' : 'text-emerald-300'}>
								{status ? 'Свободно' : 'Занято'}
							</span>
						</div>
					</div>
				{/if}

				<div class="grid grid-cols-2 gap-2 pt-1">
					<button
						type="button"
						on:click={handleSelectStart}
						class={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ring-1 transition-all hover:bg-emerald-500/25 hover:text-emerald-100 ${
							isStartSelected
								? 'bg-emerald-500/25 text-emerald-100 ring-emerald-400/60'
								: 'bg-emerald-500/15 text-emerald-300 ring-transparent'
						}`}
					>
						<span class="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
						<span>Отсюда</span>
					</button>

					<button
						type="button"
						on:click={handleSelectEnd}
						class={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ring-1 transition-all hover:bg-amber-500/25 hover:text-amber-100 ${
							isEndSelected
								? 'bg-amber-500/25 text-amber-100 ring-amber-400/60'
								: 'bg-amber-500/15 text-amber-300 ring-transparent'
						}`}
					>
						<span class="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
						<span>Сюда</span>
					</button>
				</div>

				<div class="pt-3">
					<a
						href={getScheduleLink(auditorium)}
						class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500/15 px-3 py-2 text-sm font-medium text-blue-300 transition-all hover:bg-blue-500/25 hover:text-blue-50"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							></path>
						</svg>
						<span>Расписание</span>
					</a>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.anim-overlay-in {
		animation: overlayIn 0.3s ease-out forwards;
	}
	.anim-overlay-out {
		animation: overlayOut 0.2s ease-out forwards;
	}
	.anim-panel-in {
		animation: panelIn 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
	}
	.anim-panel-out {
		animation: panelOut 0.2s ease-out forwards;
	}
	@keyframes overlayIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes overlayOut {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}
	@keyframes panelIn {
		from {
			opacity: 0;
			transform: scale(0.9) translateY(-8px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}
	@keyframes panelOut {
		from {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
		to {
			opacity: 0;
			transform: scale(0.9) translateY(-8px);
		}
	}
</style>
