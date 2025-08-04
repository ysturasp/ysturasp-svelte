<script lang="ts">
	export let variant: 'desktop' | 'mobile' = 'desktop';
	export let currentPage: 'ystu' | 'yspu' = 'ystu';
	export let pageType: 'students' | 'teachers' | 'audience' = 'students';

	const links = {
		ystu: {
			students: '/rasp',
			teachers: '/raspprep',
			audience: '/raspaudience'
		},
		yspu: {
			students: '/yspu/rasp',
			teachers: '/yspu/raspprep',
			audience: '/yspu/raspaudience'
		}
	};
</script>

{#if variant === 'desktop'}
	<div class="flex items-center gap-x-2 border-r border-slate-700 pr-2">
		<div class="flex items-center gap-x-2">
			<a
				class="{currentPage === 'ystu'
					? 'font-semibold text-blue-500'
					: ''} flex items-center text-base transition-all hover:text-blue-400"
				href={links.ystu[pageType]}
			>
				ЯГТУ
			</a>
		</div>
		<div class="flex items-center gap-x-2">
			<a
				class="{currentPage === 'yspu'
					? 'font-semibold text-blue-500'
					: ''} flex items-center text-base transition-all hover:text-blue-400"
				href={links.yspu[pageType]}
			>
				ЯГПУ
			</a>
		</div>
	</div>
{:else}
	<div class="mb-2 flex justify-center gap-4 border-b border-slate-700 pb-2">
		<div class="flex items-center gap-2">
			<a
				class={currentPage === 'ystu'
					? 'font-semibold text-blue-500'
					: 'text-gray-400 hover:text-blue-400'}
				href={links.ystu[pageType]}>ЯГТУ</a
			>
		</div>
		<div class="flex items-center gap-2">
			<a
				class={currentPage === 'yspu'
					? 'font-semibold text-blue-500'
					: 'text-gray-400 hover:text-blue-400'}
				href={links.yspu[pageType]}>ЯГПУ</a
			>
		</div>
	</div>
{/if}
