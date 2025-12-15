<script lang="ts">
	import { onMount } from 'svelte';

	type Bulb = {
		x: number;
		y: number;
		color: string;
		delay: number;
	};

	let container: HTMLDivElement;
	let width: number = 0;
	let bulbs: Bulb[] = [];
	const colors = ['#ff5e5e', '#5eff5e', '#ffff5e', '#5e5eff'];

	function generateBulbs(w: number): Bulb[] {
		const count = Math.max(5, Math.floor(w / 40));
		const newBulbs: Bulb[] = [];
		for (let i = 0; i < count; i++) {
			newBulbs.push({
				x: (i * w) / count + 20,
				y: 15 + Math.sin(i * 0.5) * 10,
				color: colors[i % colors.length],
				delay: Math.random() * 2
			});
		}
		return newBulbs;
	}

	onMount(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				width = entry.contentRect.width;
				bulbs = generateBulbs(width);
			}
		});

		if (container) {
			resizeObserver.observe(container);
		}

		return () => {
			resizeObserver.disconnect();
		};
	});
</script>

<div
	bind:this={container}
	class="garland-wrap pointer-events-none absolute left-0 w-full overflow-hidden"
	style="top: 100%; margin-top: -15px;"
	aria-hidden="true"
>
	{#if width > 0}
		<svg viewBox="0 0 {width} 50" preserveAspectRatio="none" class="h-12 w-full">
			<path
				d={`M0,0 Q${width / 2},30 ${width},0`}
				fill="none"
				stroke="#222"
				stroke-width="2"
			/>

			{#each bulbs as bulb}
				<g transform="translate({bulb.x}, {bulb.y})">
					<rect x="-3" y="-6" width="6" height="6" fill="#333" rx="1" />
					<circle
						cx="0"
						cy="4"
						r="5"
						fill={bulb.color}
						class="bulb"
						style="animation-delay: {bulb.delay}s; --glow-color: {bulb.color}"
					/>
				</g>
			{/each}
		</svg>
	{/if}
</div>

<style>
	.garland-wrap {
		height: 50px;
	}

	.bulb {
		animation: glow 2s ease-in-out infinite alternate;
	}

	@keyframes glow {
		from {
			filter: drop-shadow(0 0 2px var(--glow-color)) brightness(1);
			opacity: 0.8;
		}
		to {
			filter: drop-shadow(0 0 8px var(--glow-color)) brightness(1.3);
			opacity: 1;
		}
	}
</style>
