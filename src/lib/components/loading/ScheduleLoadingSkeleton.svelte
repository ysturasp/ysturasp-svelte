<script lang="ts">
	import { fade } from 'svelte/transition';

	export let isFullView = false;
	export let isMobile = false;
	export let daysCount = 5;
	export let showSubgroups = false;
</script>

<div class="mt-4" in:fade={{ duration: 300 }} out:fade={{ duration: 300 }}>
	<div class="mb-2 flex justify-center md:items-center">
		<div
			class="mr-2 flex w-12 animate-pulse items-center justify-center self-stretch rounded-lg bg-slate-700 md:h-12 md:self-auto"
		>
			<div class="text-2xl opacity-50 md:text-3xl">👈</div>
		</div>

		<div class="flex flex-col justify-center md:items-center">
			<div
				class="animate-pulse rounded-lg p-4 text-center sm:mr-0 sm:ml-0 md:mr-20 md:ml-20 md:px-13"
				style="background: radial-gradient(rgba(100, 116, 139, 0.3) 10%, rgba(255, 255, 255, 0) 100%);"
			>
				<div class="mx-auto mb-2 h-12 w-48 rounded bg-slate-600 md:h-7 md:w-139"></div>

				<div
					class="{showSubgroups ? 'mb-2' : 'mb-1'} flex items-center justify-center gap-2"
				>
					<div class="h-4 w-16 rounded bg-slate-600 md:w-18"></div>
					<div class="h-2 w-2 rounded-full bg-slate-600"></div>
					<div class="h-4 w-20 rounded bg-slate-600 md:w-24"></div>
					<div class="h-4 w-4 rounded bg-slate-600"></div>
				</div>

				{#if showSubgroups}
					<div class="mt-2 flex items-center justify-center gap-1">
						<div class="h-4 w-4 rounded bg-slate-600"></div>
						<div class="h-4 w-32 rounded bg-slate-600"></div>
					</div>
				{/if}
			</div>
		</div>

		<div
			class="ml-2 flex w-12 animate-pulse items-center justify-center self-stretch rounded-lg bg-slate-700 md:h-12 md:self-auto"
		>
			<div class="text-2xl opacity-50 md:text-3xl">👉</div>
		</div>
	</div>

	{#if isMobile}
		<div class="mb-2 flex items-center justify-end">
			<div class="mr-2 h-4 w-16 animate-pulse rounded bg-slate-700"></div>
			<div class="relative mr-2 inline-block">
				<div class="h-5 w-9 animate-pulse rounded-full bg-slate-700"></div>
			</div>
			<div class="h-4 w-20 animate-pulse rounded bg-slate-700"></div>
		</div>
	{/if}

	{#if isMobile}
		<div class="relative">
			{#if !isFullView}
				<div class="w-full">
					<div
						class="mb-2 grid gap-1"
						style="grid-template-columns: repeat({daysCount}, 1fr)"
					>
						{#each Array(daysCount) as _, i}
							<div
								class="day-button flex flex-col items-center rounded-lg p-2 transition-all {i ===
								0
									? 'bg-slate-600'
									: 'bg-slate-700'} animate-pulse"
							>
								<div class="mb-1 h-4 w-6 rounded bg-slate-500"></div>
								<div class="h-5 w-4 rounded bg-slate-500"></div>
							</div>
						{/each}
					</div>

					<div class="mt-3">
						<div class="day-schedule mb-4 rounded-2xl bg-slate-900 p-4">
							<div class="mb-2 h-8 w-64 animate-pulse rounded bg-slate-700"></div>
							<div class="relative space-y-2">
								{#each Array(3) as _}
									<div
										class="relative mb-2 flex w-full animate-pulse rounded-2xl bg-slate-800 p-4"
									>
										<div
											class="mr-2 flex w-14 flex-col items-end justify-between border-r-2 border-slate-600 pr-2"
										>
											<div class="h-4 w-12 rounded bg-slate-600"></div>
											<div class="h-4 w-12 rounded bg-slate-600"></div>
										</div>
										<div class="flex-grow">
											<div class="mb-2 h-6 w-3/4 rounded bg-slate-600"></div>
											<div class="mb-1 h-4 w-1/2 rounded bg-slate-600"></div>
											<div class="mb-1 h-4 w-2/3 rounded bg-slate-600"></div>
											<div class="h-4 w-1/2 rounded bg-slate-600"></div>
										</div>
										<div
											class="ml-auto h-5 w-8 self-center rounded-full bg-slate-600"
										></div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{:else}
				<div class="w-full">
					{#each Array(daysCount) as _}
						<div class="mt-3">
							<div class="day-schedule mb-4 rounded-2xl bg-slate-900 p-4">
								<div class="mb-2 h-8 w-64 animate-pulse rounded bg-slate-700"></div>
								<div class="relative space-y-2">
									{#each Array(Math.floor(Math.random() * 3) + 1) as _}
										<div
											class="relative mb-2 flex w-full animate-pulse rounded-2xl bg-slate-800 p-4"
										>
											<div
												class="mr-2 flex w-14 flex-col items-end justify-between border-r-2 border-slate-600 pr-2"
											>
												<div class="h-4 w-12 rounded bg-slate-600"></div>
												<div class="h-4 w-12 rounded bg-slate-600"></div>
											</div>
											<div class="flex-grow">
												<div
													class="mb-2 h-6 w-3/4 rounded bg-slate-600"
												></div>
												<div
													class="mb-1 h-4 w-1/2 rounded bg-slate-600"
												></div>
												<div
													class="mb-1 h-4 w-2/3 rounded bg-slate-600"
												></div>
												<div class="h-4 w-1/2 rounded bg-slate-600"></div>
											</div>
											<div
												class="ml-auto h-5 w-8 self-center rounded-full bg-slate-600"
											></div>
										</div>
									{/each}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		{#each Array(daysCount) as _}
			<div class="mt-3">
				<div class="day-schedule mb-4 rounded-2xl bg-slate-900 p-4">
					<div class="mb-2 h-8 w-64 animate-pulse rounded bg-slate-700"></div>
					<div class="relative space-y-2">
						{#each Array(Math.floor(Math.random() * 4) + 1) as _}
							<div
								class="relative mb-2 flex w-full animate-pulse rounded-2xl bg-slate-800 p-4"
							>
								<div
									class="mr-2 flex w-14 flex-col items-end justify-between border-r-2 border-slate-600 pr-2"
								>
									<div class="h-4 w-12 rounded bg-slate-600"></div>
									<div class="h-4 w-12 rounded bg-slate-600"></div>
								</div>
								<div class="flex-grow">
									<div class="mb-2 h-6 w-3/4 rounded bg-slate-600"></div>
									<div class="mb-1 h-4 w-1/2 rounded bg-slate-600"></div>
									<div class="mb-1 h-4 w-2/3 rounded bg-slate-600"></div>
									<div class="h-4 w-1/2 rounded bg-slate-600"></div>
								</div>
								<div
									class="ml-auto h-5 w-8 self-center rounded-full bg-slate-600"
								></div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/each}
	{/if}
</div>
