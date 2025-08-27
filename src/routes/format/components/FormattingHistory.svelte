<script lang="ts">
	import { onMount } from 'svelte';
	import { getUserFiles, type FormattedFile } from '../api';
	import { formattingComplete } from '../stores';

	let files: FormattedFile[] = [];
	let isLoading = true;
	let error = '';

	async function loadFiles() {
		try {
			isLoading = true;
			error = '';
			files = await getUserFiles();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ошибка при загрузке файлов';
		} finally {
			isLoading = false;
		}
	}

	function downloadFile(base64: string, fileName: string) {
		const binStr = atob(base64);
		const bytes = new Uint8Array(binStr.length);
		for (let i = 0; i < binStr.length; i++) {
			bytes[i] = binStr.charCodeAt(i);
		}
		const blob = new Blob([bytes], {
			type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `formatted_${fileName}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	formattingComplete.subscribe((complete) => {
		if (complete) {
			loadFiles();
			formattingComplete.set(false);
		}
	});

	onMount(() => {
		loadFiles();
	});
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
								<span>Размер: {(file.formattedSize / 1024).toFixed(1)} КБ</span>
							</div>
						</div>
						<button
							class="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
							on:click={() => downloadFile(file.base64, file.fileName)}
						>
							Скачать
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
