<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import type { SupportRequest } from '$lib/types/support';
	import { onMount } from 'svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { createSupportRequest, getSupportRequests, replyToSupportRequest } from './api-support';

	let message = '';
	let replyMessage = '';
	let isLoading = false;
	let error = '';
	let success = '';
	let requests: SupportRequest[] = [];
	let isLoadingRequests = true;
	let selectedRequestId: string | null = null;
	let isSecurityReport = false;
	let decryptedMessages: { [key: string]: string } = {};

	let userId = page.url.searchParams.get('userId');
	if (!userId && browser) {
		userId = localStorage.getItem('userId');
		if (!userId) {
			userId = crypto.randomUUID();
			localStorage.setItem('userId', userId);
		}
	}
	if (!userId) {
		userId = crypto.randomUUID();
	}

	async function encryptMessage(msg: string): Promise<string> {
		const response = await fetch('/api/encrypt', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ message: msg })
		});

		if (!response.ok) {
			throw new Error('Ошибка шифрования');
		}

		const { encrypted } = await response.json();
		return encrypted;
	}

	async function decryptMessage(encryptedMsg: string): Promise<string> {
		const response = await fetch('/api/decrypt', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ message: encryptedMsg })
		});

		if (!response.ok) {
			throw new Error('Ошибка расшифровки');
		}

		const { decrypted } = await response.json();
		return decrypted;
	}

	async function handleDecrypt(messageId: string, encryptedMsg: string) {
		try {
			const encrypted = encryptedMsg.slice('[SECURITY] '.length);
			const decrypted = await decryptMessage(encrypted);
			decryptedMessages[messageId] = decrypted;
		} catch (e) {
			console.error('Ошибка расшифровки:', e);
		}
	}

	onMount(async () => {
		try {
			const result = await getSupportRequests(userId || undefined, 'web');
			if (result.success && result.requests) {
				requests = result.requests;
			} else {
				console.error('Ошибка загрузки запросов:', result.message);
			}
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
			let finalMessage = message;
			if (isSecurityReport) {
				try {
					const encrypted = await encryptMessage(message);
					finalMessage = `[SECURITY] ${encrypted}`;
				} catch (e) {
					error = 'Ошибка шифрования сообщения';
					isLoading = false;
					return;
				}
			}

			const result = await createSupportRequest({
				message: finalMessage,
				source: 'web',
				isSecurityReport,
				userId: userId || undefined
			});

			if (result.success && result.request) {
				requests = [result.request, ...requests];
				success = 'Сообщение успешно отправлено';
				message = '';
				isSecurityReport = false;
			} else {
				error = result.message || 'Произошла ошибка при отправке сообщения';
			}
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
			const result = await replyToSupportRequest({
				requestId,
				message: replyMessage,
				source: 'web',
				userId: userId || undefined
			});

			if (result.success && result.request) {
				requests = requests.map((req) => (req.id === requestId ? result.request! : req));
				success = 'Сообщение успешно отправлено';
				replyMessage = '';
				selectedRequestId = null;
			} else {
				error = result.message || 'Произошла ошибка при отправке сообщения';
			}
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

					<form on:submit|preventDefault={handleSubmit} class="space-y-4">
						<div>
							<textarea
								bind:value={message}
								placeholder="Опишите проблему или предложение..."
								class="mb-2 h-32 w-full resize-none rounded-xl border border-slate-700 bg-slate-900 p-3 text-white placeholder-slate-400 transition-colors outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
							></textarea>

							<button
								type="button"
								class="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 {isSecurityReport
									? 'border-red-500/40 bg-red-500/10'
									: ''}"
								on:click={() => (isSecurityReport = !isSecurityReport)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d={isSecurityReport
											? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
											: 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z'}
									/>
								</svg>
								{isSecurityReport
									? 'Режим безопасности включен'
									: 'Сообщить об уязвимости'}
							</button>
						</div>

						{#if isSecurityReport}
							<div class="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
								<div class="flex items-start gap-3">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="mt-1 h-5 w-5 flex-shrink-0 text-red-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									<p class="text-sm text-red-400">
										Ваше сообщение будет зашифровано и обработано с повышенным
										приоритетом. Используйте этот режим только для сообщений о
										уязвимостях безопасности
									</p>
								</div>
							</div>
						{/if}

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
										<div class="flex items-center gap-2">
											<span
												class="inline-flex items-center gap-1 {request.status ===
												'answered'
													? 'text-green-500'
													: 'text-yellow-500'} sm:hidden"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-5 w-5"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													stroke-width="2"
												>
													{#if request.status === 'answered'}
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															d="M5 13l4 4L19 7"
														/>
													{:else}
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
														/>
													{/if}
												</svg>
											</span>
											<span class="text-sm text-slate-400"
												>Чат по проблеме: {request.id.split('-')[0]}</span
											>
											{#if request.messages[0]?.message.startsWith('[SECURITY]')}
												<span
													class="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-500"
												>
													Уязвимость
												</span>
											{/if}
										</div>
										<span
											class="hidden items-center gap-1 rounded-full px-2 py-1 text-xs sm:inline-flex {request.status ===
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
										{#each request.messages as message, messageIndex}
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
												{#if message.message.startsWith('[SECURITY]')}
													{#if decryptedMessages[`${request.id}-${messageIndex}`]}
														<p class="text-slate-300">
															{decryptedMessages[
																`${request.id}-${messageIndex}`
															]}
														</p>
													{:else}
														<button
															class="group relative w-full cursor-pointer rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-left transition-all hover:bg-red-500/10"
															on:click={() =>
																handleDecrypt(
																	`${request.id}-${messageIndex}`,
																	message.message
																)}
														>
															<div
																class="break-all text-slate-300 blur-[2px]"
															>
																{message.message.slice(
																	'[SECURITY] '.length
																)}
															</div>
															<div
																class="absolute inset-0 flex items-center justify-center text-red-500 opacity-0 transition-opacity group-hover:opacity-100"
															>
																<span
																	class="rounded-md bg-slate-800/80 px-3 py-1"
																	>Нажмите чтобы расшифровать</span
																>
															</div>
														</button>
													{/if}
												{:else}
													<p class="text-slate-300">{message.message}</p>
												{/if}
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
