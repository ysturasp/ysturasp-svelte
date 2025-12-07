<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import BottomModal from '$lib/components/ui/BottomModal.svelte';
	import {
		collectAllUserData,
		encodeMigrationData,
		getNewDomainUrl,
		isNetlifyDomain
	} from '$lib/utils/migration';

	let showModal = $state(false);
	let isRedirecting = $state(false);

	onMount(() => {
		if (browser && isNetlifyDomain()) {
			const migrationCompleted = localStorage.getItem('migration_completed');
			if (!migrationCompleted) {
				showModal = true;
			}
		}
	});

	async function handleRedirect() {
		isRedirecting = true;
		const userData = collectAllUserData();
		const encodedData = await encodeMigrationData(userData);
		const currentPath = $page.url.pathname + $page.url.search;
		const newUrl = getNewDomainUrl(currentPath, encodedData);
		window.location.href = newUrl;
	}

	function handleClose() {
		showModal = false;
	}
</script>

<BottomModal
	isOpen={showModal}
	title="Переезд на новый домен"
	subtitle="Сайт теперь доступен по адресу ysturasp.ru"
	onClose={handleClose}
	showCloseButton={false}
>
	<div class="text-left">
		<p class="mb-4 text-slate-300">
			Мы переехали на новый домен! При переходе все ваши настройки (группа, скрытые предметы и
			другие параметры) будут автоматически перенесены
		</p>
		<div class="mb-4 rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-400">
			⚠️ Старая версия сайта перестанет поддерживаться в ближайшее время. Рекомендуем перейти
			на новый домен
		</div>
	</div>
	<div slot="footer" class="flex flex-col gap-3">
		<button
			onclick={handleRedirect}
			class="w-full rounded-xl bg-blue-600 px-6 py-3 text-white transition-all hover:bg-blue-700 disabled:opacity-50"
			disabled={isRedirecting}
		>
			{isRedirecting ? 'Переход...' : 'Перейти на новый домен'}
		</button>
		<button
			onclick={handleClose}
			class="w-full rounded-xl bg-slate-700 px-6 py-3 text-white transition-all hover:bg-slate-600"
			disabled={isRedirecting}
		>
			Остаться здесь
		</button>
	</div>
</BottomModal>
