<script lang="ts">
	export let viewMode: 'all' | 'actual';
	export let onToggle: (mode: 'all' | 'actual') => void;
	export let onInfoClick: () => void;
</script>

<div class="flex items-center justify-center">
	<div class="flex items-center rounded-2xl bg-slate-800 p-2">
		<button
			class="mr-2 rounded-2xl px-4 py-2 transition-all {viewMode === 'all'
				? 'bg-blue-700 text-white'
				: 'bg-gray-700 text-gray-400'}"
			on:click={() => onToggle('all')}
		>
			<span class="block md:hidden">Общее</span>
			<span class="hidden md:block">Общее расписание</span>
		</button>
		<button
			class="rounded-2xl px-4 py-2 transition-all {viewMode === 'actual'
				? 'bg-blue-700 text-white'
				: 'bg-gray-700 text-gray-400'}"
			on:click={() => onToggle('actual')}
		>
			<span class="block md:hidden">По дате</span>
			<span class="hidden md:block">Актуальное по дате</span>
		</button>
		<button
			class="p-2 text-gray-400 transition-all hover:text-white"
			on:click={onInfoClick}
			aria-label="Информация о режимах просмотра"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-7 w-7"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
					clip-rule="evenodd"
				/>
			</svg>
		</button>
	</div>
</div>
