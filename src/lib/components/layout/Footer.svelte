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
						aria-label="Telegram"
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
						aria-label="Boosty"
					>
						<div class="h-14 w-14 rounded-xl bg-white p-1">
							<svg
								class="mx-auto my-1 h-10 w-10"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 830.9 1000"
							>
								<path
									fill="#EE7829"
									d="M26.2,597.3L199.1,0h265l-53.6,185.2c-0.6,1-1,2.1-1.3,3.3l-140.7,489h131.3C344.8,814.6,301.9,922.1,271,1000   C28.7,997.2-39.2,823.6,20.2,618.3 M271.9,1000l319.4-460H455.8l117.9-294.7c202.4,21.3,297.2,180.4,241.5,373   c-59.9,207-302.3,381.7-538.3,381.7C275.2,1000,273.6,1000,271.9,1000z"
								/>
							</svg>
						</div>
					</a>
					<a
						href="https://github.com/ysturasp"
						class="text-slate-400 transition-all hover:text-white"
						aria-label="GitHub"
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
				<a
					href="https://stats.uptimerobot.com/COz2FUGsub"
					target="_blank"
					rel="noopener noreferrer"
					class="mt-1 inline-flex items-center gap-2 text-sm text-blue-300 transition-all hover:text-white"
				>
					<span>Проверить статус работы сервисов</span>
				</a>
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
