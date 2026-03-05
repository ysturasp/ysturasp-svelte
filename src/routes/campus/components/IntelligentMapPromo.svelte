<script lang="ts">
	export let href = '/map';
	export let class_name = '';
</script>

<a {href} class="mt-4 block {class_name}">
	<div
		class="group relative rounded-2xl bg-slate-800 p-4 ring-1 ring-blue-500/50 transition-all hover:bg-slate-700/50"
	>
		<span
			class="absolute -top-2 -right-2 flex rotate-12 transform rounded-full bg-indigo-500 px-2 py-1 text-xs font-bold text-white uppercase shadow-lg"
			aria-hidden="true"
		>
			Beta
		</span>
		<div class="flex items-center justify-between gap-4">
			<div class="flex items-center gap-4">
				<div class="rounded-lg bg-blue-500/20 p-2">
					<svg
						class="h-5 w-5 text-blue-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
						/>
					</svg>
				</div>
				<span class="text-sm font-medium text-white"
					>Интеллектуальная карта Г корпуса — навигация, маршруты, занятость аудиторий</span
				>
			</div>
			<svg
				class="h-5 w-5 shrink-0 text-blue-400 transition-transform group-hover:translate-x-1"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 5l7 7-7 7"
				/>
			</svg>
		</div>
	</div>
</a>
