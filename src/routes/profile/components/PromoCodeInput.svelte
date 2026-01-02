<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		success: { formatsAdded: number };
		error: { message: string };
	}>();

	let promoCode = '';
	let isLoading = false;
	let errorMessage = '';
	let successMessage = '';
	let inputRef: HTMLInputElement | null = null;

	async function handleApply() {
		if (!promoCode.trim() || isLoading) return;

		isLoading = true;
		errorMessage = '';
		successMessage = '';

		try {
			const response = await fetch('/api/promo-codes/apply', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code: promoCode.trim() })
			});

			const data = await response.json();

			if (!response.ok) {
				errorMessage = data.error || 'Ошибка при применении промокода';
				dispatch('error', { message: errorMessage });
				return;
			}

			if (data.success) {
				successMessage = `Промокод применен! Добавлено ${data.formatsAdded} форматирований`;
				promoCode = '';
				dispatch('success', { formatsAdded: data.formatsAdded });
				setTimeout(() => {
					successMessage = '';
				}, 5000);
			} else {
				errorMessage = data.error || 'Ошибка при применении промокода';
				dispatch('error', { message: errorMessage });
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
			dispatch('error', { message: errorMessage });
		} finally {
			isLoading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleApply();
		}
	}
</script>

<div class="space-y-3">
	<div>
		<div class="flex gap-2">
			<input
				bind:this={inputRef}
				id="promo-code-input"
				type="text"
				bind:value={promoCode}
				on:keypress={handleKeyPress}
				placeholder="Введите промокод"
				disabled={isLoading}
				class="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white transition-colors placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				maxlength="50"
				autocomplete="off"
			/>
			<button
				type="button"
				on:click={handleApply}
				disabled={!promoCode.trim() || isLoading}
				class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if isLoading}
					<div class="flex items-center gap-2">
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></div>
						<span>Применение...</span>
					</div>
				{:else}
					Применить
				{/if}
			</button>
		</div>
	</div>

	{#if errorMessage}
		<div
			class="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-400"
		>
			<svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				></path>
			</svg>
			<span>{errorMessage}</span>
		</div>
	{/if}

	{#if successMessage}
		<div
			class="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-2 text-sm text-green-400"
		>
			<svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				></path>
			</svg>
			<span>{successMessage}</span>
		</div>
	{/if}
</div>
