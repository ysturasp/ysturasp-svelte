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

<header class="container mx-auto sticky top-4 px-3 md:px-0 z-50">
  <div style="background-color: #1e293bad; backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);"
    class="rounded-2xl px-3 py-2 md:px-5 md:py-3 ring-1 shadow-xl flex justify-between items-center transition-all">
    <nav class="hidden lg:flex gap-x-2">
      <a href="/" class="text-blue-500 font-semibold text-sm md:text-base hover:text-blue-400 transition-all flex items-center">
        <img src="/images/cat.png" alt="Logo" class="w-10 h-10 mr-2" />
        <span class="text-sm md:text-base">ystuRASP</span>
      </a>
      <a href="/stat" class="nav-link text-sm text-gray-300 md:text-base hover:text-blue-400 transition-all flex items-center">Статистика</a>
      <a href="/rasp" class="nav-link text-sm text-gray-300 md:text-base hover:text-blue-400 transition-all flex items-center">Расписание</a>
      <a href="/campus" class="nav-link text-sm text-gray-300 md:text-base hover:text-blue-400 transition-all flex items-center">Кампус</a>
      <a href="/data" class="nav-link text-sm text-gray-300 md:text-base hover:text-blue-400 transition-all flex items-center">Данные</a>
      <a href="/about" class="nav-link text-sm text-gray-300 md:text-base hover:text-blue-400 transition-all flex items-center">О нас</a>
    </nav>

    <div class="relative lg:hidden">
      <button 
        on:click={toggleMobileMenu}
        class="p-2 transition-all"
        aria-label="Открыть мобильное меню"
      >
        <svg class="w-6 h-6 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
    </div>

    <div class="flex gap-x-2">
      <slot name="online-counter-desktop" />
      <a href="https://boosty.to/ysturasp.me/donate"
        class="hero-button p-1 md:p-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl  text-sm md:text-sm transition-all border-2 border-blue-700 hover:border-blue-400">
        Поддержать проект <span class="text-xl align-middle">💸</span>
      </a>
      <a href="https://ystu.expo.app" target="_blank"
        class="p-1 md:p-2 bg-slate-900 text-white rounded-xl  text-sm md:text-sm transition-all flex items-center justify-center border-2 border-blue-500 hover:border-blue-400"
        aria-label="Открыть профиль">
        <span class="text-xl">👤</span>
      </a>
    </div>
  </div>

  <slot name="online-counter-mobile" />

  <div 
    class="md:hidden bg-slate-800 rounded-2xl mt-4 px-3 py-2 md:px-6 md:py-3 ring-1 shadow-xl absolute top-full left-3 right-3 {!isMobileMenuOpen ? 'hidden' : ''} {isClosing ? 'hide' : 'show'}"
    on:animationend={handleAnimationEnd}>
    <a href="/" class="block py-2 text-blue-500 font-semibold text-sm md:text-base" on:click={closeMobileMenu}>ystuRASP Главная</a>
    <a href="/stat" class="block py-2 text-gray-300 hover:text-blue-400 text-sm md:text-base" on:click={closeMobileMenu}>Статистика</a>
    <a href="/rasp" class="block py-2 text-gray-300 hover:text-blue-400 text-sm md:text-base" on:click={closeMobileMenu}>Расписание</a>
    <a href="/campus" class="block py-2 text-gray-300 hover:text-blue-400 text-sm md:text-base" on:click={closeMobileMenu}>Кампус</a>
    <a href="/data" class="block py-2 text-gray-300 hover:text-blue-400 text-sm md:text-base" on:click={closeMobileMenu}>Данные</a>
    <a href="/about" class="block py-2 text-gray-300 hover:text-blue-400 text-sm md:text-base" on:click={closeMobileMenu}>О нас</a>
  </div>
</header>

<style>
  .show {
    animation: fadeInScale 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
  }

  .hide {
    animation: fadeOutScale 0.2s ease-in forwards;
  }
</style> 