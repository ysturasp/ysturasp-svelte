<script>
	let isMobileMenuOpen = false;
	let isClosing = false;

	function toggleMobileMenu() {
		if (!isMobileMenuOpen && !isClosing) {
			isMobileMenuOpen = true;
			isClosing = false;
		} else if (!isClosing) {
			isClosing = true;
		}
	}

	function handleAnimationEnd() {
		if (isClosing) {
			isMobileMenuOpen = false;
			isClosing = false;
		}
	}

	function closeMobileMenu() {
		if (!isClosing) {
			isClosing = true;
		}
	}
</script>

<header class="sticky top-4 z-50 container mx-auto px-3 md:px-0">
	<div
		style="background-color: #1e293bad; backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);"
		class="flex items-center justify-between rounded-2xl px-3 py-2 shadow-xl ring-1 ring-blue-500/50 transition-all md:px-5 md:py-3"
	>
		<nav class="hidden gap-x-2 lg:flex">
			<a
				href="/"
				class="flex items-center text-sm font-semibold text-blue-500 transition-all hover:text-blue-400 md:text-base"
			>
				<img src="/images/cat.png" alt="Logo" class="mr-2 h-10 w-10" />
				<span class="text-sm md:text-base">ystuRASP</span>
			</a>
			<a
				href="/stat"
				class="nav-link flex items-center text-sm text-gray-300 transition-all hover:text-blue-400 md:text-base"
				>Статистика</a
			>
			<a
				href="/rasp"
				class="nav-link flex items-center text-sm text-gray-300 transition-all hover:text-blue-400 md:text-base"
				>Расписание</a
			>
			<a
				href="/campus"
				class="nav-link flex items-center text-sm text-gray-300 transition-all hover:text-blue-400 md:text-base"
				>Кампус</a
			>
			<a
				href="/data"
				class="nav-link flex items-center text-sm text-gray-300 transition-all hover:text-blue-400 md:text-base"
				>Данные</a
			>
			<a
				href="/about"
				class="nav-link flex items-center text-sm text-gray-300 transition-all hover:text-blue-400 md:text-base"
				>О нас</a
			>
		</nav>

		<div class="relative lg:hidden">
			<button
				on:click={toggleMobileMenu}
				class="p-2 transition-all"
				aria-label="Открыть мобильное меню"
			>
				<svg
					class="h-6 w-6 text-gray-200"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					></path>
				</svg>
			</button>
		</div>

		<div class="flex gap-x-2">
			<slot name="online-counter-desktop" />
			<a
				href="https://boosty.to/ysturasp.me/donate"
				class="hero-button rounded-xl border-2 border-blue-700 bg-gradient-to-r from-blue-600 to-blue-700 p-1 text-sm text-white transition-all hover:border-blue-400 md:p-2 md:text-sm"
			>
				Поддержать проект <span class="align-middle text-xl">💸</span>
			</a>
			<a
				href="https://ystu.expo.app"
				target="_blank"
				class="flex items-center justify-center rounded-xl border-2 border-blue-500 bg-slate-900 p-1 text-sm text-white transition-all hover:border-blue-400 md:p-2 md:text-sm"
				aria-label="Открыть профиль"
			>
				<span class="text-xl">👤</span>
			</a>
		</div>
	</div>

	<slot name="online-counter-mobile" />

	<div
		class="mobile-menu absolute right-3 left-3 mt-4 rounded-2xl bg-slate-800 px-3 py-2 shadow-xl ring-1 ring-blue-500/50 md:px-6 md:py-3 lg:hidden {!isMobileMenuOpen
			? 'hidden'
			: ''} {isClosing ? 'hide' : 'show'}"
		on:animationend={handleAnimationEnd}
	>
		<a
			href="/"
			class="block py-2 text-sm font-semibold text-blue-500 md:text-base"
			on:click={closeMobileMenu}>ystuRASP Главная</a
		>
		<a
			href="/stat"
			class="block py-2 text-sm text-gray-300 hover:text-blue-400 md:text-base"
			on:click={closeMobileMenu}>Статистика</a
		>
		<a
			href="/rasp"
			class="block py-2 text-sm text-gray-300 hover:text-blue-400 md:text-base"
			on:click={closeMobileMenu}>Расписание</a
		>
		<a
			href="/campus"
			class="block py-2 text-sm text-gray-300 hover:text-blue-400 md:text-base"
			on:click={closeMobileMenu}>Кампус</a
		>
		<a
			href="/data"
			class="block py-2 text-sm text-gray-300 hover:text-blue-400 md:text-base"
			on:click={closeMobileMenu}>Данные</a
		>
		<a
			href="/about"
			class="block py-2 text-sm text-gray-300 hover:text-blue-400 md:text-base"
			on:click={closeMobileMenu}>О нас</a
		>
	</div>
</header>

<style>
	.show {
		animation: fadeInScale 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
	}

	.hide {
		animation: fadeOutScale 0.2s ease-in forwards;
	}

	@media screen and (min-width: 768px) and (max-width: 1024px) {
		.mobile-menu {
			left: 0 !important;
			right: 0 !important;
		}
	}
</style>
