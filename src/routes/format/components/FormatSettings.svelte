<script lang="ts">
	import type { FormatParams } from '../api';
	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	const dispatch = createEventDispatcher<{
		change: FormatParams;
	}>();

	export let isOpen = false;
	export let formatParams: FormatParams = {
		margins: {
			top: 2,
			right: 1,
			bottom: 2,
			left: 3
		},
		text: {
			font: 'Times New Roman',
			size: 14,
			indent: 1.25,
			lineHeight: 1
		},
		headers: {
			h1: { spacingBefore: 0, spacingAfter: 36 },
			h2: { spacingBefore: 24, spacingAfter: 24 },
			h3: { spacingBefore: 12, spacingAfter: 0 }
		}
	};

	function handleChange() {
		dispatch('change', formatParams);
	}
</script>

<div class="rounded-xl bg-slate-700/30 transition-all hover:bg-slate-700/60">
	<button
		class="flex w-full items-center justify-between p-4"
		on:click={() => (isOpen = !isOpen)}
	>
		<div class="flex flex-col">
			<div class="flex items-center gap-2">
				<span class="text-2xl">⚙️</span>
				<span class="text-base font-medium text-white md:text-lg"
					>Настройки форматирования</span
				>
			</div>
			<p class="text-xs text-slate-400">Можно выбрать свои параметры страницы</p>
		</div>
		<svg
			class="h-5 w-5 transform text-slate-400 transition-transform duration-200 {isOpen
				? 'rotate-180'
				: ''}"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<polyline points="6 9 12 15 18 9" />
		</svg>
	</button>

	{#if isOpen}
		<div
			class="border-t border-slate-600/50 p-4"
			transition:slide={{ duration: 300, easing: quintOut }}
		>
			<div class="grid gap-3 md:grid-cols-3">
				<div class="space-y-3">
					<h3 class="text-base font-medium text-slate-300">Поля страницы (см)</h3>
					<div class="grid grid-cols-2">
						<label class="flex items-center justify-between gap-3 rounded p-2">
							<span class="text-sm text-slate-300">Верх</span>
							<input
								type="number"
								bind:value={formatParams.margins.top}
								on:change={handleChange}
								min="0"
								max="10"
								step="0.1"
								class="w-16 rounded-md bg-slate-600/50 px-2 py-1 text-right text-sm text-white"
							/>
						</label>
						<label class="flex items-center justify-between gap-3 rounded p-2">
							<span class="text-sm text-slate-300">Низ</span>
							<input
								type="number"
								bind:value={formatParams.margins.bottom}
								on:change={handleChange}
								min="0"
								max="10"
								step="0.1"
								class="w-16 rounded-md bg-slate-600/50 px-2 py-1 text-right text-sm text-white"
							/>
						</label>
						<label class="flex items-center justify-between gap-3 rounded p-2">
							<span class="text-sm text-slate-300">Лево</span>
							<input
								type="number"
								bind:value={formatParams.margins.left}
								on:change={handleChange}
								min="0"
								max="10"
								step="0.1"
								class="w-16 rounded-md bg-slate-600/50 px-2 py-1 text-right text-sm text-white"
							/>
						</label>
						<label class="flex items-center justify-between gap-3 rounded p-2">
							<span class="text-sm text-slate-300">Право</span>
							<input
								type="number"
								bind:value={formatParams.margins.right}
								on:change={handleChange}
								min="0"
								max="10"
								step="0.1"
								class="w-16 rounded-md bg-slate-600/50 px-2 py-1 text-right text-sm text-white"
							/>
						</label>
					</div>
				</div>

				<div class="space-y-3">
					<h3 class="text-base font-medium text-slate-300">Текст</h3>
					<div class="grid">
						<label class="flex items-center justify-between gap-3 rounded p-2">
							<span class="text-sm text-slate-300">Шрифт</span>
							<select
								bind:value={formatParams.text.font}
								on:change={handleChange}
								class="w-40 rounded-md bg-slate-600/50 px-2 py-1 text-sm text-white"
							>
								<option value="Times New Roman">Times New Roman</option>
								<option value="Arial">Arial</option>
							</select>
						</label>
						<div class="grid grid-cols-2">
							<label class="flex items-center justify-between gap-3 rounded p-2">
								<span class="text-sm text-slate-300">Размер</span>
								<input
									type="number"
									bind:value={formatParams.text.size}
									on:change={handleChange}
									min="8"
									max="72"
									class="w-16 rounded-md bg-slate-600/50 px-2 py-1 text-right text-sm text-white"
								/>
							</label>
							<label class="flex items-center justify-between gap-3 rounded p-2">
								<span class="text-sm text-slate-300">Отступ</span>
								<input
									type="number"
									bind:value={formatParams.text.indent}
									on:change={handleChange}
									min="0"
									max="5"
									step="0.05"
									class="w-16 rounded-md bg-slate-600/50 px-2 py-1 text-right text-sm text-white"
								/>
							</label>
						</div>
						<label class="flex items-center justify-between gap-3 rounded p-2">
							<span class="text-sm text-slate-300">Интервал</span>
							<select
								bind:value={formatParams.text.lineHeight}
								on:change={handleChange}
								class="w-40 rounded-md bg-slate-600/50 px-2 py-1 text-sm text-white"
							>
								<option value={1}>Одинарный</option>
								<option value={1.5}>Полуторный</option>
								<option value={2}>Двойной</option>
							</select>
						</label>
					</div>
				</div>

				<div class="space-y-3">
					<h3 class="text-base font-medium text-slate-300">Заголовки (пт)</h3>
					<div class="grid gap-4">
						<div class="grid grid-cols-3 gap-3">
							<div class="space-y-1">
								<div class="text-center text-sm text-slate-300">Уровень 1</div>
								<div class="grid gap-1">
									<input
										type="number"
										bind:value={formatParams.headers.h1.spacingBefore}
										on:change={handleChange}
										min="0"
										max="72"
										class="w-full rounded bg-slate-600/50 px-2 py-1 text-center text-sm text-white"
										title="Отступ до"
									/>
									<div class="text-center text-xs text-slate-400">до</div>
									<input
										type="number"
										bind:value={formatParams.headers.h1.spacingAfter}
										on:change={handleChange}
										min="0"
										max="72"
										class="w-full rounded bg-slate-600/50 px-2 py-1 text-center text-sm text-white"
										title="Отступ после"
									/>
									<div class="text-center text-xs text-slate-400">после</div>
								</div>
							</div>
							<div class="space-y-1">
								<div class="text-center text-sm text-slate-300">Уровень 2</div>
								<div class="grid gap-1">
									<input
										type="number"
										bind:value={formatParams.headers.h2.spacingBefore}
										on:change={handleChange}
										min="0"
										max="72"
										class="w-full rounded bg-slate-600/50 px-2 py-1 text-center text-sm text-white"
										title="Отступ до"
									/>
									<div class="text-center text-xs text-slate-400">до</div>
									<input
										type="number"
										bind:value={formatParams.headers.h2.spacingAfter}
										on:change={handleChange}
										min="0"
										max="72"
										class="w-full rounded bg-slate-600/50 px-2 py-1 text-center text-sm text-white"
										title="Отступ после"
									/>
									<div class="text-center text-xs text-slate-400">после</div>
								</div>
							</div>
							<div class="space-y-1">
								<div class="text-center text-sm text-slate-300">Уровень 3</div>
								<div class="grid gap-1">
									<input
										type="number"
										bind:value={formatParams.headers.h3.spacingBefore}
										on:change={handleChange}
										min="0"
										max="72"
										class="w-full rounded bg-slate-600/50 px-2 py-1 text-center text-sm text-white"
										title="Отступ до"
									/>
									<div class="text-center text-xs text-slate-400">до</div>
									<input
										type="number"
										bind:value={formatParams.headers.h3.spacingAfter}
										on:change={handleChange}
										min="0"
										max="72"
										class="w-full rounded bg-slate-600/50 px-2 py-1 text-center text-sm text-white"
										title="Отступ после"
									/>
									<div class="text-center text-xs text-slate-400">после</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
