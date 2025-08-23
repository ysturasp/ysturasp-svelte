<script lang="ts">
	import { formatDocument, type FormatParams } from '../api';
	import { createEventDispatcher } from 'svelte';
	import ProcessingSteps from './ProcessingSteps.svelte';
	import { formattingComplete } from '../stores';

	const dispatch = createEventDispatcher<{
		error: string;
		processing: boolean;
		downloadReady: { base64: string; fileName: string };
		complete: void;
	}>();

	export let formatParams: FormatParams | undefined = undefined;

	let dropZone: HTMLDivElement;
	let fileInput: HTMLInputElement;
	let isDragOver = false;
	let isProcessing = false;
	let currentStep = '';
	let isComplete = false;
	let responseReceived = false;

	const TOTAL_TIME = 40000;
	const stepTimes = {
		upload: 5000,
		analyze: 10000,
		format: 15000,
		save: 1500
	};

	function reset() {
		isProcessing = false;
		currentStep = '';
		isComplete = false;
		responseReceived = false;
		dispatch('processing', false);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
		const files = e.dataTransfer?.files;
		if (files?.length) handleFile(files[0]);
	}

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const files = input.files;
		if (files?.length) {
			handleFile(files[0]);
			input.value = '';
		}
	}

	async function finishSaving() {
		currentStep = 'save';
		await new Promise((resolve) => setTimeout(resolve, stepTimes.save));
		isComplete = true;
		isProcessing = false;
		dispatch('complete');
		formattingComplete.set(true);
	}

	async function runAnimation() {
		const startTime = Date.now();

		currentStep = 'upload';
		await new Promise((resolve) => setTimeout(resolve, stepTimes.upload));

		currentStep = 'analyze';
		await new Promise((resolve) => setTimeout(resolve, stepTimes.analyze));

		currentStep = 'format';

		while (
			!responseReceived &&
			Date.now() - startTime < stepTimes.upload + stepTimes.analyze + stepTimes.format
		) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		while (!responseReceived) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		await finishSaving();
	}

	async function handleFile(file: File) {
		if (!file.name.endsWith('.docx')) {
			dispatch('error', 'Пожалуйста, загрузите файл формата .docx');
			return;
		}

		try {
			reset();
			isProcessing = true;
			dispatch('error', '');
			dispatch('downloadReady', { base64: '', fileName: '' });
			dispatch('processing', true);

			const base64 = await readFileAsBase64(file);
			const formatPromise = formatDocument(base64, formatParams, file.name);
			const animationPromise = runAnimation();

			const result = await formatPromise;

			if (!result.success || !result.formattedBase64) {
				throw new Error(result.error || 'Ошибка при обработке файла');
			}

			responseReceived = true;
			dispatch('downloadReady', {
				base64: result.formattedBase64,
				fileName: file.name
			});

			await animationPromise;
		} catch (err) {
			dispatch('error', err instanceof Error ? err.message : 'Неизвестная ошибка');
			reset();
		}
	}

	function readFileAsBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const base64 = reader.result?.toString().split(',')[1];
				if (base64) resolve(base64);
				else reject(new Error('Ошибка чтения файла'));
			};
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}
</script>

<div class="flex flex-col gap-6">
	<div
		bind:this={dropZone}
		role="button"
		tabindex="0"
		class="relative flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all {isDragOver
			? 'border-blue-400 bg-blue-500/10'
			: isProcessing
				? 'border-slate-700 bg-slate-800/50'
				: 'cursor-pointer border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/5'}"
		class:drag-over={isDragOver}
		on:click={() => {
			if (!isProcessing && fileInput) {
				fileInput.click();
			}
		}}
		on:keydown={(e) => {
			if (!isProcessing && fileInput && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				fileInput.click();
			}
		}}
		on:dragover={handleDragOver}
		on:dragleave={handleDragLeave}
		on:drop={handleDrop}
	>
		{#if isProcessing || isComplete}
			<ProcessingSteps {currentStep} {isProcessing} {isComplete} />
			<div class="mt-2 text-center">
				<span class="text-sm text-slate-400">
					{#if isComplete}
						Перетащите другой файл или нажмите чтобы выбрать
					{:else}
						Подождите, идет форматирование...
					{/if}
				</span>
			</div>
		{:else}
			<div class="flex flex-col items-center gap-2 text-center">
				<svg
					class="h-12 w-12 text-blue-400"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="17 8 12 3 7 8" />
					<line x1="12" y1="3" x2="12" y2="15" />
				</svg>
				<span class="p-2 text-lg font-medium text-blue-400">
					Перетащите файл сюда или нажмите для выбора
				</span>
				<span class="text-sm text-slate-400"> Поддерживаются файлы формата .docx </span>
			</div>
		{/if}
	</div>

	<input
		bind:this={fileInput}
		type="file"
		accept=".docx"
		class="hidden"
		on:change={handleFileInput}
		disabled={isProcessing}
	/>
</div>

<style>
	.drag-over {
		border-color: #60a5fa;
		background-color: rgba(59, 130, 246, 0.2);
	}
</style>
