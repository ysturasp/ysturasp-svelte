<script lang="ts">
	import { fade } from 'svelte/transition';
	import SkeletonLoader from './SkeletonLoader.svelte';

	export let loading = false;
	export let skeletonVariant:
		| 'text'
		| 'title'
		| 'button'
		| 'card'
		| 'lesson'
		| 'day-header'
		| 'stats-card'
		| 'form-field'
		| 'custom' = 'card';
	export let skeletonWidth = '100%';
	export let skeletonHeight = 'auto';
	export let skeletonCount = 1;
	export let skeletonClassName = '';
	export let transitionDuration = 300;
</script>

{#if loading}
	<div in:fade={{ duration: transitionDuration }} out:fade={{ duration: transitionDuration }}>
		<SkeletonLoader
			variant={skeletonVariant}
			width={skeletonWidth}
			height={skeletonHeight}
			count={skeletonCount}
			className={skeletonClassName}
		/>
	</div>
{:else}
	<div
		in:fade={{ duration: transitionDuration, delay: 100 }}
		out:fade={{ duration: transitionDuration }}
	>
		<slot />
	</div>
{/if}
