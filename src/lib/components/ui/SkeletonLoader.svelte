<script lang="ts">
	export let variant:
		| 'text'
		| 'title'
		| 'button'
		| 'card'
		| 'lesson'
		| 'day-header'
		| 'stats-card'
		| 'form-field'
		| 'custom' = 'text';
	export let width = '100%';
	export let height = 'auto';
	export let className = '';
	export let animate = true;
	export let rounded = true;
	export let count = 1;

	export let customWidth: string | undefined = undefined;
	export let customHeight: string | undefined = undefined;

	function getSkeletonClasses(variant: string): string {
		const baseClasses = 'bg-slate-700';
		const animationClasses = animate ? 'animate-pulse' : '';
		const roundedClasses = rounded ? 'rounded-lg' : '';

		switch (variant) {
			case 'text':
				return `${baseClasses} h-4 ${roundedClasses} ${animationClasses}`;
			case 'title':
				return `${baseClasses} h-6 ${roundedClasses} ${animationClasses}`;
			case 'button':
				return `${baseClasses} h-10 ${roundedClasses} ${animationClasses}`;
			case 'card':
				return `${baseClasses} ${roundedClasses} ${animationClasses} p-4`;
			case 'lesson':
				return `${baseClasses} h-20 ${roundedClasses} ${animationClasses}`;
			case 'day-header':
				return `${baseClasses} h-8 ${roundedClasses} ${animationClasses}`;
			case 'stats-card':
				return `${baseClasses} h-32 ${roundedClasses} ${animationClasses}`;
			case 'form-field':
				return `${baseClasses} h-12 ${roundedClasses} ${animationClasses}`;
			default:
				return `${baseClasses} ${roundedClasses} ${animationClasses}`;
		}
	}

	$: skeletonWidth = customWidth || width;
	$: skeletonHeight = customHeight || height;
	$: classes = `${getSkeletonClasses(variant)} ${className}`;
</script>

{#each Array(count) as _, i}
	<div
		class={classes}
		style="width: {skeletonWidth}; height: {skeletonHeight};"
		role="status"
		aria-label="Загрузка..."
	>
		{#if variant === 'card'}
			<div class="space-y-3">
				<div class="h-4 w-3/4 rounded bg-slate-600"></div>
				<div class="space-y-2">
					<div class="h-3 rounded bg-slate-600"></div>
					<div class="h-3 w-5/6 rounded bg-slate-600"></div>
				</div>
			</div>
		{:else if variant === 'lesson'}
			<div class="flex gap-4 p-4">
				<div class="w-14 space-y-2">
					<div class="h-4 rounded bg-slate-600"></div>
					<div class="h-4 rounded bg-slate-600"></div>
				</div>
				<div class="flex-1 space-y-2">
					<div class="h-5 w-3/4 rounded bg-slate-600"></div>
					<div class="h-3 w-1/2 rounded bg-slate-600"></div>
					<div class="h-3 w-2/3 rounded bg-slate-600"></div>
				</div>
				<div class="h-5 w-8 rounded-full bg-slate-600"></div>
			</div>
		{:else if variant === 'stats-card'}
			<div class="space-y-4 p-4">
				<div class="h-6 w-3/4 rounded bg-slate-600"></div>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<div class="h-8 rounded bg-slate-600"></div>
						<div class="h-3 rounded bg-slate-600"></div>
					</div>
					<div class="space-y-2">
						<div class="h-8 rounded bg-slate-600"></div>
						<div class="h-3 rounded bg-slate-600"></div>
					</div>
				</div>
			</div>
		{/if}
	</div>
	{#if i < count - 1}
		<div class="mb-2"></div>
	{/if}
{/each}

<style>
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>
