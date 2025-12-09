<script lang="ts">
	import DocumentUploader from './components/DocumentUploader.svelte';
	import FormatRules from './components/FormatRules.svelte';
	import FormatSettings from './components/FormatSettings.svelte';
	import FormattingHistoryCard from './components/FormattingHistoryCard.svelte';
	import AuthButton from './components/AuthButton.svelte';
	import PaymentModal from './components/PaymentModal.svelte';
	import DomainCheckModal from './components/DomainCheckModal.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import PricingSection from './components/PricingSection.svelte';
	import type { FormatParams, FormatLimit } from './api';
	import { defaultFormatParams } from './constants';
	import { auth } from '$lib/stores/auth';
	import { checkFormatLimit } from './api';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { notifications } from '$lib/stores/notifications';
	import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';
	import BottomModal from '$lib/components/ui/BottomModal.svelte';

	let isProcessing = false;
	let errorMessage = '';
	let downloadData: { base64: string; fileName: string } | null = null;
	let isComplete = false;
	let formatParams: FormatParams = JSON.parse(JSON.stringify(defaultFormatParams));
	let isSettingsOpen = false;
	let isPaymentModalOpen = false;
	let selectedFormatsCount = import.meta.env.DEV ? 1 : 10;
	let formatLimit: FormatLimit = { can: true, remaining: 0 };
	let isSuccessModalOpen = false;
	let successModalMessage = '';
	let isErrorModalOpen = false;
	let errorModalMessage = '';
	let isDomainCheckModalOpen = false;
	let authSectionRef: HTMLDivElement | null = null;

	onMount(() => {
		if (
			window.location.hostname !== 'ysturasp.ru' &&
			window.location.hostname !== 'localhost'
		) {
			isDomainCheckModalOpen = true;
		}

		auth.checkAuth();

		if (page.url.searchParams.get('payment') === 'success') {
			handlePaymentReturn();
		}
	});

	$: if (!$auth.loading && $auth.authenticated) {
		checkLimit();
	}

	function requireAuth() {
		notifications.add('Авторизуйтесь, чтобы пополнить форматирования', 'info');
		if (authSectionRef) {
			authSectionRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	async function checkLimit() {
		if ($auth.authenticated) {
			formatLimit = await checkFormatLimit();
		}
	}

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

	async function handleComplete() {
		isComplete = true;
		await checkLimit();
	}

	function handleFormatParamsChange(event: CustomEvent<FormatParams>) {
		formatParams = event.detail;
	}

	function handleLimitExceeded(event: CustomEvent<{ remaining: number }>) {
		isPaymentModalOpen = true;
		formatLimit.remaining = event.detail.remaining;
	}

	function handlePaymentModalClose() {
		isPaymentModalOpen = false;
		checkLimit();
	}

	function handlePaymentError(event: CustomEvent<{ message: string }>) {
		errorModalMessage = event.detail.message;
		isErrorModalOpen = true;
	}

	async function handlePaymentReturn() {
		const url = new URL(page.url);
		url.searchParams.delete('payment');
		goto(url.pathname + url.search, { replaceState: true, noScroll: true });

		let paymentId: string | null = null;

		try {
			paymentId = window.localStorage.getItem('lastPaymentId');
		} catch (error) {
			console.warn('Не удалось прочитать идентификатор платежа:', error);
		}

		if (!paymentId) {
			await checkLimit();
			notifications.add(
				'Платеж обрабатывается. Лимиты обновятся автоматически после подтверждения.',
				'info'
			);
			return;
		}

		try {
			const response = await fetch(`/api/payment/status?paymentId=${paymentId}`);
			const data = await response.json();

			if (!response.ok) {
				console.error('Ошибка ответа при проверке платежа:', data?.error);
				errorModalMessage = 'Не удалось проверить статус платежа. Попробуйте позже.';
				isErrorModalOpen = true;
			} else if (data.status === 'succeeded') {
				successModalMessage = 'Платеж успешно обработан! Форматирования добавлены.';
				isSuccessModalOpen = true;
			} else {
				notifications.add(
					'Платеж все еще обрабатывается. Мы обновим лимиты как только он завершится.',
					'info'
				);
			}
		} catch (error) {
			console.error('Ошибка проверки статуса платежа:', error);
			errorModalMessage = 'Не удалось проверить статус платежа. Попробуйте позже.';
			isErrorModalOpen = true;
		} finally {
			try {
				window.localStorage.removeItem('lastPaymentId');
			} catch (error) {
				console.warn('Не удалось удалить идентификатор платежа:', error);
			}
			await checkLimit();
		}
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
				<div class="mb-4 border-b border-slate-700 pb-4">
					<div class="flex items-center justify-center md:justify-start">
						<h2 class="text-4xl font-semibold text-white">📄</h2>
						<h2 class="ml-2 text-2xl font-semibold text-white md:text-4xl">
							Форматирование документов
						</h2>
					</div>
					<p class="mt-2 text-center text-slate-400 md:text-left">
						Автоматическое форматирование по стандартам оформления работ
					</p>
				</div>

				<div class="mb-4 rounded-xl bg-slate-700/30 p-4 md:p-5" bind:this={authSectionRef}>
					{#if $auth.authenticated}
						<div
							class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
						>
							<div
								class="flex flex-col items-center gap-3 rounded-lg bg-slate-700/50 p-3 md:flex-row md:gap-6 md:bg-transparent md:p-0 md:ring-0"
							>
								<div class="text-center md:text-right">
									<span
										class="block text-xs tracking-wider text-slate-400 uppercase"
										>Доступно</span
									>
									<span class="text-xl font-bold text-white"
										>{formatLimit.remaining || 0}
										<span class="text-sm font-normal text-slate-400">док.</span
										></span
									>
								</div>
								<div class="hidden h-8 w-px bg-slate-600 md:block"></div>
								<button
									on:click={() => {
										if (!$auth.authenticated) {
											requireAuth();
											return;
										}
										isPaymentModalOpen = true;
									}}
									class="w-full rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-blue-500 md:w-auto"
								>
									Пополнить
								</button>
							</div>

							<div
								class="flex flex-col items-center gap-3 md:flex-row md:justify-start"
							>
								<AuthButton />
							</div>
						</div>
					{:else}
						<div
							class="flex flex-col items-center justify-center gap-4 py-2 text-center"
						>
							<div class="max-w-md text-slate-300">
								<p class="mb-3">
									Для начала работы необходимо авторизоваться. Это позволит
									сохранять историю и управлять лимитами.
								</p>
							</div>
							<AuthButton />
						</div>
					{/if}
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
						on:limitExceeded={handleLimitExceeded}
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

			<PricingSection
				remaining={formatLimit.remaining || 0}
				on:openPayment={(event) => {
					if (!$auth.authenticated) {
						requireAuth();
						return;
					}
					selectedFormatsCount = event.detail.docs;
					isPaymentModalOpen = true;
				}}
			/>

			<FormatRules />
			<FormattingHistoryCard />
		</div>
	</main>

	<Footer />

	<PaymentModal
		isOpen={isPaymentModalOpen}
		remaining={formatLimit.remaining || 0}
		formatsCount={selectedFormatsCount}
		on:close={handlePaymentModalClose}
		on:error={handlePaymentError}
	/>
</PageLayout>

<BottomModal
	isOpen={isSuccessModalOpen}
	title="Успешно!"
	subtitle={successModalMessage}
	subtitleClass="text-green-400"
	onClose={() => {
		isSuccessModalOpen = false;
		checkLimit();
	}}
>
	<div class="flex items-center justify-center py-4">
		<svg class="h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			></path>
		</svg>
	</div>
	<div slot="footer">
		<button
			on:click={() => {
				isSuccessModalOpen = false;
				checkLimit();
			}}
			class="w-full rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
		>
			Отлично!
		</button>
	</div>
</BottomModal>

<BottomModal
	isOpen={isErrorModalOpen}
	title="Ошибка"
	subtitle={errorModalMessage}
	subtitleClass="text-red-400"
	onClose={() => (isErrorModalOpen = false)}
>
	<div class="flex items-center justify-center py-4">
		<svg class="h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
			></path>
		</svg>
	</div>
	<div slot="footer">
		<button
			on:click={() => (isErrorModalOpen = false)}
			class="w-full rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
		>
			Понятно
		</button>
	</div>
</BottomModal>

<DomainCheckModal isOpen={isDomainCheckModalOpen} />

<NotificationsContainer />
