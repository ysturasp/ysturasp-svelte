<script lang="ts">
	import Dropdown from '$lib/components/ui/Dropdown.svelte';

	export let class_name = '';

	const legalItems = [
		{
			href: '/legal/terms',
			text: 'Условия использования'
		},
		{
			href: '/legal/privacy',
			text: 'Политика конфиденциальности'
		},
		{
			href: '/legal/license',
			text: 'Лицензионное соглашение'
		}
	];
</script>

<footer class="mt-12 bg-slate-800 py-6 {class_name}">
	<div class="container mx-auto px-4">
		<div class="flex flex-wrap items-center justify-between">
			<div class="w-full text-center md:w-1/3 md:text-left">
				<h2 class="text-lg font-bold text-white">ysturasp</h2>
				<p class=" text-slate-400">Экосистема для студентов</p>
				<a href="/support" class="text-slate-300 transition-all hover:text-white">
					Написать в поддержку
				</a>
			</div>
			<div class="mt-4 w-full text-center md:mt-0 md:w-1/3">
				<nav class="flex justify-center gap-4">
					<a
						href="https://t.me/ysturasp"
						class="text-slate-400 transition-all hover:text-white"
					>
						<div class="h-14 w-14 rounded-xl bg-white p-1">
							<img
								src="https://cdn-icons-png.flaticon.com/512/2111/2111646.png"
								alt="Telegram"
								class="mx-auto my-1 h-10 w-10"
							/>
						</div>
					</a>
					<a
						href="https://boosty.to/ysturasp.me"
						class="text-slate-400 transition-all hover:text-white"
					>
						<div class="h-14 w-14 rounded-xl bg-white p-1">
							<img
								src="https://boosty.to/favicon.ico"
								alt="Boosty"
								class="mx-auto my-1 h-10 w-10"
							/>
						</div>
					</a>
					<a
						href="https://github.com/ysturasp"
						class="text-slate-400 transition-all hover:text-white"
					>
						<div class="h-14 w-14 rounded-xl bg-white p-1">
							<img
								src="/images/github-mark.png"
								alt="GitHub"
								class="mx-auto my-1 h-10 w-10"
							/>
						</div>
					</a>
				</nav>
			</div>
			<div class="mt-4 w-full text-center md:mt-0 md:w-1/3 md:text-right">
				<div class="flex justify-center md:justify-end">
					<Dropdown
						title="Юридическая информация"
						titleHref="/legal"
						items={legalItems}
					/>
				</div>
				<p class="text-slate-400">© 2024 Made with ❤️ by ysturasp</p>
				<a
					href="/changelog"
					class="group inline-flex items-center text-blue-400 transition-all hover:text-blue-300"
				>
					<span class="mr-2">История изменений</span>
					<svg
						class="h-5 w-5 transform transition-transform group-hover:translate-x-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 7l5 5m0 0l-5 5m5-5H6"
						></path>
					</svg>
				</a>
			</div>
		</div>
	</div>
</footer>
