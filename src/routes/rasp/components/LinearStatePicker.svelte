<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import type { LinearState } from '$lib/stores/linear';
	import { linearStore } from '$lib/stores/linear';
	import Portal from '$lib/components/ui/Portal.svelte';

	export let isOpen = false;
	export let onClose: () => void;
	export let onSelect: (state: LinearState) => void;
	export let currentState: LinearState | null = null;

	let container: HTMLElement;
	$: states = $linearStore.states.filter(
		(state) => !state.name.toLowerCase().includes('duplicate')
	);

	function focus(node: HTMLElement) {
		node.focus();
		return {
			destroy() {}
		};
	}

	$: if (isOpen && container) {
		setTimeout(() => container?.focus(), 0);
	}

	function handleClickOutside(event: MouseEvent | KeyboardEvent) {
		if (container && !container.contains(event.target as Node)) {
			event.stopPropagation();
			onClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			container?.blur();
			onClose();
		}
	}

	function handleSelect(state: LinearState) {
		onSelect(state);
		onClose();
	}

	function handleContainerClick(event: MouseEvent | KeyboardEvent) {
		event.stopPropagation();
	}

	function getStateColor(state: LinearState): string {
		return `bg-${state.color}-500/20 text-${state.color}-400`;
	}

	function getStateIcon(stateName: string): string {
		const name = stateName.toLowerCase();

		if (name.includes('backlog')) {
			return `<svg class="color-override" width="14" height="14" viewBox="0 0 14 14" fill="#4CAF50" role="img" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.9408 7.91426L11.9576 7.65557C11.9855 7.4419 12 7.22314 12 7C12 6.77686 11.9855 6.5581 11.9576 6.34443L13.9408 6.08573C13.9799 6.38496 14 6.69013 14 7C14 7.30987 13.9799 7.61504 13.9408 7.91426ZM13.4688 4.32049C13.2328 3.7514 12.9239 3.22019 12.5538 2.73851L10.968 3.95716C11.2328 4.30185 11.4533 4.68119 11.6214 5.08659L13.4688 4.32049ZM11.2615 1.4462L10.0428 3.03204C9.69815 2.76716 9.31881 2.54673 8.91341 2.37862L9.67951 0.531163C10.2486 0.767153 10.7798 1.07605 11.2615 1.4462ZM7.91426 0.0591659L7.65557 2.04237C7.4419 2.01449 7.22314 2 7 2C6.77686 2 6.5581 2.01449 6.34443 2.04237L6.08574 0.059166C6.38496 0.0201343 6.69013 0 7 0C7.30987 0 7.61504 0.0201343 7.91426 0.0591659ZM4.32049 0.531164L5.08659 2.37862C4.68119 2.54673 4.30185 2.76716 3.95716 3.03204L2.73851 1.4462C3.22019 1.07605 3.7514 0.767153 4.32049 0.531164ZM1.4462 2.73851L3.03204 3.95716C2.76716 4.30185 2.54673 4.68119 2.37862 5.08659L0.531164 4.32049C0.767153 3.7514 1.07605 3.22019 1.4462 2.73851ZM0.0591659 6.08574C0.0201343 6.38496 0 6.69013 0 7C0 7.30987 0.0201343 7.61504 0.059166 7.91426L2.04237 7.65557C2.01449 7.4419 2 7.22314 2 7C2 6.77686 2.01449 6.5581 2.04237 6.34443L0.0591659 6.08574ZM0.531164 9.67951L2.37862 8.91341C2.54673 9.31881 2.76716 9.69815 3.03204 10.0428L1.4462 11.2615C1.07605 10.7798 0.767153 10.2486 0.531164 9.67951ZM2.73851 12.5538L3.95716 10.968C4.30185 11.2328 4.68119 11.4533 5.08659 11.6214L4.32049 13.4688C3.7514 13.2328 3.22019 12.9239 2.73851 12.5538ZM6.08574 13.9408L6.34443 11.9576C6.5581 11.9855 6.77686 12 7 12C7.22314 12 7.4419 11.9855 7.65557 11.9576L7.91427 13.9408C7.61504 13.9799 7.30987 14 7 14C6.69013 14 6.38496 13.9799 6.08574 13.9408ZM9.67951 13.4688L8.91341 11.6214C9.31881 11.4533 9.69815 11.2328 10.0428 10.968L11.2615 12.5538C10.7798 12.9239 10.2486 13.2328 9.67951 13.4688ZM12.5538 11.2615L10.968 10.0428C11.2328 9.69815 11.4533 9.31881 11.6214 8.91341L13.4688 9.67951C13.2328 10.2486 12.924 10.7798 12.5538 11.2615Z" stroke="none"></path>
            </svg>`;
		}

		if (name.includes('todo') || name.includes('to do')) {
			return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="12" height="12" rx="6" stroke="#4A9EFF" stroke-width="1.5" fill="none"></rect>
                <path fill="#4A9EFF" stroke="none" d="M 3.5,3.5 L3.5,0 A3.5,3.5 0 0,1 3.5, 0 z" transform="translate(3.5,3.5)"></path>
            </svg>`;
		}

		if (name.includes('progress') || name.includes('doing')) {
			return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="12" height="12" rx="6" stroke="#F2C94C" stroke-width="1.5" fill="none"></rect>
                <path fill="#F2C94C" stroke="none" d="M 3.5,3.5 L3.5,0 A3.5,3.5 0 0,1 3.5, 7 z" transform="translate(3.5,3.5)"></path>
            </svg>`;
		}

		if (name.includes('done') || name.includes('complete')) {
			return `<svg width="14" height="14" viewBox="0 0 14 14" fill="#5E6AD2" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0ZM11.101 5.10104C11.433 4.76909 11.433 4.23091 11.101 3.89896C10.7691 3.56701 10.2309 3.56701 9.89896 3.89896L5.5 8.29792L4.10104 6.89896C3.7691 6.56701 3.2309 6.56701 2.89896 6.89896C2.56701 7.2309 2.56701 7.7691 2.89896 8.10104L4.89896 10.101C5.2309 10.433 5.7691 10.433 6.10104 10.101L11.101 5.10104Z"></path>
            </svg>`;
		}

		if (name.includes('cancel')) {
			return `<svg width="14" height="14" viewBox="0 0 14 14" fill="#FF4F4F" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14ZM5.03033 3.96967C4.73744 3.67678 4.26256 3.67678 3.96967 3.96967C3.67678 4.26256 3.67678 4.73744 3.96967 5.03033L5.93934 7L3.96967 8.96967C3.67678 9.26256 3.67678 9.73744 3.96967 10.0303C4.26256 10.3232 4.73744 10.3232 5.03033 10.0303L7 8.06066L8.96967 10.0303C9.26256 10.3232 9.73744 10.3232 10.0303 10.0303C10.3232 9.73744 10.3232 9.26256 10.0303 8.96967L8.06066 7L10.0303 5.03033C10.3232 4.73744 10.3232 4.26256 10.0303 3.96967C9.73744 3.67678 9.26256 3.67678 8.96967 3.96967L7 5.93934L5.03033 3.96967Z" stroke="none"></path>
            </svg>`;
		}

		return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="12" height="12" rx="6" stroke="#4A9EFF" stroke-width="1.5" fill="none"></rect>
        </svg>`;
	}
</script>

{#if isOpen}
	<Portal>
		<div
			class="fixed inset-0 z-120 flex items-center justify-center bg-black/50 px-4"
			transition:fade={{ duration: 200 }}
			on:click={handleClickOutside}
			on:keydown={handleKeydown}
			role="presentation"
			aria-label="Закрыть окно выбора статуса"
		>
			<div
				bind:this={container}
				class="w-full max-w-sm rounded-2xl bg-slate-900 p-4 shadow-xl ring-1 ring-blue-500/50"
				transition:scale={{ duration: 200, easing: quintOut }}
				on:click={handleContainerClick}
				on:keydown={(e) => e.key === 'Enter' && handleContainerClick(e)}
				role="dialog"
				tabindex="0"
				aria-modal="true"
				aria-labelledby="dialog-title"
				use:focus
			>
				<div class="mb-4 flex items-center justify-between">
					<h3 id="dialog-title" class="text-lg font-semibold text-white">
						Выберите статус
					</h3>
					<button
						on:click={onClose}
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
					{#each states as state}
						<button
							class="flex w-full items-center gap-3 rounded-lg p-2 text-white transition-all hover:bg-slate-800 {state.id ===
							currentState?.id
								? 'bg-slate-800'
								: ''}"
							on:click={() => handleSelect(state)}
						>
							<div class="flex h-5 w-5 items-center justify-center">
								{@html getStateIcon(state.name)}
							</div>
							<div class="rounded px-2 py-0.5 text-sm {getStateColor(state)}">
								{state.name}
							</div>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</Portal>
{/if}
