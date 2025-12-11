<script lang="ts">
	import type { FormatParams } from '../api';
	import { defaultFormatParams } from '../constants';
	import { createEventDispatcher } from 'svelte';
	import { slide, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import CustomSelect from '$lib/components/ui/CustomSelect.svelte';

	const dispatch = createEventDispatcher<{
		change: FormatParams;
	}>();

	export let isOpen = false;
	export let formatParams: FormatParams;

	let localParams: FormatParams;
	$: localParams = formatParams;
	$: hasChanges = JSON.stringify(localParams) !== JSON.stringify(defaultFormatParams);

	const marginFields = [
		{ key: 'top', label: 'Верх' },
		{ key: 'bottom', label: 'Низ' },
		{ key: 'left', label: 'Лево' },
		{ key: 'right', label: 'Право' }
	] as const;

	const textToggles = [
		{ key: 'removeBold', label: 'Убрать жирный' },
		{ key: 'removeItalic', label: 'Убрать курсив' },
		{ key: 'removeUnderline', label: 'Убрать подчеркивание' }
	] as const;

	const headerLevels = [
		{ key: 'h1', label: 'Уровень 1' },
		{ key: 'h2', label: 'Уровень 2' },
		{ key: 'h3', label: 'Уровень 3' }
	] as const;

	const fontOptions = [
		{ id: 'Times New Roman', label: 'Times New Roman' },
		{ id: 'Arial', label: 'Arial' }
	];

	const lineHeightOptions = [
		{ id: 1, label: 'Одинарный' },
		{ id: 1.5, label: 'Полуторный' },
		{ id: 2, label: 'Двойной' }
	];

	function handleChange() {
		dispatch('change', localParams);
	}

	function resetParams() {
		localParams = JSON.parse(JSON.stringify(defaultFormatParams));
		handleChange();
	}

	function updateText(field: keyof FormatParams['text'], value: number | string | boolean) {
		localParams = {
			...localParams,
			text: { ...localParams.text, [field]: value }
		};
		handleChange();
	}
</script>

<div
	class="relative z-20 rounded-2xl border border-slate-800/40 bg-slate-700/30 backdrop-blur transition-all"
>
	<div class="flex items-center justify-between p-4">
		<button class="flex-1 text-left" on:click={() => (isOpen = !isOpen)}>
			<div class="flex flex-col">
				<div class="flex items-center gap-2">
					<span class="text-2xl">⚙️</span>
					<span class="text-base font-medium text-white md:text-lg"
						>Настройки форматирования</span
					>
				</div>
				<p class="text-xs text-slate-400">Можно выбрать свои параметры страницы</p>
			</div>
		</button>
		<div class="flex items-center gap-2">
			{#if hasChanges}
				<button
					class="group hidden h-8 w-8 items-center justify-center rounded-full bg-slate-600/50 text-slate-400 transition-all hover:bg-red-500/20 hover:text-red-400 md:flex"
					title="Сбросить настройки"
					aria-label="Сбросить настройки"
					on:click={resetParams}
					in:fade={{ duration: 150 }}
					out:fade={{ duration: 150 }}
				>
					<svg
						class="h-4 w-4 transition-transform group-hover:rotate-[-360deg] group-active:scale-90"
						style="transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
						<path d="M3 3v5h5" />
					</svg>
				</button>
			{/if}
			<button
				class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-600/50 text-slate-400 transition-all hover:bg-blue-500/20 hover:text-blue-400"
				on:click={() => (isOpen = !isOpen)}
				aria-label={isOpen ? 'Свернуть настройки' : 'Развернуть настройки'}
			>
				<svg
					class="h-4 w-4 transform transition-transform duration-200 {isOpen
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
		</div>
	</div>

	{#if isOpen}
		<div
			class="border-t border-slate-600/50 p-4"
			transition:slide={{ duration: 300, easing: quintOut }}
		>
			<div class="overflow-hidden">
				{#if hasChanges}
					<div transition:slide={{ duration: 200, easing: quintOut }}>
						<button
							class="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600/50 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 transition hover:border-red-400/60 hover:bg-red-500/10 hover:text-red-300 md:hidden"
							on:click={resetParams}
						>
							<svg
								class="h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
								<path d="M3 3v5h5" />
							</svg>
							<span>Сбросить настройки</span>
						</button>
					</div>
				{/if}
			</div>
			<div class="flex flex-col gap-3">
				<div class="grid gap-3 lg:grid-cols-2">
					<section class="pb-2">
						<div class="flex items-center justify-between text-slate-100">
							<h2 class="text-base font-semibold tracking-tight text-slate-100">
								Поля страницы
							</h2>
							<span
								class="rounded-full border border-slate-600/50 px-2 py-0.5 text-[11px] text-slate-400"
								>см</span
							>
						</div>
						<div class="grid gap-3 sm:grid-cols-2">
							{#each marginFields as field}
								<div class="flex flex-col gap-2">
									<span class="text-sm font-medium text-slate-200"
										>{field.label}</span
									>
									<div
										class="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5"
									>
										<button
											type="button"
											class="flex h-9 w-9 items-center justify-center rounded-md border border-blue-500/70 bg-blue-900/40 text-lg text-slate-50 transition hover:border-blue-500 hover:text-blue-300 active:translate-y-px"
											on:click={() => {
												const next = Math.max(
													0,
													Number(
														(localParams.margins[field.key] || 0) - 0.1
													)
												);
												localParams.margins[field.key] = Number(
													next.toFixed(1)
												);
												handleChange();
											}}>−</button
										>
										<input
											type="number"
											bind:value={localParams.margins[field.key]}
											on:change={handleChange}
											min="0"
											max="10"
											step="0.1"
											inputmode="decimal"
											class="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-center text-sm text-slate-100 transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/60"
										/>
										<button
											type="button"
											class="flex h-9 w-9 items-center justify-center rounded-md border border-blue-500/70 bg-blue-900/40 text-lg text-slate-50 transition hover:border-blue-500 hover:text-blue-300 active:translate-y-px"
											on:click={() => {
												const next =
													Number(localParams.margins[field.key] || 0) +
													0.1;
												localParams.margins[field.key] = Number(
													next.toFixed(1)
												);
												handleChange();
											}}>+</button
										>
									</div>
								</div>
							{/each}
						</div>
					</section>

					<section
						class="border-t border-slate-600/60 pt-3 pb-2 lg:ml-2 lg:border-0 lg:border-l lg:border-slate-600/60 lg:pt-0 lg:pl-4"
					>
						<div class="flex items-center justify-between text-slate-100">
							<h2 class="text-base font-semibold tracking-tight text-slate-100">
								Заголовки
							</h2>
							<span
								class="rounded-full border border-slate-600/50 px-2 py-0.5 text-[11px] text-slate-400"
								>пт</span
							>
						</div>
						<div class="grid gap-3 sm:grid-cols-3">
							{#each headerLevels as level}
								<div class="flex flex-col gap-2">
									<span class="text-sm font-medium text-slate-200"
										>{level.label}</span
									>
									<div
										class="flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-800 p-3"
									>
										<div class="flex items-center gap-2">
											<span
												class="text-xs tracking-wide text-slate-400 uppercase"
												>до</span
											>
											<input
												type="number"
												bind:value={
													localParams.headers[level.key].spacingBefore
												}
												on:change={(event) => {
													localParams.headers[level.key].spacingBefore =
														Number(
															(event.target as HTMLInputElement).value
														);
													handleChange();
												}}
												min="0"
												max="72"
												class="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-center text-sm text-slate-100 transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/60"
											/>
										</div>
										<div class="flex items-center gap-2">
											<span
												class="text-xs tracking-wide text-slate-400 uppercase"
												>после</span
											>
											<input
												type="number"
												bind:value={
													localParams.headers[level.key].spacingAfter
												}
												on:change={(event) => {
													localParams.headers[level.key].spacingAfter =
														Number(
															(event.target as HTMLInputElement).value
														);
													handleChange();
												}}
												min="0"
												max="72"
												class="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-center text-sm text-slate-100 transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/60"
											/>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</section>
				</div>

				<div class="h-px w-full bg-slate-600/60"></div>

				<section>
					<div class="flex items-center justify-between text-slate-100">
						<h2 class="text-base font-semibold tracking-tight text-slate-100">Текст</h2>
					</div>
					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-2">
							<span class="text-sm font-medium text-slate-200">Шрифт</span>
							<CustomSelect
								items={fontOptions}
								selectedId={localParams.text.font}
								width="100%"
								on:select={({ detail }) => updateText('font', detail.id as string)}
							/>
						</div>

						<div class="grid gap-3 sm:grid-cols-2">
							<div class="flex flex-col gap-2">
								<span class="text-sm font-medium text-slate-200">Размер</span>
								<div
									class="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5"
								>
									<button
										type="button"
										class="flex h-9 w-9 items-center justify-center rounded-md border border-blue-500/70 bg-blue-900/40 text-lg text-slate-50 transition hover:border-blue-500 hover:text-blue-300 active:translate-y-px"
										on:click={() => {
											const next = Math.max(
												8,
												Number(localParams.text.size || 0) - 1
											);
											updateText('size', Number(next.toFixed(0)));
										}}>−</button
									>
									<input
										type="number"
										bind:value={localParams.text.size}
										on:change={(event) =>
											updateText(
												'size',
												Number((event.target as HTMLInputElement).value)
											)}
										min="8"
										max="72"
										class="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-center text-sm text-slate-100 transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/60"
									/>
									<button
										type="button"
										class="flex h-9 w-9 items-center justify-center rounded-md border border-blue-500/70 bg-blue-900/40 text-lg text-slate-50 transition hover:border-blue-500 hover:text-blue-300 active:translate-y-px"
										on:click={() => {
											const next = Math.min(
												72,
												Number(localParams.text.size || 0) + 1
											);
											updateText('size', Number(next.toFixed(0)));
										}}>+</button
									>
								</div>
							</div>
							<div class="flex flex-col gap-2">
								<span class="text-sm font-medium text-slate-200">Отступ</span>
								<div
									class="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5"
								>
									<button
										type="button"
										class="flex h-9 w-9 items-center justify-center rounded-md border border-blue-500/70 bg-blue-900/40 text-lg text-slate-50 transition hover:border-blue-500 hover:text-blue-300 active:translate-y-px"
										on:click={() => {
											const next = Math.max(
												0,
												Number((localParams.text.indent || 0) - 0.05)
											);
											updateText('indent', Number(next.toFixed(2)));
										}}>−</button
									>
									<input
										type="number"
										bind:value={localParams.text.indent}
										on:change={(event) =>
											updateText(
												'indent',
												Number((event.target as HTMLInputElement).value)
											)}
										min="0"
										max="5"
										step="0.05"
										inputmode="decimal"
										class="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-center text-sm text-slate-100 transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/60"
									/>
									<button
										type="button"
										class="flex h-9 w-9 items-center justify-center rounded-md border border-blue-500/70 bg-blue-900/40 text-lg text-slate-50 transition hover:border-blue-500 hover:text-blue-300 active:translate-y-px"
										on:click={() => {
											const next = Math.min(
												5,
												Number(localParams.text.indent || 0) + 0.05
											);
											updateText('indent', Number(next.toFixed(2)));
										}}>+</button
									>
								</div>
							</div>
						</div>

						<div class="flex flex-col gap-2">
							<span class="text-sm font-medium text-slate-200">Интервал</span>
							<CustomSelect
								items={lineHeightOptions}
								selectedId={localParams.text.lineHeight}
								width="100%"
								on:select={({ detail }) =>
									updateText('lineHeight', Number(detail.id))}
							/>
						</div>

						<div class="grid gap-2 sm:grid-cols-3">
							{#each textToggles as toggle}
								<button
									type="button"
									class={`flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm transition active:translate-y-px active:opacity-90 ${
										localParams.text[toggle.key]
											? 'border border-blue-500/70 bg-blue-900/40 text-slate-50 shadow-[0_0_0_1px_rgba(59,130,246,0.35)]'
											: 'border border-slate-700/60 bg-slate-800 text-slate-200 hover:border-blue-500/60 hover:text-slate-50'
									}`}
									on:click={() =>
										updateText(toggle.key, !localParams.text[toggle.key])}
									aria-pressed={localParams.text[toggle.key]}
								>
									<span>{toggle.label}</span>
								</button>
							{/each}
						</div>
					</div>
				</section>
			</div>
		</div>
	{/if}
</div>
