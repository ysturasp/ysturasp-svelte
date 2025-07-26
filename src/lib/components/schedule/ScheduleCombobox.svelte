<script lang="ts">
	import { onMount } from 'svelte';
	import CopyLinkButton from '$lib/components/ui/CopyLinkButton.svelte';
	import { scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	interface Item {
		id: string;
		displayValue: string;
	}

	export let items: Item[] = [];
	export let selectedId = '';
	export let onSubmit: () => void;
	export let placeholder = 'Выберите значение';
	export let isLoading = false;
	export let paramName = '';
	export let copyLinkMessage = '';
	export let error = false;

	let searchQuery = '';
	let showOptions = false;
	let filteredItems: Item[] = [];
	let overlay: HTMLDivElement;
	let inputElement: HTMLInputElement;

	$: {
		filteredItems = items.filter((item) =>
			item.displayValue.toLowerCase().includes(searchQuery.toLowerCase())
		);
	}

	function closeDropdown() {
		showOptions = false;
		overlay.classList.add('hidden');
		inputElement?.blur();
	}

	function selectItem(item: Item) {
		selectedId = item.id;
		searchQuery = item.displayValue;
		closeDropdown();
	}

	function clearSelection() {
		selectedId = '';
		searchQuery = '';
	}

	function handleFocus() {
		showOptions = true;
		overlay.classList.remove('hidden');
		setTimeout(() => {
			if (inputElement) {
				window.scrollTo({
					top: inputElement.getBoundingClientRect().top + window.pageYOffset - 115,
					behavior: 'smooth'
				});
			}
		}, 300);
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (
			inputElement &&
			!inputElement.contains(target) &&
			!document.getElementById('combobox-options')?.contains(target)
		) {
			closeDropdown();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeDropdown();
		}
	}

	onMount(() => {
		overlay = document.createElement('div');
		overlay.classList.add('ambient-overlay', 'hidden');
		document.body.appendChild(overlay);

		document.addEventListener('click', handleClickOutside);
		document.addEventListener('keydown', handleKeydown);

		return () => {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
			if (overlay && overlay.parentNode) {
				overlay.parentNode.removeChild(overlay);
			}
		};
	});
</script>

<form class="grid grid-cols-1 gap-2" on:submit|preventDefault={onSubmit}>
	<div class="relative">
		<input
			bind:this={inputElement}
			id="combobox-input"
			type="text"
			class={isLoading
				? 'pulse-loading block w-full rounded-2xl border border-gray-600 bg-slate-900 p-2.5 text-gray-300 focus:border-blue-500 focus:ring-blue-500'
				: 'block w-full rounded-2xl border border-gray-600 bg-slate-900 p-2.5 text-gray-300 focus:border-blue-500 focus:ring-blue-500'}
			class:ambient-focuss={showOptions}
			class:error
			{placeholder}
			bind:value={searchQuery}
			on:focus={handleFocus}
			autocomplete="off"
			autocorrect="off"
			autocapitalize="off"
			disabled={isLoading}
		/>

		{#if searchQuery.length > 0}
			<button
				type="button"
				class="clear-button"
				on:click|stopPropagation={clearSelection}
				aria-label="Очистить"
			>
				<svg
					width="22"
					height="22"
					viewBox="0 0 22 22"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					class="clear-icon"
				>
					<path
						d="M6 6L16 16M16 6L6 16"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
			</button>
		{/if}

		{#if showOptions}
			<ul
				id="combobox-options"
				class="combobox-options absolute mt-1 w-full overflow-hidden rounded-2xl border border-gray-600 bg-slate-900 p-2"
				class:active={showOptions}
				class:ambient-focus={showOptions}
				transition:scale={{
					duration: 200,
					opacity: 0,
					start: 0.95,
					easing: quintOut
				}}
			>
				{#each filteredItems as item}
					<li
						class="cursor-pointer rounded-lg p-2 hover:bg-gray-700"
						on:mousedown={() => selectItem(item)}
					>
						{item.displayValue}
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<button
		type="submit"
		class="rounded-2xl bg-blue-700 p-2 text-white transition-all hover:bg-blue-600"
	>
		Показать расписание
	</button>

	<CopyLinkButton
		disabled={!selectedId}
		params={{ [paramName]: selectedId }}
		successMessage={copyLinkMessage}
	>
		Скопировать ссылку на расписание
	</CopyLinkButton>
</form>

<style>
	:global(.ambient-overlay) {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(30, 30, 30, 0.7);
		z-index: 9998;
		backdrop-filter: blur(1px);
		-webkit-backdrop-filter: blur(1px);
		pointer-events: none;
		transition:
			backdrop-filter 0.6s ease-in-out,
			background 0.6s ease-in-out;
	}

	:global(.ambient-focuss) {
		position: relative;
		background: rgba(1, 21, 51, 0.931);
		box-shadow: 0 0 200px rgb(0, 57, 117);
		backdrop-filter: blur(15px);
		-webkit-backdrop-filter: blur(15px);
		z-index: 9999;
	}

	:global(.ambient-focus) {
		background: rgba(1, 21, 51, 0.931);
		box-shadow: 0 0 200px rgb(0, 57, 117);
		backdrop-filter: blur(15px);
		-webkit-backdrop-filter: blur(15px);
		z-index: 9999;
		transition:
			box-shadow 0.6s ease-in-out,
			backdrop-filter 0.6s ease-in-out;
	}

	input {
		transition: all 0.4s ease-in-out;
	}

	input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);
	}

	.error {
		border-color: #ef4444 !important;
		animation: shake 0.4s ease-in-out;
	}

	@keyframes shake {
		0% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-4px);
		}
		50% {
			transform: translateX(4px);
		}
		75% {
			transform: translateX(-4px);
		}
		100% {
			transform: translateX(0);
		}
	}

	.combobox-error {
		color: #ef4444;
		font-size: 0.95em;
		margin-top: 4px;
		margin-left: 8px;
		font-weight: 500;
		animation: shake 0.4s ease-in-out;
	}

	.clear-button {
		display: block;
		position: absolute;
		right: 10px;
		top: 50%;
		transform: translateY(-50%);
		border: none;
		background: none;
		color: #888;
		font-size: 2rem;
		cursor: pointer;
		z-index: 10001;
		padding: 0;
		line-height: 1;
		transition: color 0.2s;
	}
	.clear-button:hover .clear-icon {
		color: #ef4444;
	}
	.clear-icon {
		display: block;
		color: #888;
		transition: color 0.2s;
		pointer-events: none;
	}

	.relative input:not(:placeholder-shown) + .clear-button {
		display: block;
	}

	.combobox-options {
		max-height: 300px;
		overflow-y: auto;
		opacity: 0;
		transform: translateY(-10px);
		transition:
			opacity 0.8s ease,
			transform 0.8s ease;
		max-height: 0;
		overflow: scroll;
	}

	.combobox-options.active {
		opacity: 1;
		transform: translateY(0);
		max-height: 300px;
	}

	.combobox-options li:hover {
		background-color: #0072e461;
	}

	@keyframes pulse-loading {
		0% {
			border-color: #334155;
		}
		50% {
			border-color: #3b82f6;
			box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.1);
		}
		100% {
			border-color: #334155;
		}
	}

	.pulse-loading {
		animation: pulse-loading 2s ease-in-out infinite;
		background: linear-gradient(45deg, #1e293b, #1f2937);
	}
</style>
