<script lang="ts">
	import DocumentUploader from './components/DocumentUploader.svelte';
	import FormatRules from './components/FormatRules.svelte';
	import FormatSettings from './components/FormatSettings.svelte';
	import FormattingHistory from './components/FormattingHistory.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import type { FormatParams } from './api';
	import { defaultFormatParams } from './constants';

	let isProcessing = false;
	let errorMessage = '';
	let downloadData: { base64: string; fileName: string } | null = null;
	let isComplete = false;
	let formatParams: FormatParams = JSON.parse(JSON.stringify(defaultFormatParams));
	let isSettingsOpen = false;

	function handleError(event: CustomEvent<string>) {
		errorMessage = event.detail;
		if (errorMessage) {
			downloadData = null;
			isComplete = false;
		}
	}

	function handleProcessing(event: CustomEvent<boolean>) {
		isProcessing = event.detail;
		if (isProcessing) {
			downloadData = null;
			errorMessage = '';
		}
	}

	function handleDownloadReady(event: CustomEvent<{ base64: string; fileName: string }>) {
		const { base64, fileName } = event.detail;
		downloadData = base64 && fileName ? { base64, fileName } : null;
	}

	function handleComplete() {
		isComplete = true;
	}

	function handleFormatParamsChange(event: CustomEvent<FormatParams>) {
		formatParams = event.detail;
	}

	function downloadFile() {
		if (!downloadData) return;

		const { base64, fileName } = downloadData;
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
</script>

<svelte:head>
	<title>Форматирование отчётов | ysturasp</title>
	<meta name="description" content="Форматирование отчётов по стандартам оформления работ" />
	<meta
		name="keywords"
		content="сто ягту, отчёты ягту, отчёты ягту форматирование, правила оформления отчётов ягту, форматирование отчётов, стандарты оформления работ, форматирование документов, форматирование отчётов по стандартам, форматирование отчётов по стандартам оформления работ"
	/>
	<meta property="og:title" content="Форматирование отчётов | ysturasp" />
	<meta
		property="og:description"
		content="Форматирование отчётов по стандартам оформления работ"
	/>
</svelte:head>

<PageLayout>
	<Header />

	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		<div class="mt-8 space-y-4">
			<div class="rounded-2xl bg-slate-800 p-4 md:p-6">
				<div class="mb-6 flex items-center justify-between border-b border-slate-700 pb-4">
					<div class="flex items-center">
						<h2 class="text-4xl font-semibold text-white">📄</h2>
						<h2 class="ml-2 text-2xl font-semibold text-white md:text-4xl">
							Форматирование документов
						</h2>
					</div>
				</div>

				<div class="rounded-xl bg-slate-700/30 p-4">
					<h3 class="text-center text-lg font-medium text-white">
						Автоматическое форматирование по стандартам оформления работ
					</h3>
				</div>

				<div class="mt-4">
					<FormatSettings
						{formatParams}
						isOpen={isSettingsOpen}
						on:change={handleFormatParamsChange}
					/>
				</div>

				<div class="mt-4">
					<DocumentUploader
						{formatParams}
						on:error={handleError}
						on:processing={handleProcessing}
						on:downloadReady={handleDownloadReady}
						on:complete={handleComplete}
					/>
				</div>

				{#if downloadData}
					<div
						class="mt-4 flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-green-300"
					>
						<svg class="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						<span>Документ готов!</span>
						<button
							class="ml-auto rounded-lg bg-green-500 px-4 py-1 text-sm text-white transition-colors hover:bg-green-400"
							on:click={downloadFile}
						>
							Скачать
						</button>
					</div>
				{/if}

				{#if errorMessage}
					<div
						class="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400"
					>
						<div class="flex items-center gap-2">
							<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clip-rule="evenodd"
								/>
							</svg>
							<span>{errorMessage}</span>
						</div>
					</div>
				{/if}

				<div
					class="mt-4 flex items-center gap-2 rounded-lg bg-blue-500/10 p-3 text-sm text-blue-300"
				>
					<svg class="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>
						ysturasp может использовать загруженные документы для улучшения работы
						алгоритма форматирования
					</span>
				</div>
			</div>

			<FormatRules />
			<FormattingHistory />
		</div>
	</main>

	<Footer />
</PageLayout>
