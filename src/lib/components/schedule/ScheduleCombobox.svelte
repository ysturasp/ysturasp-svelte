<script lang="ts">
	import { onMount } from 'svelte';
	import CopyLinkButton from '$lib/components/ui/CopyLinkButton.svelte';

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
	export let submitButtonText = 'Показать расписание';
	export let copyButtonText = 'Скопировать ссылку на расписание';

	let searchQuery = '';
	let showOptions = false;
	let isClosing = false;
	let filteredItems: Item[] = [];
	let overlay: HTMLDivElement;
	let inputElement: HTMLInputElement;
	let comboboxContainer: HTMLDivElement;
	let closeButton: HTMLButtonElement;
	let optionsList: HTMLUListElement;
	let showErrorAnimation = false;
	let mouseDownTarget: HTMLElement | null = null;
	let justOpened = false;

	$: if (error) {
		showErrorAnimation = false;
		setTimeout(() => {
			showErrorAnimation = true;
		}, 10);
	} else {
		showErrorAnimation = false;
	}

	function getCurrentWeek(): number {
		const today = new Date();
		const currentMonth = today.getMonth();

		if (currentMonth >= 1 && currentMonth <= 5) {
			const weeksSinceFebruary = Math.floor(
				(today.getTime() - new Date(today.getFullYear(), 1, 3).getTime()) /
					(7 * 24 * 60 * 60 * 1000)
			);
			return Math.max(1, Math.min(18, weeksSinceFebruary + 1));
		} else if (currentMonth >= 8 || currentMonth === 0) {
			const startDate =
				currentMonth >= 8
					? new Date(today.getFullYear(), 8, 1)
					: new Date(today.getFullYear() - 1, 8, 1);
			const weeksSinceStart = Math.floor(
				(today.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
			);
			return Math.max(1, Math.min(18, weeksSinceStart + 1));
		}
		return 1;
	}

	$: copyParams = selectedId
		? { [paramName]: selectedId, week: getCurrentWeek().toString() }
		: { week: getCurrentWeek().toString() };

	$: {
		filteredItems = items.filter((item) =>
			item.displayValue.toLowerCase().includes(searchQuery.toLowerCase())
		);
	}

	function handleAnimationEnd() {
		if (isClosing) {
			isClosing = false;
			showOptions = false;
		}
	}

	function closeDropdown() {
		if (!isClosing && showOptions) {
			isClosing = true;
			overlay.classList.add('hidden');
			inputElement?.blur();
		}
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
		if (!showOptions && !isClosing) {
			showOptions = true;
			isClosing = false;
			overlay.classList.remove('hidden');
			justOpened = true;
			setTimeout(() => {
				justOpened = false;
			}, 100);
			setTimeout(() => {
				if (inputElement) {
					window.scrollTo({
						top: inputElement.getBoundingClientRect().top + window.pageYOffset - 115,
						behavior: 'smooth'
					});
				}
			}, 300);
		}
	}

	function handleMouseDown(event: MouseEvent) {
		mouseDownTarget = event.target as HTMLElement;
	}

	function handleClickOutside(event: MouseEvent) {
		if (justOpened) {
			return;
		}

		const target = event.target as HTMLElement;
		const optionsElement = document.getElementById('combobox-options');

		if (mouseDownTarget) {
			const startedInside =
				comboboxContainer?.contains(mouseDownTarget) ||
				optionsElement?.contains(mouseDownTarget) ||
				mouseDownTarget === closeButton ||
				closeButton?.contains(mouseDownTarget) ||
				mouseDownTarget === inputElement;

			if (startedInside) {
				mouseDownTarget = null;
				return;
			}
		}

		if (
			comboboxContainer &&
			!comboboxContainer.contains(target) &&
			!optionsElement?.contains(target) &&
			target !== closeButton &&
			!closeButton?.contains(target)
		) {
			closeDropdown();
		}

		mouseDownTarget = null;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeDropdown();
		}
	}

	function clearAndClose() {
		clearSelection();
		closeDropdown();
	}

	onMount(() => {
		overlay = document.createElement('div');
		overlay.classList.add('ambient-overlay', 'hidden');
		document.body.appendChild(overlay);

		document.addEventListener('mousedown', handleMouseDown);
		document.addEventListener('click', handleClickOutside);
		document.addEventListener('keydown', handleKeydown);

		return () => {
			document.removeEventListener('mousedown', handleMouseDown);
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
			if (overlay && overlay.parentNode) {
				overlay.parentNode.removeChild(overlay);
			}
		};
	});
</script>

<form class="grid grid-cols-1 gap-2" on:submit|preventDefault={onSubmit}>
	<div class="combobox-wrapper flex items-center gap-2" bind:this={comboboxContainer}>
		<div
			class="input-container relative flex-1"
			class:has-close-button={showOptions && !isClosing}
		>
			<input
				bind:this={inputElement}
				id="combobox-input"
				type="text"
				class={isLoading
					? 'pulse-loading block w-full rounded-2xl border border-gray-600 bg-slate-900 p-2.5 text-gray-300 focus:border-blue-500 focus:ring-blue-500'
					: 'block w-full rounded-2xl border border-gray-600 bg-slate-900 p-2.5 text-gray-300 focus:border-blue-500 focus:ring-blue-500'}
				class:ambient-focuss={showOptions}
				class:error={showErrorAnimation}
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
					class:has-close-button={showOptions && !isClosing}
					on:click|stopPropagation={clearSelection}
					aria-label="Очистить"
				>
					<svg
						width="16"
						height="16"
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
					bind:this={optionsList}
					id="combobox-options"
					class="combobox-options absolute left-0 mt-2 w-full overflow-hidden rounded-2xl border border-gray-600 bg-slate-900 p-2 {isClosing
						? 'hide'
						: 'show'}"
					class:ambient-focus={showOptions}
					on:animationend={handleAnimationEnd}
				>
					{#each filteredItems as item}
						<li
							class="cursor-pointer rounded-lg p-2 hover:bg-gray-700"
							on:mousedown={() => selectItem(item)}
							role="option"
							aria-selected={item.id === selectedId}
							tabindex="0"
							on:keydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') selectItem(item);
							}}
						>
							{item.displayValue}
						</li>
					{/each}
				</ul>
			{/if}

			<button
				bind:this={closeButton}
				type="button"
				class="close-circle-button"
				class:visible={showOptions || isClosing}
				on:click|stopPropagation={clearAndClose}
				aria-label="Закрыть"
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 22 22"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M6 6L16 16M16 6L6 16"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
			</button>
		</div>
	</div>

	<button
		type="submit"
		class="rounded-2xl bg-blue-700 p-2 text-white transition-all hover:bg-blue-600"
	>
		{submitButtonText}
	</button>

	{#if selectedId}
		<div class="flex w-full items-center justify-between">
			<CopyLinkButton
				disabled={!selectedId}
				params={copyParams}
				successMessage={copyLinkMessage}
			>
				{copyButtonText}
			</CopyLinkButton>
		</div>
	{/if}
</form>

<style>
	:global(.ambient-overlay) {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(30, 30, 30, 0.7);
		z-index: 50;
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
		z-index: 60;
	}

	:global(.ambient-focus) {
		background: rgba(1, 21, 51, 0.931);
		box-shadow: 0 0 200px rgb(0, 57, 117);
		backdrop-filter: blur(15px);
		-webkit-backdrop-filter: blur(15px);
		z-index: 70;
		transition:
			box-shadow 0.6s ease-in-out,
			backdrop-filter 0.6s ease-in-out;
	}

	input {
		transition: all 0.4s ease-in-out;
		position: relative;
		z-index: 66;
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

	.clear-button {
		display: block;
		position: absolute;
		right: 10px;
		top: 50%;
		transform: translateY(-50%);
		border: none;
		background: none;
		color: #888;
		font-size: 1rem;
		cursor: pointer;
		z-index: 68;
		padding: 0;
		line-height: 1;
		transition:
			right 0.3s ease-in-out,
			color 0.2s;
	}

	.clear-button.has-close-button {
		right: 62px;
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
	}

	.combobox-options.show {
		animation: fadeInScale 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
	}

	.combobox-options.hide {
		animation: fadeOutScale 0.2s ease-in forwards;
	}

	@keyframes fadeInScale {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(-10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	@keyframes fadeOutScale {
		from {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
		to {
			opacity: 0;
			transform: scale(0.95) translateY(-10px);
		}
	}

	.combobox-options li:hover {
		background-color: #0072e461;
	}

	.input-container {
		transition: padding-right 0.3s ease-in-out;
	}

	.input-container.has-close-button {
		padding-right: 52px;
	}

	.clear-button {
		transition:
			right 0.3s ease-in-out,
			color 0.2s;
	}

	.close-circle-button {
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 9999px;
		border: 1px solid #475569;
		background: #0f172a;
		color: #888;
		cursor: pointer;
		opacity: 0;
		pointer-events: none;
		transition:
			opacity 0.3s ease-in-out 0.1s,
			all 0.2s ease-in-out;
		z-index: 65;
	}

	.close-circle-button.visible {
		opacity: 1;
		pointer-events: auto;
	}

	.close-circle-button:hover {
		color: #ef4444;
		background: #0b1220;
		box-shadow: 0 0 8px rgba(59, 130, 246, 0.25);
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
