<script lang="ts">
	export let title: string;
	export let subtitle: string | undefined = undefined;
	export let type: 'group' | 'teacher' | 'audience' = 'group';

	const typeLabels = {
		group: 'Расписание группы',
		teacher: 'Расписание преподавателя',
		audience: 'Расписание аудитории'
	};
</script>

<div class="flex flex-col justify-center md:items-center">
	<h2
		class="rounded-lg p-4 text-center text-xl font-bold text-white shadow-lg transition sm:mr-0 sm:ml-0 md:mr-20 md:ml-20 md:pr-20 md:pl-20 md:text-xl lg:text-3xl"
		style="background: radial-gradient(rgba(0, 96, 255, 0.74) 10%, rgba(255, 255, 255, 0) 100%);"
	>
		{typeLabels[type]}
		{title}
		{#if subtitle}
			<p class="mt-2 text-sm text-gray-400">
				{subtitle}
			</p>
		{/if}
	</h2>
</div>
