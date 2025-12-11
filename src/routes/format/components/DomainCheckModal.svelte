<script lang="ts">
	import BottomModal from '$lib/components/ui/BottomModal.svelte';

	export let isOpen = false;

	function redirectToMain() {
		window.location.href = 'https://ysturasp.ru/format';
	}

	function goBack() {
		window.history.back();
	}
</script>

<BottomModal
	{isOpen}
	title="Сайт переехал"
	subtitle="Используйте основной домен"
	onClose={() => {}}
	checkCanClose={() => false}
	showCloseButton={false}
>
	<div class="space-y-4 py-4">
		<div class="flex justify-center">
			<div class="rounded-full bg-slate-700/50 p-4 ring-1 ring-slate-600/50">
				<svg
					class="h-12 w-12 text-slate-200"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
					/>
				</svg>
			</div>
		</div>
		<p class="text-center text-slate-300">
			Проект теперь находится по адресу <a
				href="https://ysturasp.ru"
				class="font-bold text-white">ysturasp.ru</a
			>.
			<br /><br />
			В целях безопасности и корректной работы (авторизация, оплата), пожалуйста, используйте официальный
			домен.
		</p>
	</div>

	<div slot="footer" class="flex flex-col gap-3">
		<button
			on:click={redirectToMain}
			class="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
		>
			Перейти на ysturasp.ru
		</button>
		<button
			on:click={goBack}
			class="w-full rounded-lg bg-slate-700 px-4 py-2 text-white transition-colors hover:bg-slate-600"
		>
			Назад
		</button>
	</div>
</BottomModal>
