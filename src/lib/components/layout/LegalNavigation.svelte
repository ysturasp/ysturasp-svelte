<script lang="ts">
	export let currentPage: 'terms' | 'privacy' | 'license' = 'terms';
</script>

<div class="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
	<div
		class="rounded-2xl bg-slate-900/95 p-1.5 shadow-lg ring-1 shadow-slate-900/20 ring-blue-500/30 backdrop-blur-sm"
	>
		<div class="flex flex-col items-center gap-1.5 md:flex-row">
			<a
				href="/legal"
				class="flex items-center gap-1.5 rounded-xl px-3 text-white/70 transition-all hover:bg-slate-800 hover:text-white md:py-1"
			>
				<span class="text-lg">📋</span>
				<span class="text-xs md:text-sm">Все документы</span>
			</a>

			<div class="h-[1px] w-full bg-slate-700/50 md:hidden"></div>
			<div class="hidden h-4 w-[1px] bg-slate-700/50 md:block"></div>

			<div class="flex items-center gap-1">
				<a
					href="/legal/terms"
					class="flex items-center gap-1 rounded-xl px-2 py-1 md:gap-1.5 md:px-2.5 {currentPage ===
					'terms'
						? 'bg-blue-500/10 text-white'
						: 'text-white/70 transition-all hover:bg-slate-800 hover:text-white'}"
				>
					<span class="text-lg">📜</span>
					<span class="text-xs md:text-sm">Условия</span>
				</a>

				<a
					href="/legal/privacy"
					class="flex items-center gap-1 rounded-xl px-2 py-1 md:gap-1.5 md:px-2.5 {currentPage ===
					'privacy'
						? 'bg-blue-500/10 text-white'
						: 'text-white/70 transition-all hover:bg-slate-800 hover:text-white'}"
				>
					<span class="text-lg">🔒</span>
					<span class="text-xs md:hidden">Конфид.</span>
					<span class="hidden md:inline md:text-sm">Конфиденциальность</span>
				</a>

				<a
					href="/legal/license"
					class="flex items-center gap-1 rounded-xl px-2 py-1 md:gap-1.5 md:px-2.5 {currentPage ===
					'license'
						? 'bg-blue-500/10 text-white'
						: 'text-white/70 transition-all hover:bg-slate-800 hover:text-white'}"
				>
					<span class="text-lg">⚖️</span>
					<span class="text-xs md:text-sm">Лицензия</span>
				</a>
			</div>
		</div>
	</div>
</div>
