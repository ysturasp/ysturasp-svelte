<script lang="ts">
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { Area, AreaChart } from 'layerchart';
	import { curveNatural } from 'd3-shape';
	import type { Stats } from '../types';

	const { stats } = $props<{ stats: Stats }>();

	const chartData = $derived([
		{ grade: '2', count: stats.count2 },
		{ grade: '3', count: stats.count3 },
		{ grade: '4', count: stats.count4 },
		{ grade: '5', count: stats.count5 }
	]);

	const chartConfig = {
		value: {
			label: 'Количество',
			color: '#60A5FA'
		}
	} satisfies Chart.ChartConfig;

	type TooltipData = {
		value: number;
		name: string;
		item: { grade: string; count: number };
	};
</script>

<Chart.Container config={chartConfig} class="aspect-auto h-[250px] w-full">
	<AreaChart
		data={chartData}
		x="grade"
		y="count"
		series={[
			{
				key: 'count',
				label: 'Количество',
				color: '#60A5FA'
			}
		]}
		props={{
			area: {
				'curve': curveNatural,
				'fill-opacity': 0.4,
				'line': { class: 'stroke-2' },
				'motion': 'tween'
			},
			xAxis: {
				label: 'Оценка',
				format: (v: string) => v.toString()
			},
			yAxis: {
				label: 'Количество студентов',
				format: (v: number) => v.toString()
			}
		}}
	>
		{#snippet marks({ series, getAreaProps }: { series: any[]; getAreaProps: any })}
			<defs>
				<linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
					<stop offset="5%" stop-color="#60A5FA" stop-opacity={0.8} />
					<stop offset="95%" stop-color="#60A5FA" stop-opacity={0.1} />
				</linearGradient>
			</defs>
			{#each series as s, i (s.key)}
				<Area {...getAreaProps(s, i)} fill="url(#fillValue)" />
			{/each}
		{/snippet}
		{#snippet tooltip()}
			<Chart.Tooltip
				indicator="line"
				class="bg-gray-900 [&_*]:text-gray-100"
				hideLabel={true}
			>
				{#snippet formatter({ value, payload })}
					{@const grade = payload[0]?.payload?.grade}
					<div class="flex flex-col gap-1">
						<div class="flex justify-between gap-12">
							<span class="text-sm font-bold">Оценка:</span>
							<span class="text-sm font-bold">{grade}</span>
						</div>
						<div class="flex justify-between gap-12">
							<span>Количество:</span>
							<span class="font-mono">{value}</span>
						</div>
					</div>
				{/snippet}
			</Chart.Tooltip>
		{/snippet}
	</AreaChart>
</Chart.Container>
