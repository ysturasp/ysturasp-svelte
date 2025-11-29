<script lang="ts">
	const steps = [
		{
			id: 'upload',
			icon: '📨',
			title: 'загрузка',
			subtitle: 'файла'
		},
		{
			id: 'analyze',
			icon: '🔍',
			title: 'анализ',
			subtitle: 'структуры'
		},
		{
			id: 'format',
			icon: '✨',
			title: 'формат',
			subtitle: 'документа'
		},
		{
			id: 'save',
			icon: '💾',
			title: 'сохранение',
			subtitle: 'документа'
		}
	];

	export let currentStep = '';
	export let isComplete = false;
</script>

<div class="flex w-full items-center justify-between">
	{#each steps as step, index}
		{@const isCompleted = isComplete || steps.findIndex((s) => s.id === currentStep) > index}
		{@const isActive = currentStep === step.id}
		{@const isUpcoming = !isComplete && steps.findIndex((s) => s.id === currentStep) < index}

		<div
			class="relative flex flex-1 flex-col items-center border-t-2 pb-4
			{isActive ? 'border-blue-500' : isCompleted ? 'border-green-500' : 'border-slate-700'} 
			pt-8 transition-all duration-500"
		>
			<div
				class="absolute -top-4 flex h-8 w-8 items-center justify-center rounded-full text-lg
				transition-all duration-500 {isActive
					? 'scale-110 bg-blue-500 text-white'
					: isCompleted
						? 'bg-green-500 text-white'
						: 'bg-slate-800 text-slate-400'}"
			>
				{#if isCompleted}
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else}
					{step.icon}
				{/if}
			</div>

			<div class="flex flex-col items-center">
				<span
					class="text-sm transition-colors duration-300 {isActive
						? 'text-blue-400'
						: isCompleted
							? 'text-green-400'
							: 'text-slate-400'}"
				>
					{step.title}
				</span>
				{#if step.subtitle}
					<span class="text-xs text-slate-500">{step.subtitle}</span>
				{/if}
			</div>

			{#if isActive && !isComplete}
				<div
					class="absolute -bottom-1 left-0 h-0.5 animate-pulse bg-blue-500"
					style="width: 100%"
				></div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.border-t-2 {
		transition: border-color 0.5s ease;
	}
</style>
