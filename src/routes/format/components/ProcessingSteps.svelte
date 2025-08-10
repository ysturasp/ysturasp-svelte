<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	const steps = [
		{
			id: 'upload',
			icon: '📨',
			title: 'загрузка',
			subtitle: 'файла',
			duration: 2000
		},
		{
			id: 'analyze',
			icon: '🔍',
			title: 'анализ',
			subtitle: 'структуры',
			duration: 5000
		},
		{
			id: 'format',
			icon: '✨',
			title: 'формат',
			subtitle: 'документа',
			duration: 20000
		},
		{
			id: 'save',
			icon: '💾',
			title: 'сохранение',
			subtitle: 'документа',
			duration: 1500
		}
	];

	export let currentStep = '';
	export let isProcessing = false;
	export let isComplete = false;

	const progress = tweened(0, {
		duration: 1000,
		easing: cubicOut
	});

	let prevStep = '';
	let transitionTimer: ReturnType<typeof setTimeout>;
	let stepStartTime = 0;

	$: if (isProcessing && currentStep !== prevStep) {
		handleStepChange();
	} else if (!isProcessing && !isComplete) {
		resetProgress();
	}

	function handleStepChange() {
		if (!currentStep) return;

		const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
		if (currentStepIndex === -1) return;

		const stepDuration = steps[currentStepIndex].duration;

		progress.set(0, { duration: 0 });
		stepStartTime = Date.now();

		setTimeout(() => {
			progress.set(100, {
				duration: stepDuration - 200,
				easing: cubicOut
			});
		}, 100);

		if (transitionTimer) clearTimeout(transitionTimer);

		transitionTimer = setTimeout(() => {
			prevStep = currentStep;
		}, stepDuration);
	}

	function resetProgress() {
		progress.set(0);
		prevStep = '';
		if (transitionTimer) clearTimeout(transitionTimer);
	}

	onMount(() => {
		return () => {
			if (transitionTimer) clearTimeout(transitionTimer);
		};
	});
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
					class="absolute -bottom-1 left-0 h-0.5 bg-blue-500 transition-all duration-200"
					style="width: {$progress}%"
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
