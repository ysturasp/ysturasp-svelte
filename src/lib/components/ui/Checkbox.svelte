<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let checked = false;
	export let label = '';
	export let disabled = false;
	export let id: string | undefined = undefined;
	export let labelClass = 'text-slate-400';

	const dispatch = createEventDispatcher<{
		change: boolean;
	}>();

	const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

	function handleChange(event: Event) {
		if (disabled) return;
		const target = event.target as HTMLInputElement;
		checked = target.checked;
		dispatch('change', checked);
	}
</script>

<label class="inline-flex cursor-pointer items-center" class:opacity-50={disabled}>
	<input
		type="checkbox"
		id={checkboxId}
		bind:checked
		{disabled}
		on:change={handleChange}
		class="peer hidden"
	/>
	<div
		class="mr-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-slate-500 transition-colors peer-checked:border-blue-500"
	>
		<svg
			class="h-3 w-3 text-blue-500 {checked ? 'opacity-100' : 'opacity-0'}"
			viewBox="0 0 20 20"
			fill="currentColor"
		>
			<path
				fill-rule="evenodd"
				d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
				clip-rule="evenodd"
			/>
		</svg>
	</div>
	<span class={labelClass}>
		{#if label}
			<slot>{label}</slot>
		{:else}
			<slot />
		{/if}
	</span>
</label>
