<script lang="ts">
	import { notifications } from '$lib/stores/notifications';

	export let disabled = false;
	export let params: Record<string, string> = {};
	export let className = '';
	export let successMessage = 'Ссылка скопирована в буфер обмена';
	export let errorMessage = 'Не удалось скопировать ссылку';
	export let onSuccess: (() => void) | undefined = undefined;

	async function copyLink() {
		const url = new URL(window.location.href);
		url.search = '';

		if ('url' in params) {
			const textToCopy = params.url;
			try {
				await navigator.clipboard.writeText(textToCopy);
				notifications.add(successMessage, 'success');
				if (onSuccess) onSuccess();
			} catch (error) {
				try {
					const tempInput = document.createElement('input');
					tempInput.value = textToCopy;
					document.body.appendChild(tempInput);
					tempInput.select();
					document.execCommand('copy');
					document.body.removeChild(tempInput);
					notifications.add(successMessage, 'success');
					if (onSuccess) onSuccess();
				} catch (fallbackError) {
					notifications.add(errorMessage, 'error');
				}
			}
			return;
		}

		Object.entries(params).forEach(([key, value]) => {
			if (value) {
				url.searchParams.set(key, value);
			}
		});

		const textToCopy = url.toString();

		try {
			await navigator.clipboard.writeText(textToCopy);
			notifications.add(successMessage, 'success');
			if (onSuccess) onSuccess();
		} catch (error) {
			try {
				const tempInput = document.createElement('input');
				tempInput.value = textToCopy;
				document.body.appendChild(tempInput);
				tempInput.select();
				document.execCommand('copy');
				document.body.removeChild(tempInput);
				notifications.add(successMessage, 'success');
				if (onSuccess) onSuccess();
			} catch (fallbackError) {
				notifications.add(errorMessage, 'error');
			}
		}
	}
</script>

<button
	type="button"
	class="flex h-8 items-center gap-1 rounded-lg bg-slate-700 px-1.5 text-[11px] text-blue-400 transition-all hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50 {className}"
	on:click={copyLink}
	{disabled}
>
	<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
		/>
	</svg>
	<span>
		<slot>Скопировать ссылку</slot>
	</span>
</button>
