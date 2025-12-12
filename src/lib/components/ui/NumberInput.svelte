<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let value: number = 0;
	export let min: number = 0;
	export let max: number = 100;
	export let step: number = 1;
	export let inputmode: 'decimal' | 'numeric' | undefined = undefined;
	export let disabled = false;
	export let decimals = 0;

	const dispatch = createEventDispatcher<{
		change: number;
	}>();

	function handleDecrease() {
		if (disabled) return;
		const next = Math.max(min, Number((value || 0) - step));
		const newValue = Number(next.toFixed(decimals));
		value = newValue;
		dispatch('change', newValue);
	}

	function handleIncrease() {
		if (disabled) return;
		const next = Math.min(max, Number((value || 0) + step));
		const newValue = Number(next.toFixed(decimals));
		value = newValue;
		dispatch('change', newValue);
	}

	function handleInputChange(event: Event) {
		if (disabled) return;
		const inputValue = Number((event.target as HTMLInputElement).value);
		const clampedValue = Math.max(min, Math.min(max, inputValue));
		const newValue = Number(clampedValue.toFixed(decimals));
		value = newValue;
		dispatch('change', newValue);
	}
</script>

<div class="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5">
	<button
		type="button"
		class="flex h-7 w-9 items-center justify-center rounded-md border border-blue-500/70 bg-blue-900/40 text-slate-50 transition hover:border-blue-500 hover:text-blue-300 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
		on:click={handleDecrease}
		{disabled}
		aria-label="Уменьшить"
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
			<line x1="5" y1="12" x2="19" y2="12" />
		</svg>
	</button>
	<input
		type="number"
		bind:value
		on:change={handleInputChange}
		{min}
		{max}
		{step}
		{inputmode}
		{disabled}
		class="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-center text-sm text-slate-100 transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/60 disabled:cursor-not-allowed disabled:opacity-50"
	/>
	<button
		type="button"
		class="flex h-7 w-9 items-center justify-center rounded-md border border-blue-500/70 bg-blue-900/40 text-slate-50 transition hover:border-blue-500 hover:text-blue-300 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
		on:click={handleIncrease}
		{disabled}
		aria-label="Увеличить"
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
			<line x1="12" y1="5" x2="12" y2="19" />
			<line x1="5" y1="12" x2="19" y2="12" />
		</svg>
	</button>
</div>
