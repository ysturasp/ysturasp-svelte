<script lang="ts">
	import BottomModal from '$lib/components/ui/BottomModal.svelte';
	import { createEventDispatcher } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import type { Settings } from '$lib/stores/settings';
	import { linearStore } from '$lib/stores/linear';
	import LinearServerPicker from './LinearServerPicker.svelte';

	export let isOpen = false;
	export let currentPage: 'students' | 'teachers' | 'audiences' = 'students';
	export let university: 'ystu' | 'yspu' = 'ystu';

	const dispatch = createEventDispatcher();

	let currentSettings: Settings;
	let linearStoreState: { apiKey: string | null } = { apiKey: null };
	let isServerPickerOpen = false;

	settings.subscribe((value) => {
		currentSettings = { ...value };
	});

	linearStore.subscribe((state) => {
		linearStoreState = { apiKey: state.apiKey };
		if (state.apiKey && !currentSettings.linearApiKey) {
			currentSettings.linearApiKey = state.apiKey;
			handleSettingChange();
		}
	});

	function handleClose() {
		if (!isServerPickerOpen) {
			dispatch('close');
		}
	}

	function handleSettingChange() {
		settings.set(currentSettings);
		dispatch('save', currentSettings);
	}

	async function handleLinearApiKeyChange() {
		try {
			if (currentSettings.linearApiKey) {
				await linearStore.setApiKey(currentSettings.linearApiKey);
			} else {
				linearStore.removeApiKey();
			}
			handleSettingChange();
		} catch (error) {
			console.error('Failed to set Linear API key:', error);
			currentSettings.linearApiKey = '';
			handleSettingChange();
		}
	}

	function handleServerSelect(server: string) {
		currentSettings.linearApiServer = server;
		handleSettingChange();
		isServerPickerOpen = false;
	}
</script>

<BottomModal
	{isOpen}
	title="Настройки расписания"
	subtitle="Настройки применяются автоматически"
	onClose={handleClose}
>
	<div class="flex flex-col gap-4">
		<div class="rounded-lg bg-slate-800 p-4">
			<h3 class="mb-2 text-lg font-semibold text-white">Общие настройки</h3>
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<label for="darkModeToggle" class="text-white">Тёмная тема</label>
					<label class="switch">
						<input
							type="checkbox"
							id="darkModeToggle"
							bind:checked={currentSettings.darkTheme}
							on:change={handleSettingChange}
						/>
						<span class="slider round"></span>
					</label>
				</div>
				<div class="flex items-center justify-between">
					<label for="hapticFeedbackToggle" class="text-white">Тактильная отдача</label>
					<label class="switch">
						<input
							type="checkbox"
							id="hapticFeedbackToggle"
							bind:checked={currentSettings.hapticFeedback}
							on:change={handleSettingChange}
						/>
						<span class="slider round"></span>
					</label>
				</div>
				<div class="flex items-center justify-between">
					<label for="lowercaseToggle" class="text-white">Нижний регистр</label>
					<label class="switch">
						<input
							type="checkbox"
							id="lowercaseToggle"
							bind:checked={currentSettings.lowercase}
							on:change={handleSettingChange}
						/>
						<span class="slider round"></span>
					</label>
				</div>
				<div class="flex items-center justify-between">
					<label for="modernFontsToggle" class="text-white">Кастомные шрифты</label>
					<label class="switch">
						<input
							type="checkbox"
							id="modernFontsToggle"
							bind:checked={currentSettings.modernFonts}
							on:change={handleSettingChange}
						/>
						<span class="slider round"></span>
					</label>
				</div>
			</div>
		</div>

		<div class="rounded-lg bg-slate-800 p-4">
			<h3 class="mb-2 text-lg font-semibold text-white">Видимость блоков</h3>
			<div class="space-y-2">
				{#if currentPage === 'students' && university === 'ystu'}
					<div class="flex items-center justify-between">
						<label for="showSubgroups" class="text-white">Распределение подгрупп</label>
						<label class="switch">
							<input
								type="checkbox"
								id="showSubgroups"
								bind:checked={currentSettings.showSubgroups}
								on:change={handleSettingChange}
							/>
							<span class="slider round"></span>
						</label>
					</div>
					<div class="flex items-center justify-between">
						<label for="showWorkload" class="text-white">Статистика нагрузки</label>
						<label class="switch">
							<input
								type="checkbox"
								id="showWorkload"
								bind:checked={currentSettings.showWorkload}
								on:change={handleSettingChange}
							/>
							<span class="slider round"></span>
						</label>
					</div>
				{/if}
				<div class="flex items-center justify-between">
					<label for="showAPILink" class="text-white">Ссылка на API</label>
					<label class="switch">
						<input
							type="checkbox"
							id="showAPILink"
							bind:checked={currentSettings.showAPILink}
							on:change={handleSettingChange}
						/>
						<span class="slider round"></span>
					</label>
				</div>
			</div>
		</div>

		{#if currentPage === 'students'}
			<div class="rounded-lg bg-slate-800 p-4">
				<h3 class="mb-2 text-lg font-semibold text-white">Linear</h3>
				<div class="space-y-2">
					<div class="flex flex-col gap-2">
						<label for="linearApiKey" class="text-white">API Ключ</label>
						<div class="flex gap-2">
							<input
								id="linearApiKey"
								type={currentSettings.showLinearApiKey ? 'text' : 'password'}
								bind:value={currentSettings.linearApiKey}
								class="flex-1 rounded-lg bg-slate-900 p-2 text-white"
								placeholder="Введите API ключ"
							/>
							<button
								on:click={() =>
									(currentSettings.showLinearApiKey =
										!currentSettings.showLinearApiKey)}
								class="rounded-lg bg-slate-600 px-3 py-2 text-white transition-colors hover:bg-slate-500"
								aria-label="Показать/скрыть API ключ"
							>
								<svg
									class="h-5 w-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									></path>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									></path>
								</svg>
							</button>
						</div>
						<p class="text-sm text-slate-400">
							Для получения API ключа перейдите в
							<a
								href="https://linear.app/settings/api"
								target="_blank"
								class="text-blue-400 hover:text-blue-300">настройки Linear</a
							>
						</p>
					</div>
					<div class="flex justify-end gap-2">
						<button
							on:click={() => {
								currentSettings.linearApiKey = '';
								handleLinearApiKeyChange();
							}}
							class="rounded-lg bg-red-600 px-3 py-1 text-sm text-white transition-colors hover:bg-red-700"
						>
							Сбросить ключ
						</button>
						<button
							on:click={handleLinearApiKeyChange}
							class="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700"
						>
							{linearStoreState.apiKey ? 'Обновить ключ' : 'Сохранить ключ'}
						</button>
					</div>

					<div class="flex flex-col gap-2">
						<label for="linearApiServer" class="text-white">Сервер API</label>
						<button
							id="linearApiServer"
							class="flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800"
							on:click={() => (isServerPickerOpen = true)}
						>
							<svg
								class="h-4 w-4 text-slate-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 12h14M12 5l7 7-7 7"
								></path>
							</svg>
							<span class="text-slate-300"
								>{currentSettings.linearApiServer ===
								'https://api-linear-two.vercel.app'
									? 'Прокси-сервер (рекомендуется)'
									: 'Официальный API'}</span
							>
						</button>
						<p class="text-sm text-slate-400">
							Для работы с официальным API может потребоваться VPN. Рекомендуется
							использовать прокси-сервер для работы из России.
						</p>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<div slot="footer" class="flex justify-end">
		<button
			class="w-full rounded-xl bg-gray-600 px-4 py-2 text-white transition-all hover:bg-gray-700"
			on:click={handleClose}
		>
			Закрыть
		</button>
	</div>
</BottomModal>

<LinearServerPicker
	isOpen={isServerPickerOpen}
	onClose={() => (isServerPickerOpen = false)}
	onSelect={handleServerSelect}
	currentServer={currentSettings.linearApiServer}
/>

<style>
	.switch {
		position: relative;
		display: inline-block;
		width: 34px;
		height: 20px;
		flex-shrink: 0;
	}

	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #ccc;
		transition: 0.4s;
		border-radius: 34px;
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 14px;
		width: 14px;
		left: 3px;
		bottom: 3px;
		background-color: white;
		transition: 0.4s;
		border-radius: 50%;
	}

	input:checked + .slider {
		background-color: #2196f3;
	}

	input:checked + .slider:before {
		transform: translateX(14px);
	}

	.slider.round {
		border-radius: 34px;
	}

	.slider.round:before {
		border-radius: 50%;
	}
</style>
