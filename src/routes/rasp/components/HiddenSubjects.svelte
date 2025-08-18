<script lang="ts">
	import { hiddenSubjects, restoreAllSubjects, toggleSubjectVisibility } from '../stores';
	import { quintOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';
	import { LessonTypes } from '$lib/types/schedule';

	export let selectedGroup: string;
	let showSubjectsList = false;

	$: hiddenSubjectsForGroup = $hiddenSubjects[selectedGroup] || [];
	$: hasHiddenSubjects = hiddenSubjectsForGroup.length > 0;

	function toggleList() {
		showSubjectsList = !showSubjectsList;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && showSubjectsList) {
			showSubjectsList = false;
		}
	}

	function getLessonTypeInfo(type: number) {
		const label = LessonTypes[type] || 'Занятие';

		switch (type) {
			case 2:
				return { color: 'text-green-400', label };
			case 4:
				return { color: 'text-yellow-400', label };
			case 8:
				return { color: 'text-blue-400', label };
			case 1:
				return { color: 'text-purple-400', label };
			case 5:
				return { color: 'text-pink-400', label };
			case 6:
				return { color: 'text-indigo-400', label };
			case 7:
				return { color: 'text-orange-400', label };
			case 3:
				return { color: 'text-red-400', label };
			case 9:
				return { color: 'text-gray-400', label };
			default:
				return { color: 'text-slate-400', label };
		}
	}
</script>

{#if hasHiddenSubjects}
	<div
		class="relative mt-4 rounded-lg bg-slate-800"
		on:click|stopPropagation
		on:keydown|stopPropagation
		role="button"
		tabindex="0"
	>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<svg
					class="h-5 w-5 text-yellow-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
					/>
				</svg>
				<span class="text-yellow-400">Скрытые ({hiddenSubjectsForGroup.length})</span>
			</div>
			<div class="flex items-center gap-2">
				<button
					on:click|stopPropagation={toggleList}
					class="flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-1 text-sm text-white transition-all hover:bg-slate-600"
				>
					{showSubjectsList ? 'Скрыть' : 'Открыть'}
					<svg
						class="h-4 w-4 transition-transform duration-200 {showSubjectsList
							? 'rotate-180'
							: ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>
				<button
					on:click|stopPropagation={() => restoreAllSubjects(selectedGroup)}
					class="rounded-lg bg-yellow-600 px-3 py-1 text-sm text-white transition-all hover:bg-yellow-500"
				>
					Вернуть
				</button>
			</div>
		</div>

		{#if showSubjectsList}
			<div
				transition:scale={{
					duration: 200,
					opacity: 0,
					start: 0.95,
					easing: quintOut
				}}
			>
				<div class="mt-4 grid gap-2">
					{#each hiddenSubjectsForGroup as subject}
						{@const typeInfo = getLessonTypeInfo(subject.type)}
						<div class="flex items-center justify-between rounded-xl bg-slate-900 p-4">
							<div class="flex flex-col gap-0.5">
								<span class="text-sm text-white"
									>{subject.lessonName || 'Название предмета не указано'}</span
								>
								<span class="text-xs text-gray-400">{subject.teacher}</span>
								<span class="text-xs {typeInfo.color}">{typeInfo.label}</span>
							</div>
							<button
								on:click|stopPropagation={() =>
									toggleSubjectVisibility(selectedGroup, subject)}
								class="rounded-lg bg-slate-700 px-2 py-1 text-xs text-white transition-all hover:bg-slate-600"
							>
								Вернуть
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}

<svelte:window
	on:click={(e) => {
		const target = e.target as Element;
		if (!target?.closest('.bg-slate-800')) {
			showSubjectsList = false;
		}
	}}
	on:keydown={handleKeydown}
/>
