<script lang="ts">
	import { onMount } from 'svelte';
	import { formattingComplete } from '../stores';
	import { auth } from '$lib/stores/auth';

	interface HistoryFile {
		fileName: string;
		isPaid: boolean;
		timestamp: string;
	}

	let files: HistoryFile[] = [];
	let isLoading = true;
	let error = '';

	async function loadFiles() {
		if (!$auth.authenticated) {
			isLoading = false;
			return;
		}

		try {
			isLoading = true;
			error = '';
			const response = await fetch('/api/format/history');
			if (!response.ok) {
				throw new Error('Ошибка при загрузке истории');
			}
			const data = await response.json();
			files = data.files || [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ошибка при загрузке файлов';
		} finally {
			isLoading = false;
		}
	}

	formattingComplete.subscribe((complete) => {
		if (complete) {
			loadFiles();
			formattingComplete.set(false);
		}
	});

	auth.subscribe(() => {
		loadFiles();
	});

	onMount(() => {
		loadFiles();
	});
</script>

<div>
	{#if isLoading}
		<div class="flex justify-center py-8 text-slate-400">Загрузка...</div>
	{:else if error}
		<div class="rounded-lg bg-red-500/10 p-4 text-red-400">
			{error}
		</div>
	{:else if files.length === 0}
		<div class="flex justify-center py-8 text-slate-400">
			У вас пока нет отформатированных файлов
		</div>
	{:else}
		<div class="space-y-3">
			{#each files as file}
				<div
					class="flex items-center justify-between border-b border-slate-700 pb-3 last:border-0"
				>
					<div class="flex-1">
						<h3 class="font-medium text-white">{file.fileName}</h3>
						<div class="mt-1 flex items-center gap-3 text-sm text-slate-400">
							<span>{new Date(file.timestamp).toLocaleString()}</span>
							<span class={file.isPaid ? 'text-green-400' : 'text-blue-400'}>
								{file.isPaid ? 'Платное' : 'Бесплатное'}
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
