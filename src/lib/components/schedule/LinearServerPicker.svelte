<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	export let isOpen = false;
	export let onClose: () => void;
	export let onSelect: (server: string) => void;
	export let currentServer: string;

	const servers = [
		{
			url: 'https://api-linear-two.vercel.app',
			name: 'Прокси-сервер (рекомендуется)',
			description: 'Для работы из России'
		},
		{
			url: 'https://api.linear.app',
			name: 'Официальный API',
			description: 'Может потребоваться VPN'
		}
	];

	let container: HTMLElement;

	function handleClickOutside(event: MouseEvent) {
		if (container && !container.contains(event.target as Node)) {
			event.preventDefault();
			event.stopPropagation();
			onClose();
		}
	}

	function handleEscape(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			onClose();
		}
	}

	function handleSelect(server: string) {
		onSelect(server);
	}
</script>

<svelte:window on:keydown={handleEscape} />

{#if isOpen}
	<div
		class="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 px-4"
		transition:fade={{ duration: 200 }}
		on:click={handleClickOutside}
		role="presentation"
	>
		<div
			bind:this={container}
			class="w-full max-w-sm rounded-2xl bg-slate-900 p-4 shadow-xl ring-1 ring-blue-500/50"
			transition:scale={{ duration: 200, easing: quintOut }}
			on:click|stopPropagation={() => {}}
			on:keydown|stopPropagation={() => {}}
			role="dialog"
			aria-modal="true"
			aria-label="Выбор сервера API"
			tabindex="0"
		>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold text-white">Выберите сервер API</h3>
				<button
					on:click|stopPropagation={onClose}
					class="text-gray-400 hover:text-white"
					aria-label="Закрыть"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="space-y-2">
				{#each servers as server}
					<button
						class="flex w-full flex-col gap-1 rounded-lg p-3 text-left text-white transition-all hover:bg-slate-800 {server.url ===
						currentServer
							? 'bg-slate-800 ring-2 ring-blue-500/30'
							: ''}"
						on:click|stopPropagation={() => handleSelect(server.url)}
					>
						<div class="flex items-center gap-2">
							<svg
								class="h-4 w-4 text-blue-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 12h14M12 5l7 7-7 7"
								></path>
							</svg>
							<span>{server.name}</span>
						</div>
						<span class="text-sm text-slate-400">{server.description}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}
