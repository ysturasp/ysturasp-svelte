<script lang="ts">
	import type { Lesson } from '$lib/types/schedule';

	export let lesson: Lesson;
	export let isLastInDay = false;

	const lessonTypes = {
		lecture: { class: 'text-blue-400', text: 'Лекция' },
		practice: { class: 'text-amber-500', text: 'Практика' },
		other: { class: 'text-white-500', text: 'Занятие' }
	};

	const lessonTypeColors = {
		lecture: 'border-blue-400',
		practice: 'border-amber-500',
		other: 'border-slate-300'
	};

	function getTimeContainer(lesson: Lesson) {
		if (lesson.additionalSlots && lesson.additionalSlots.length > 0) {
			const lastSlot = lesson.additionalSlots[lesson.additionalSlots.length - 1];
			const startTimeText = lesson.timeInfo?.customStartTime || lesson.startAt;
			const endTimeText = lesson.timeInfo?.customEndTime || lastSlot.endAt;

			return {
				isMultiLesson: true,
				startTime: {
					time: startTimeText,
					isCustom: !!lesson.timeInfo?.customStartTime,
					originalTime: lesson.startAt
				},
				endTime: {
					time: endTimeText,
					isCustom: !!lesson.timeInfo?.customEndTime,
					originalTime: lastSlot.endAt
				},
				duration: lesson.additionalSlots.length + 1
			};
		} else {
			const startTimeText = lesson.timeInfo?.customStartTime || lesson.startAt;
			const endTimeText = lesson.timeInfo?.customEndTime || lesson.endAt;

			return {
				isMultiLesson: false,
				startTime: {
					time: startTimeText,
					isCustom: !!lesson.timeInfo?.customStartTime,
					originalTime: lesson.startAt
				},
				endTime: {
					time: endTimeText,
					isCustom: !!lesson.timeInfo?.customEndTime,
					originalTime: lesson.endAt
				},
				duration: 1
			};
		}
	}

	$: timeInfo = getTimeContainer(lesson);
</script>

<div
	class="rounded-2xl bg-slate-800 p-4 {!isLastInDay
		? 'mb-2'
		: ''} relative flex {timeInfo.isMultiLesson ? 'multi-lesson' : ''}"
>
	{#if timeInfo.isMultiLesson}
		<div
			class="absolute top-1/2 -left-2 h-4/5 w-1 -translate-y-1/2 transform rounded-full bg-blue-400"
		></div>
	{/if}

	<div
		class="time-container border-r-2 {lessonTypeColors[
			lesson.type as keyof typeof lessonTypeColors
		] || 'border-slate-300'}"
	>
		<div class="time-slot group relative {timeInfo.startTime.isCustom ? 'custom' : ''}">
			{timeInfo.startTime.time}
			{#if timeInfo.startTime.isCustom}
				<div class="tooltip">
					Изменено с {timeInfo.startTime.originalTime}
				</div>
			{/if}
		</div>
		<div class="time-divider"></div>
		<div class="time-slot group relative {timeInfo.endTime.isCustom ? 'custom' : ''}">
			{timeInfo.endTime.time}
			{#if timeInfo.endTime.isCustom}
				<div class="tooltip">
					Изменено с {timeInfo.endTime.originalTime}
				</div>
			{/if}
		</div>
	</div>

	<div class="flex-grow">
		<p class="font-bold text-white">{lesson.lessonName}</p>
		<p
			class="text-sm {lessonTypes[lesson.type as keyof typeof lessonTypes]?.class ||
				'text-slate-400'}"
		>
			{lessonTypes[lesson.type as keyof typeof lessonTypes]?.text || 'Занятие'}
			{#if timeInfo.duration > 1}
				<span
					class="text-sm {lessonTypes[lesson.type as keyof typeof lessonTypes]?.class ||
						'text-slate-400'}"
				>
					на {timeInfo.duration} пары</span
				>
			{/if}
		</p>
		{#if lesson.teacherName}
			<p class="text-sm text-slate-400">
				<a
					href="/yspu/raspprep?teacher={encodeURIComponent(lesson.teacherName)}"
					class="transition-all hover:text-blue-400"
				>
					{lesson.teacherName}
				</a>
			</p>
		{/if}
		{#if lesson.auditoryName}
			<p class="text-sm text-slate-400">
				<a
					href="/yspu/raspaudience?audience={encodeURIComponent(lesson.auditoryName)}"
					class="transition-all hover:text-blue-400"
				>
					Аудитория: {lesson.auditoryName}
				</a>
			</p>
		{/if}
		{#if lesson.startDate || lesson.endDate}
			<p class="text-sm text-slate-400">
				{#if lesson.startDate && lesson.endDate}
					с {lesson.startDate} по {lesson.endDate}
				{:else if lesson.startDate}
					с {lesson.startDate}
				{:else if lesson.endDate}
					по {lesson.endDate}
				{/if}
			</p>
		{/if}
		{#if lesson.isDistant}
			<p class="text-sm text-red-400">Дистанционно</p>
		{/if}
	</div>
</div>

<style>
	.time-container {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		justify-content: space-between;
		padding-right: 0.5rem;
		margin-left: -0.5rem;
		margin-right: 0.5rem;
		min-width: 4rem;
	}

	.time-slot {
		position: relative;
		padding: 0.25rem;
		border-radius: 0.375rem;
		font-weight: 600;
		font-size: 0.875rem;
		transition: all 0.3s ease;
		background: rgba(30, 41, 59, 0.5);
		backdrop-filter: blur(4px);
	}

	.time-slot.custom {
		background: linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(30, 41, 59, 0.5) 100%);
		border: 1px solid rgba(37, 99, 235, 0.3);
		animation: customTimePulse 2s infinite;
	}

	@keyframes customTimePulse {
		0% {
			box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4);
		}
		70% {
			box-shadow: 0 0 0 6px rgba(37, 99, 235, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
		}
	}

	.time-divider {
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		height: 1px;
		background: rgba(148, 163, 184, 0.2);
		z-index: -1;
	}

	.tooltip {
		position: absolute;
		top: -2rem;
		left: 50%;
		transform: translateX(-50%) scale(0.95);
		background: rgba(30, 41, 59, 0.95);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		color: #fff;
		white-space: nowrap;
		opacity: 0;
		visibility: hidden;
		transition: all 0.2s ease;
		z-index: 10;
		border: 1px solid rgba(37, 99, 235, 0.3);
	}

	.time-slot:hover .tooltip {
		opacity: 1;
		visibility: visible;
		transform: translateX(-50%) scale(1);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.group:hover .tooltip {
		animation: fadeIn 0.2s ease forwards;
	}
</style>
