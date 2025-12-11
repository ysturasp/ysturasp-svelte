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
	let isLoading = false;
	let error = '';
	let isLoaded = false;

	async function loadFiles() {
		if (!$auth.authenticated || isLoading || isLoaded) {
			if (!$auth.authenticated) {
				isLoading = false;
			}
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
			isLoaded = true;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ошибка при загрузке файлов';
		} finally {
			isLoading = false;
		}
	}

	formattingComplete.subscribe((complete) => {
		if (complete) {
			isLoaded = false;
			loadFiles();
			formattingComplete.set(false);
		}
	});

	$: if (!$auth.loading && $auth.authenticated && !isLoaded && !isLoading) {
		loadFiles();
	}
</script>

<div class="mt-8 rounded-2xl bg-slate-800 p-4 md:p-6">
	<div class="mb-6 flex items-center border-b border-slate-700 pb-4">
		<div class="flex items-center">
			<h2 class="text-4xl font-semibold text-white">📋</h2>
			<h2 class="ml-3 text-xl font-semibold text-white md:text-3xl">
				История форматирования
			</h2>
		</div>
	</div>

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
		<div class="space-y-4">
			{#each files as file}
				<div class="rounded-lg bg-slate-700/30 p-4">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="font-medium text-white">{file.fileName}</h3>
							<div class="mt-1 text-sm text-slate-400">
								{new Date(file.timestamp).toLocaleString()}
							</div>
							<div class="mt-1 flex gap-4 text-sm text-slate-300">
								<span class={file.isPaid ? 'text-green-400' : 'text-blue-400'}>
									{file.isPaid ? 'Платное' : 'Бесплатное'}
								</span>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
