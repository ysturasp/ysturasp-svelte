<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import type { SupportRequest } from '$lib/types/support';
	import { onMount } from 'svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	let message = '';
	let replyMessage = '';
	let isLoading = false;
	let error = '';
	let success = '';
	let requests: SupportRequest[] = [];
	let isLoadingRequests = true;
	let selectedRequestId: string | null = null;

	const SCRIPT_URL =
		'https://script.google.com/macros/s/AKfycbzUBBED-O4sguawuonirKUPPXl3JF2CakvwhmxAyIF0Ldw8wu_AlbtDP4FzbdvBBedebw/exec';

	onMount(async () => {
		try {
			const response = await fetch(SCRIPT_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'text/plain;charset=utf-8'
				},
				body: JSON.stringify({
					action: 'getRequests',
					source: 'web'
				})
			});

			if (!response.ok) throw new Error('Ошибка загрузки');

			const data = await response.json();
			requests = data.requests;
		} catch (e) {
			console.error(e);
		} finally {
			isLoadingRequests = false;
		}
	});

	async function handleSubmit() {
		if (!message.trim()) {
			error = 'Сообщение не может быть пустым';
			return;
		}

		isLoading = true;
		error = '';
		success = '';

		try {
			const response = await fetch(SCRIPT_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'text/plain;charset=utf-8'
				},
				body: JSON.stringify({
					action: 'support',
					message: message,
					source: 'web'
				})
			});

			if (!response.ok) throw new Error('Ошибка отправки');

			const data = await response.json();
			requests = [data.request, ...requests];
			success = 'Сообщение успешно отправлено';
			message = '';
		} catch (e) {
			error = 'Произошла ошибка при отправке сообщения';
			console.error(e);
		} finally {
			isLoading = false;
		}
	}

	async function handleReply(requestId: string) {
		if (!replyMessage.trim()) {
			error = 'Сообщение не может быть пустым';
			return;
		}

		isLoading = true;
		error = '';
		success = '';

		try {
			const response = await fetch(SCRIPT_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'text/plain;charset=utf-8'
				},
				body: JSON.stringify({
					action: 'reply',
					requestId,
					message: replyMessage,
					source: 'web'
				})
			});

			if (!response.ok) throw new Error('Ошибка отправки');

			const data = await response.json();
			requests = requests.map((req) => (req.id === requestId ? data.request : req));
			success = 'Сообщение успешно отправлено';
			replyMessage = '';
			selectedRequestId = null;
		} catch (e) {
			error = 'Произошла ошибка при отправке сообщения';
			console.error(e);
		} finally {
			isLoading = false;
		}
	}
</script>

<PageLayout>
	<div class="min-h-screen bg-slate-900">
		<Header />

		<div class="container mx-auto px-4 py-8">
			<div class="mx-auto max-w-2xl">
				<h1 class="mb-4 text-3xl font-bold text-white">Поддержка</h1>

				<div class="mb-6 rounded-2xl bg-slate-800 p-4">
					<p class="mb-2 text-slate-300">
						Если возникли проблемы или есть предложения по улучшению сервиса, напишите
						нам - мы постараемся ответить как можно быстрее
					</p>

					<form on:submit|preventDefault={handleSubmit} class="space-y-2">
						<div>
							<textarea
								bind:value={message}
								placeholder="Опишите проблему или предложение..."
								class="h-32 w-full resize-none rounded-xl border border-slate-700 bg-slate-900 p-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
							></textarea>
						</div>

						{#if error}
							<div class="text-sm text-red-500">{error}</div>
						{/if}

						{#if success}
							<div class="text-sm text-green-500">{success}</div>
						{/if}

						<button
							type="submit"
							disabled={isLoading}
							class="w-full rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isLoading ? 'Отправка...' : 'Отправить'}
						</button>
					</form>
				</div>

				<div class="rounded-2xl bg-slate-800 p-4">
					<h2 class="mb-4 text-xl font-semibold text-white">История обращений</h2>
					{#if isLoadingRequests}
						<div class="text-center text-slate-400">Загрузка...</div>
					{:else if requests.length === 0}
						<div class="text-center text-slate-400">У вас пока нет обращений</div>
					{:else}
						<div class="space-y-2">
							{#each requests as request}
								<div class="rounded-xl bg-slate-900 p-4">
									<div class="mb-2 flex items-center justify-between">
										<span class="text-sm text-slate-400"
											>Чат по проблеме: {request.id.split('-')[0]}</span
										>
										<span
											class="rounded-full px-2 py-1 text-xs {request.status ===
											'answered'
												? 'bg-green-500/10 text-green-500'
												: 'bg-yellow-500/10 text-yellow-500'}"
										>
											{request.status === 'answered'
												? 'Отвечено'
												: 'Ожидает ответа'}
										</span>
									</div>

									<div class="space-y-3">
										{#each request.messages as message}
											<div
												class="rounded-lg {message.isAdmin
													? 'bg-blue-500/10'
													: 'bg-slate-800'} p-3"
											>
												<div class="mb-1 text-sm text-slate-400">
													{new Date(message.createdAt).toLocaleString()}
													{#if message.isAdmin}
														<span class="ml-1 text-blue-400"
															>(Поддержка)</span
														>
													{/if}
												</div>
												<p class="text-slate-300">{message.message}</p>
											</div>
										{/each}
									</div>

									{#if selectedRequestId === request.id}
										<form
											on:submit|preventDefault={() => handleReply(request.id)}
											class="mt-3 space-y-3"
										>
											<textarea
												bind:value={replyMessage}
												placeholder="Ваш ответ..."
												class="h-24 w-full resize-none rounded-lg border border-slate-700 bg-slate-800 p-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
											></textarea>
											<div class="flex justify-end gap-2">
												<button
													type="button"
													on:click={() => {
														selectedRequestId = null;
														replyMessage = '';
													}}
													class="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600"
													>Отмена</button
												>
												<button
													type="submit"
													disabled={isLoading}
													class="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
													>{isLoading
														? 'Отправка...'
														: 'Ответить'}</button
												>
											</div>
										</form>
									{:else}
										<button
											on:click={() => (selectedRequestId = request.id)}
											class="mt-3 text-sm text-blue-400 hover:text-blue-300"
											>Ответить</button
										>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<div class="mt-6 rounded-2xl bg-slate-800 p-4">
					<h2 class="mb-4 text-xl font-semibold text-white">Другие способы связи</h2>
					<div class="space-y-3">
						<a
							href="https://t.me/ysturasp_bot"
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center text-blue-400 transition-colors hover:text-blue-300"
						>
							<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.145.118.181.344.203.483.023.139.041.454.041.454z"
								/>
							</svg>
							Telegram бот
						</a>
						<a
							href="https://t.me/ysturasp"
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center text-blue-400 transition-colors hover:text-blue-300"
						>
							<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.145.118.181.344.203.483.023.139.041.454.041.454z"
								/>
							</svg>
							Telegram канал
						</a>
						<a
							href="https://github.com/ysturasp/ysturasp-svelte"
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center text-blue-400 transition-colors hover:text-blue-300"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="mr-2 h-5 w-5"
								fill="currentColor"
								viewBox="0 0 16 16"
							>
								<path
									d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"
								/>
							</svg>
							GitHub
						</a>
					</div>
				</div>
			</div>
		</div>

		<Footer />
	</div>
</PageLayout>
