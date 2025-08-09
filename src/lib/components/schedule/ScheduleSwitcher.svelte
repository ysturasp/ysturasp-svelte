<script lang="ts">
	import type { SemesterInfo } from '$lib/utils/semester';
	import { getCurrentSemester } from '$lib/utils/semester';
	import ScheduleSettings from './ScheduleSettings.svelte';

	export let selectedSemester: SemesterInfo | null = null;
	export let onSemesterChange: (semester: SemesterInfo) => void;
	export let currentPage: 'students' | 'teachers' | 'audiences' = 'students';
	export let university: 'ystu' | 'yspu' = 'ystu';

	let isSettingsOpen = false;

	$: prefix = university === 'yspu' ? '/yspu' : '';

	function handleSettingsSave(event: CustomEvent) {
		const settings = event.detail;
		console.log('Сохранены настройки:', settings);
	}
</script>

<div class="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
	<div
		class="rounded-2xl bg-slate-900/95 p-1.5 shadow-lg ring-1 shadow-slate-900/20 ring-blue-500/30 backdrop-blur-sm"
	>
		<div class="flex flex-col items-center gap-1.5 md:flex-row">
			{#if selectedSemester && selectedSemester.id !== getCurrentSemester().id}
				<button
					class="flex w-full items-center justify-center rounded-lg bg-amber-500/90 px-2.5 py-1 text-sm transition-opacity hover:opacity-80 md:w-auto md:justify-start md:py-2"
					on:click={() => onSemesterChange(getCurrentSemester())}
				>
					<span class="text-black">{selectedSemester.name}</span>
					<span class="mr-1 ml-1 text-black/60">→</span>
					<span class="text-black/60">текущий</span>
				</button>

				<div class="hidden h-4 w-[1px] bg-slate-700/50 md:block"></div>
			{/if}

			<div class="flex items-center gap-1.5">
				<a
					href="{prefix}/rasp"
					class="flex items-center gap-1.5 rounded-xl px-2.5 py-1 {currentPage ===
					'students'
						? 'bg-blue-500/10 text-white'
						: 'text-white/70 transition-all hover:bg-slate-800 hover:text-white'}"
				>
					<span class="text-lg">👨‍💻‍</span>
					<span class="text-xs md:text-sm">Студенты</span>
				</a>

				<a
					href="{prefix}/raspprep"
					class="flex items-center gap-1.5 rounded-xl px-2.5 py-1 {currentPage ===
					'teachers'
						? 'bg-blue-500/10 text-white'
						: 'text-white/70 transition-all hover:bg-slate-800 hover:text-white'}"
				>
					<span class="text-lg">👨‍🏫</span>
					<span class="text-xs md:text-sm">Преподы</span>
				</a>

				<a
					href="{prefix}/raspaudience"
					class="flex items-center gap-1.5 rounded-xl px-2.5 py-1 {currentPage ===
					'audiences'
						? 'bg-blue-500/10 text-white'
						: 'text-white/70 transition-all hover:bg-slate-800 hover:text-white'}"
				>
					<span class="text-lg">🏛️</span>
					<span class="text-xs md:text-sm">Аудитории</span>
				</a>
			</div>

			<div class="h-[1px] w-full bg-slate-700/50 md:hidden"></div>

			<button
				class="flex w-full items-center justify-center gap-1.5 rounded-xl text-white/70 transition-all hover:bg-slate-800 hover:text-white md:hidden md:w-auto"
				on:click={() => (isSettingsOpen = true)}
			>
				<span class="text-lg">⚙️</span>
				<span class="text-xs md:text-sm">Настройки</span>
			</button>
		</div>
	</div>
</div>

<button
	class="fixed right-4 bottom-4 z-50 hidden items-center gap-1.5 rounded-xl bg-slate-900/95 px-2.5 py-1.5 text-white/70 shadow-lg ring-1 ring-blue-500/30 backdrop-blur-sm transition-all hover:bg-slate-800 hover:text-white md:flex"
	on:click={() => (isSettingsOpen = true)}
>
	<span class="text-lg">⚙️</span>
	<span class="text-xs md:text-sm">Настройки</span>
</button>

<ScheduleSettings
	isOpen={isSettingsOpen}
	on:close={() => (isSettingsOpen = false)}
	on:save={handleSettingsSave}
	{currentPage}
	{university}
/>
