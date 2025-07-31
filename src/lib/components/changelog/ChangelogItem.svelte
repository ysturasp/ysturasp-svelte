<script lang="ts">
	import type { ChangelogItem } from '$lib/types';
	import { getFilesWord } from '$lib/utils/changelog';

	let { item, translated = false } = $props<{
		item: ChangelogItem;
		translated?: boolean;
	}>();

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<div class="changelog-item">
	<div class="rounded-lg border border-slate-700/50 bg-slate-800 p-4 shadow-lg">
		<div
			class="mb-2 flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4"
		>
			<h3
				class="text-lg font-semibold text-white md:min-w-0 md:flex-1"
				data-original={item.originalDescription || item.description}
			>
				{item.emoji}
				{item.description}
			</h3>
			<span class="shrink-0 text-sm text-slate-400">{formatDate(item.date)}</span>
		</div>

		<p class="text-slate-400">
			Автор:
			<a
				href="https://github.com/{item.author}"
				target="_blank"
				class="text-blue-400 transition-all hover:text-blue-300"
			>
				@{item.author}
			</a>
		</p>

		{#if item.filesChanged && item.insertions !== undefined && item.deletions !== undefined}
			<div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
				<div
					class="flex items-center gap-2 rounded-full bg-slate-700/50 px-3 py-1.5 backdrop-blur"
				>
					<svg
						class="h-4 w-4 text-slate-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						></path>
					</svg>
					<span class="text-slate-300"
						>{item.filesChanged} {getFilesWord(item.filesChanged)}</span
					>
				</div>

				<div class="flex items-center gap-2">
					<span
						class="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-emerald-400"
					>
						<svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
								clip-rule="evenodd"
							></path>
						</svg>
						{item.insertions}
					</span>

					<span
						class="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1.5 text-rose-400"
					>
						<svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
								clip-rule="evenodd"
							></path>
						</svg>
						{item.deletions}
					</span>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.changelog-item {
		position: relative;
		padding-left: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.changelog-item::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 2px;
		background: linear-gradient(to bottom, #3b82f6, #1e40af);
	}

	.changelog-item::after {
		content: '';
		position: absolute;
		left: -4px;
		top: 0;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: #3b82f6;
	}
</style>
