<script lang="ts">
	import { onMount, createEventDispatcher, tick } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { currentOpenSelect } from '$lib/stores/selectStore';

	export let items: Array<{
		id: string | number;
		label: string;
		icon?: string;
		description?: string;
	}> = [];
	export let selectedId: string | number | null = null;
	export let placeholder = 'Выберите значение';
	export let width = '250px';
	export let maxHeight = '300px';
	export let position: 'bottom' | 'top' = 'bottom';
	export let disabled = false;
	export let searchable = true;
	export let searchPlaceholder = 'Поиск...';
	export let error = false;
	export let isLoading = false;
	export let highlight = false;

	const dispatch = createEventDispatcher();

	const selectId = `select-${Math.random().toString(36).substr(2, 9)}`;

	let isOpen = false;
	let selectTrigger: HTMLDivElement;
	let popupMenu: HTMLDivElement;
	let searchInput: HTMLInputElement;
	let searchQuery = '';
	let isAndroid = false;
	let selectedItem = items.find((item) => item.id === selectedId);

	$: selectedItem = items.find((item) => item.id === selectedId);

	$: if ($currentOpenSelect !== selectId && isOpen) {
		closePopup();
	}

	let highlightedIndex = -1;

	$: {
		if (searchQuery) {
			highlightedIndex = 0;
		} else if (isOpen) {
			const selectedIndex = filteredItems.findIndex((item) => item.id === selectedId);
			highlightedIndex = selectedIndex >= 0 ? selectedIndex : -1;
		} else {
			highlightedIndex = -1;
		}
	}

	$: filteredItems = searchQuery
		? items.filter(
				(item) =>
					item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.description?.toLowerCase().includes(searchQuery.toLowerCase())
			)
		: items;

	function handleSelect(item: (typeof items)[0]) {
		selectedId = item.id;
		selectedItem = item;
		dispatch('select', item);
		closePopup();
	}

	function togglePopup(event: MouseEvent) {
		if (disabled) return;
		event.stopPropagation();

		if (!isOpen) {
			openPopup();
		} else {
			closePopup();
		}
	}

	async function openPopup() {
		currentOpenSelect.set(selectId);
		isOpen = true;
		await tick();
		setupPopupPosition();

		if (searchable && !isAndroid) {
			setTimeout(() => {
				searchInput?.focus();
			}, 0);
		}

		document.addEventListener('click', handleOutsideClick);
		window.addEventListener('scroll', handleScroll, true);
		window.addEventListener('resize', setupPopupPosition);
	}

	function closePopup() {
		isOpen = false;
		searchQuery = '';
		highlightedIndex = -1;

		if ($currentOpenSelect === selectId) {
			currentOpenSelect.set(null);
		}

		document.removeEventListener('click', handleOutsideClick);
		window.removeEventListener('scroll', handleScroll, true);
		window.removeEventListener('resize', setupPopupPosition);
	}

	function handleOutsideClick(event: MouseEvent) {
		if (
			!selectTrigger.contains(event.target as Node) &&
			!popupMenu?.contains(event.target as Node)
		) {
			closePopup();
		}
	}

	function handleScroll(event: Event) {
		setupPopupPosition();
	}

	function setupPopupPosition() {
		if (!popupMenu || !selectTrigger) return;

		popupMenu.style.position = 'absolute';
		popupMenu.style.width = '';
		popupMenu.style.left = '0';
		popupMenu.style.right = 'auto';

		requestAnimationFrame(() => {
			const triggerRect = selectTrigger.getBoundingClientRect();

			popupMenu.style.width = `${triggerRect.width}px`;

			const viewportHeight = window.innerHeight;
			const popupRect = popupMenu.getBoundingClientRect();
			const spaceBelow = viewportHeight - triggerRect.bottom;
			const spaceAbove = triggerRect.top;
			const popupHeight = popupRect.height;

			const preferredPosition = position === 'top' ? 'top' : 'bottom';
			const hasSpaceBelow = spaceBelow >= Math.min(parseInt(maxHeight), popupHeight);
			const hasSpaceAbove = spaceAbove >= Math.min(parseInt(maxHeight), popupHeight);

			let finalPosition: 'top' | 'bottom';

			if (preferredPosition === 'bottom') {
				finalPosition = hasSpaceBelow || !hasSpaceAbove ? 'bottom' : 'top';
			} else {
				finalPosition = hasSpaceAbove || !hasSpaceBelow ? 'top' : 'bottom';
			}

			if (finalPosition === 'bottom') {
				popupMenu.style.top = '100%';
				popupMenu.style.bottom = 'auto';
				popupMenu.style.transformOrigin = 'top';
			} else {
				popupMenu.style.bottom = '100%';
				popupMenu.style.top = 'auto';
				popupMenu.style.transformOrigin = 'bottom';
			}

			const rightOverflow = popupRect.right - window.innerWidth;
			const leftOverflow = 0 - popupRect.left;

			if (rightOverflow > 0) {
				popupMenu.style.left = `${-rightOverflow}px`;
			} else if (leftOverflow > 0) {
				popupMenu.style.left = `${leftOverflow}px`;
			}
		});
	}

	function handleSearchKeydown(event: KeyboardEvent) {
		if (!isOpen) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				highlightedIndex = Math.min(highlightedIndex + 1, filteredItems.length - 1);
				scrollHighlightedIntoView();
				break;

			case 'ArrowUp':
				event.preventDefault();
				highlightedIndex = Math.max(highlightedIndex - 1, 0);
				scrollHighlightedIntoView();
				break;

			case 'Enter':
				event.preventDefault();
				if (filteredItems.length > 0) {
					if (highlightedIndex >= 0) {
						handleSelect(filteredItems[highlightedIndex]);
					} else if (searchQuery && filteredItems.length > 0) {
						handleSelect(filteredItems[0]);
					}
				}
				break;

			case 'Escape':
				event.preventDefault();
				closePopup();
				break;

			case 'Tab':
				closePopup();
				break;
		}
	}

	function scrollHighlightedIntoView() {
		if (highlightedIndex >= 0 && popupMenu) {
			const items = popupMenu.querySelectorAll('.select-item');
			const highlightedItem = items[highlightedIndex] as HTMLElement;
			if (highlightedItem) {
				const containerRect = popupMenu.getBoundingClientRect();
				const itemRect = highlightedItem.getBoundingClientRect();

				if (itemRect.bottom > containerRect.bottom) {
					popupMenu.scrollTop += itemRect.bottom - containerRect.bottom;
				} else if (itemRect.top < containerRect.top) {
					popupMenu.scrollTop += itemRect.top - containerRect.top;
				}
			}
		}
	}

	function handleGlobalKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			event.preventDefault();
			closePopup();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (disabled) return;

		switch (event.key) {
			case ' ':
			case 'Enter':
				if (!isOpen) {
					event.preventDefault();
					openPopup();
				}
				break;
			case 'Escape':
				if (isOpen) {
					event.preventDefault();
					closePopup();
				}
				break;
			default:
				if (searchable && !isOpen && /^[a-zA-Zа-яА-Я]$/.test(event.key)) {
					openPopup();
				}
				break;
		}
	}

	onMount(() => {
		isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
		document.addEventListener('keydown', handleGlobalKeydown);

		return () => {
			document.removeEventListener('keydown', handleGlobalKeydown);
			document.removeEventListener('click', handleOutsideClick);
			window.removeEventListener('scroll', handleScroll, true);
			window.removeEventListener('resize', setupPopupPosition);

			if ($currentOpenSelect === selectId) {
				currentOpenSelect.set(null);
			}
		};
	});
</script>

<div class="custom-select relative" style:width class:disabled bind:this={selectTrigger}>
	<div
		class="select-trigger"
		on:click={togglePopup}
		on:keydown={handleKeydown}
		role="button"
		tabindex="0"
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		class:active={isOpen}
		class:error
		class:highlight
	>
		<div class="select-value">
			{#if selectedItem}
				<div class="selected-item">
					{#if selectedItem.icon}
						<span class="item-icon">{@html selectedItem.icon}</span>
					{/if}
					<span class="item-label">{selectedItem.label}</span>
				</div>
			{:else}
				<span class="placeholder">
					{#if isLoading}
						<span class="loading-dots">{placeholder}</span>
					{:else}
						{placeholder}
					{/if}
				</span>
			{/if}
		</div>
		<div class="select-arrow" class:open={isOpen}>
			{#if isLoading}
				<svg
					class="h-4 w-4 animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			{:else}
				<svg width="8" height="6" viewBox="0 0 8 6" fill="none">
					<path
						d="M0.706206 1.70621C0.315681 1.31569 0.552908 0.684211 1.09464 0.684211H6.90535C7.44708 0.684211 7.68431 1.31569 7.29378 1.70621L4.38842 4.61157C4.17375 4.82624 3.82624 4.82624 3.61157 4.61157L0.706206 1.70621Z"
						fill="currentColor"
					/>
				</svg>
			{/if}
		</div>
	</div>

	{#if isOpen}
		<div
			bind:this={popupMenu}
			class="select-popup"
			style:max-height={maxHeight}
			transition:scale={{
				duration: 200,
				opacity: 0,
				start: 0.95,
				easing: quintOut
			}}
			role="listbox"
		>
			{#if searchable}
				<div class="search-container">
					<div class="search-input-wrapper">
						<svg
							class="search-icon"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
						<input
							type="text"
							bind:this={searchInput}
							bind:value={searchQuery}
							placeholder={searchPlaceholder}
							class="search-input"
							on:click|stopPropagation
							on:keydown={handleSearchKeydown}
						/>
						{#if searchQuery}
							<button
								class="clear-search"
								aria-label="Очистить поиск"
								on:click|stopPropagation={() => {
									searchQuery = '';
									searchInput.focus();
								}}
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						{/if}
					</div>
				</div>
			{/if}

			<div class="items-container">
				{#if filteredItems.length > 0}
					{#each filteredItems as item, index (item.id)}
						<div
							class="select-item"
							class:selected={item.id === selectedId}
							class:highlighted={index === highlightedIndex}
							on:click={() => handleSelect(item)}
							on:keydown={handleKeydown}
							on:mouseenter={() => (highlightedIndex = index)}
							role="option"
							aria-selected={item.id === selectedId}
							tabindex="0"
						>
							{#if item.icon}
								<span class="item-icon">{@html item.icon}</span>
							{/if}
							<div class="item-content">
								<span class="item-label">{item.label}</span>
								{#if item.description}
									<span class="item-description">{item.description}</span>
								{/if}
							</div>
							{#if item.id === selectedId}
								<svg
									class="check-icon"
									width="16"
									height="16"
									viewBox="0 0 16 16"
									fill="currentColor"
								>
									<path
										d="M6.336 13.6a1.049 1.049 0 0 1-.8-.376L2.632 9.736a.992.992 0 0 1 .152-1.424 1.056 1.056 0 0 1 1.456.152l2.008 2.4 5.448-8a1.048 1.048 0 0 1 1.432-.288A.992.992 0 0 1 13.424 4L7.2 13.144a1.04 1.04 0 0 1-.8.456h-.064Z"
									/>
								</svg>
							{/if}
						</div>
					{/each}
				{:else}
					<div class="no-results">Ничего не найдено</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style lang="postcss">
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

	@keyframes pulse-highlight {
		0% {
			border-color: #334155;
		}
		50% {
			border-color: #3b82f6;
			box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
		}
		100% {
			border-color: #334155;
		}
	}

	.custom-select {
		position: relative;
		font-size: 14px;
		color: #e2e8f0;
	}

	.disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	.select-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		background-color: #1e293b;
		border: 1px solid #334155;
		border-radius: 12px;
		cursor: pointer;
		user-select: none;
		transition: all 0.2s ease;
	}

	.select-trigger.error {
		border-color: #ef4444;
		animation: shake 0.4s ease-in-out;
	}

	.select-trigger:not(.error):has(.loading-dots) {
		animation: pulse-loading 2s ease-in-out infinite;
		background: linear-gradient(45deg, #1e293b, #1f2937);
	}

	.select-trigger.highlight {
		animation: pulse-highlight 1s ease-in-out;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}

	.select-trigger:hover {
		background-color: #334155;
	}

	.select-trigger.active {
		border-color: #3b82f6;
		box-shadow: 0 0 0 1px #3b82f6;
	}

	.select-value {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	.selected-item {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	.placeholder {
		color: #64748b;
	}

	.select-arrow {
		display: flex;
		align-items: center;
		color: #64748b;
		transition: transform 0.2s ease;
	}

	.select-arrow.open {
		transform: rotate(180deg);
	}

	.select-popup {
		position: absolute;
		background-color: #1e293b;
		border: 1px solid #334155;
		border-radius: 12px;
		box-shadow:
			0 4px 6px -1px rgb(0 0 0 / 0.1),
			0 2px 4px -2px rgb(0 0 0 / 0.1);
		overflow-y: auto;
		z-index: 50;
		margin-top: 10px;
		margin-bottom: 4px;
		min-width: 100%;
	}

	.select-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.select-item:hover {
		background-color: #334155;
	}

	.select-item.selected {
		background-color: #334155;
	}

	.select-item.highlighted {
		background-color: #334155;
	}

	.item-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
	}

	.item-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.item-label {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.item-description {
		font-size: 12px;
		color: #64748b;
	}

	.check-icon {
		flex-shrink: 0;
		color: #3b82f6;
	}

	.search-container {
		padding: 8px;
		border-bottom: 1px solid #334155;
		position: sticky;
		top: 0;
		background-color: #1e293b;
		z-index: 1;
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 12px;
		color: #64748b;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 6px 28px 6px 34px;
		background-color: #0f172a;
		border: 1px solid #334155;
		border-radius: 12px;
		color: #e2e8f0;
		font-size: 14px;
		outline: none;
		transition: all 0.2s ease;
	}

	.search-input:focus {
		border-color: #3b82f6;
		box-shadow: 0 0 0 1px #3b82f6;
	}

	.search-input::placeholder {
		color: #64748b;
	}

	.clear-search {
		position: absolute;
		right: 8px;
		color: #64748b;
		padding: 2px;
		border-radius: 4px;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.clear-search:hover {
		color: #e2e8f0;
		background-color: #334155;
	}

	.items-container {
		overflow-y: auto;
	}

	.no-results {
		padding: 12px;
		text-align: center;
		color: #64748b;
		font-size: 14px;
	}

	.loading-dots {
		position: relative;
		color: #64748b;
	}

	.loading-dots::after {
		content: '...';
		animation: dots 1.5s steps(4, end) infinite;
		position: absolute;
		color: #3b82f6;
	}

	@keyframes dots {
		0%,
		20% {
			content: '';
		}
		40% {
			content: '.';
		}
		60% {
			content: '..';
		}
		80%,
		100% {
			content: '...';
		}
	}
</style>
