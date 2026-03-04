<script lang="ts">
	import { onMount, createEventDispatcher, tick } from 'svelte';
	import {
		Clock,
		Calendar,
		ChevronRight,
		ChevronUp,
		ChevronDown,
		X,
		Eye,
		EyeOff
	} from '@lucide/svelte';
	import { fade, slide, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	const dispatch = createEventDispatcher<{
		change: { date: Date };
		visibilityChange: { visible: boolean };
	}>();

	export let value: Date = new Date();

	let hours = Array.from({ length: 24 }, (_, i) => i);
	let minutes = Array.from({ length: 60 }, (_, i) => i);

	let selectedDateStr = getLocalDateStr(value);
	let selectedHour = value.getHours();
	let selectedMinute = value.getMinutes();

	let hourScrollContainer: HTMLDivElement;
	let minuteScrollContainer: HTMLDivElement;

	function getLocalDateStr(date: Date) {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	$: todayStr = getLocalDateStr(new Date());
	$: tomorrowStr = (() => {
		const d = new Date();
		d.setDate(d.getDate() + 1);
		return getLocalDateStr(d);
	})();

	export let showAvailability = true;
	let isOpen = false;
	let isCalendarOpen = false;

	let viewDate = new Date();
	const monthNames = [
		'январь',
		'февраль',
		'март',
		'апрель',
		'май',
		'июнь',
		'июль',
		'август',
		'сентябрь',
		'октябрь',
		'ноябрь',
		'декабрь'
	];
	const dayShortNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

	$: {
		const [y, m, d] = selectedDateStr.split('-').map(Number);
		const newDate = new Date(y, m - 1, d, selectedHour, selectedMinute, 0, 0);
		if (newDate.getTime() !== value.getTime()) {
			value = newDate;
			setTimeout(() => dispatch('change', { date: value }), 0);
		}
	}

	function handleHourScroll(e: Event) {
		const container = e.target as HTMLDivElement;
		const index = Math.round(container.scrollTop / 40);
		if (hours[index] !== undefined && hours[index] !== selectedHour) {
			selectedHour = hours[index];
		}
	}

	function handleMinuteScroll(e: Event) {
		const container = e.target as HTMLDivElement;
		const index = Math.round(container.scrollTop / 40);
		if (minutes[index] !== undefined && minutes[index] !== selectedMinute) {
			selectedMinute = minutes[index];
		}
	}

	function scrollToValue() {
		if (hourScrollContainer) hourScrollContainer.scrollTop = selectedHour * 40;
		if (minuteScrollContainer) minuteScrollContainer.scrollTop = selectedMinute * 40;
	}

	onMount(() => {
		scrollToValue();
	});

	function setNow() {
		const now = new Date();
		selectedDateStr = getLocalDateStr(now);
		selectedHour = now.getHours();
		selectedMinute = now.getMinutes();
		scrollToValue();
		isCalendarOpen = false;
	}

	async function toggle() {
		isOpen = !isOpen;
		if (isOpen) {
			selectedHour = value.getHours();
			selectedMinute = value.getMinutes();
			selectedDateStr = getLocalDateStr(value);
			await tick();
			scrollToValue();
			setTimeout(scrollToValue, 50);
		} else {
			isCalendarOpen = false;
		}
	}

	function setOffset(offset: number) {
		const d = new Date();
		d.setDate(d.getDate() + offset);
		selectedDateStr = getLocalDateStr(d);
		isCalendarOpen = false;
	}

	function changeMonth(offset: number) {
		viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
	}

	function getDaysInMonth(currentViewDate: Date) {
		const year = currentViewDate.getFullYear();
		const month = currentViewDate.getMonth();
		const firstDay = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();

		const days = [];
		const startDay = firstDay === 0 ? 6 : firstDay - 1;

		const prevYear = month === 0 ? year - 1 : year;
		const prevMonth = month === 0 ? 11 : month - 1;
		const prevMonthLastDay = new Date(year, month, 0).getDate();

		for (let i = startDay - 1; i >= 0; i--) {
			days.push({
				day: prevMonthLastDay - i,
				month: prevMonth,
				year: prevYear,
				isCurrentMonth: false
			});
		}

		for (let i = 1; i <= daysInMonth; i++) {
			days.push({
				day: i,
				month,
				year,
				isCurrentMonth: true
			});
		}

		const remaining = 42 - days.length;
		const nextYear = month === 11 ? year + 1 : year;
		const nextMonth = month === 11 ? 0 : month + 1;
		for (let i = 1; i <= remaining; i++) {
			days.push({
				day: i,
				month: nextMonth,
				year: nextYear,
				isCurrentMonth: false
			});
		}

		return days;
	}

	$: calendarDays = getDaysInMonth(viewDate);

	async function selectCalendarDate(d: any) {
		const date = new Date(d.year, d.month, d.day);
		selectedDateStr = getLocalDateStr(date);
		isCalendarOpen = false;
		await tick();
		scrollToValue();
	}

	function toggleAvailability() {
		showAvailability = !showAvailability;
		dispatch('visibilityChange', { visible: showAvailability });
	}
</script>

<div
	class="pointer-events-none fixed top-1/2 right-0 z-[60] flex h-0 w-screen -translate-y-1/2 items-center justify-end"
>
	<div class="pointer-events-auto relative flex items-center justify-end">
		{#if !isOpen}
			<button
				on:click={toggle}
				transition:fly={{ x: 50, duration: 400, easing: cubicOut }}
				class="group absolute right-0 flex flex-col items-center justify-center rounded-l-xl border border-white/10 bg-slate-800/90 px-1.5 py-5 text-blue-400 shadow-xl backdrop-blur-md transition-all hover:bg-slate-700"
			>
				<Calendar class="mb-2 h-4 w-4 transition-transform group-hover:scale-110" />
				<span
					class="rotate-180 text-[8px] font-black tracking-[0.2em] uppercase [writing-mode:vertical-rl]"
				>
					ЗАНЯТОСТЬ АУДИТОРИЙ
				</span>
			</button>
		{/if}

		{#if isOpen}
			<div
				transition:fly={{ x: 250, duration: 450, easing: cubicOut }}
				class="relative flex w-48 flex-col gap-3 overflow-hidden rounded-l-3xl border-y border-l border-white/10 bg-slate-900/98 p-4 shadow-[-20px_0_50px_-12px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
			>
				{#if isCalendarOpen}
					<div
						transition:fly={{ x: 100, duration: 400, easing: cubicOut }}
						class="absolute inset-0 z-20 flex flex-col gap-3 bg-slate-900/99 p-4 backdrop-blur-3xl"
					>
						<div class="flex shrink-0 items-center justify-between">
							<span
								class="text-[9px] font-black tracking-widest uppercase {viewDate.getMonth() ===
									new Date().getMonth() &&
								viewDate.getFullYear() === new Date().getFullYear()
									? 'text-blue-400'
									: 'text-white/30'} truncate"
							>
								{monthNames[viewDate.getMonth()]}
								{viewDate.getFullYear()}
							</span>
							<button
								on:click={() => (isCalendarOpen = false)}
								class="rounded-full p-1 text-slate-500 transition-colors hover:bg-white/5"
							>
								<X class="h-3.5 w-3.5" />
							</button>
						</div>

						<div class="flex flex-1 flex-col justify-center gap-4">
							<div class="grid grid-cols-7 gap-px text-center">
								{#each dayShortNames as name}
									<span class="py-1 text-[7px] font-bold text-slate-700"
										>{name}</span
									>
								{/each}
								{#each calendarDays as d}
									{@const dateStr = getLocalDateStr(
										new Date(d.year, d.month, d.day)
									)}
									{@const isTodayDate = dateStr === getLocalDateStr(new Date())}
									{@const isSelected = selectedDateStr === dateStr}
									<button
										on:click={() => selectCalendarDate(d)}
										class="relative mx-auto flex h-5 w-5 items-center justify-center rounded-md text-[8px] font-bold transition-all
											{d.isCurrentMonth ? 'text-slate-300' : 'text-slate-600'}
											{isSelected ? 'bg-blue-600 !text-white shadow-lg shadow-blue-600/30' : 'hover:bg-white/5'}
											{isTodayDate && !isSelected ? 'ring-1 ring-blue-500/50' : ''}
										"
									>
										{d.day}
										{#if isTodayDate}
											<div
												class="absolute -bottom-0.5 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full {isSelected
													? 'bg-white'
													: 'bg-blue-500'}"
											></div>
										{/if}
									</button>
								{/each}
							</div>
						</div>

						<div class="flex shrink-0 gap-1">
							<button
								on:click={() => changeMonth(-1)}
								class="flex flex-1 items-center justify-center gap-1 rounded-lg bg-slate-800 py-2 text-[8px] font-black text-slate-400 uppercase transition-all hover:bg-slate-700"
							>
								<ChevronUp class="h-3 w-3" />
								назад
							</button>
							<button
								on:click={() => changeMonth(1)}
								class="flex flex-1 items-center justify-center gap-1 rounded-lg bg-slate-800 py-2 text-[8px] font-black text-slate-400 uppercase transition-all hover:bg-slate-700"
							>
								вперед
								<ChevronDown class="h-3 w-3" />
							</button>
						</div>
					</div>
				{/if}

				<div class="flex shrink-0 items-center justify-between">
					<span class="text-[9px] font-black tracking-widest text-white/30 uppercase"
						>Занятость аудиторий</span
					>
					<button
						on:click={toggle}
						class="rounded-full p-1 text-slate-500 transition-colors hover:bg-white/5"
					>
						<X class="h-3.5 w-3.5" />
					</button>
				</div>

				<div class="flex shrink-0 flex-col gap-1.5">
					<div class="flex gap-1">
						<button
							on:click={() => setOffset(0)}
							class="flex-1 rounded-lg px-1 py-1.5 text-[9px] font-bold transition-all {selectedDateStr ===
							todayStr
								? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
								: 'bg-slate-800 text-slate-500 hover:bg-slate-700'}"
						>
							сегодня
						</button>
						<button
							on:click={() => setOffset(1)}
							class="flex-1 rounded-lg px-1 py-1.5 text-[9px] font-bold transition-all {selectedDateStr ===
							tomorrowStr
								? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
								: 'bg-slate-800 text-slate-500 hover:bg-slate-700'}"
						>
							завтра
						</button>
						<button
							on:click={() => (isCalendarOpen = !isCalendarOpen)}
							class="flex items-center justify-center rounded-lg px-2 py-1.5 text-xs transition-all {selectedDateStr !==
								todayStr && selectedDateStr !== tomorrowStr
								? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
								: 'bg-slate-800 text-slate-500 hover:bg-slate-700'}"
						>
							<Calendar class="h-3.5 w-3.5" />
						</button>
					</div>
				</div>

				<div class="relative w-full overflow-hidden">
					<div
						class="relative flex h-32 shrink-0 items-center justify-center gap-1 overflow-hidden rounded-xl border border-white/5 bg-slate-950/50"
					>
						<div
							class="pointer-events-none absolute inset-x-2 top-1/2 h-10 -translate-y-1/2 rounded-lg border border-blue-500/20 bg-blue-500/10"
						></div>

						<div
							bind:this={hourScrollContainer}
							on:scroll={handleHourScroll}
							class="no-scrollbar h-full flex-1 snap-y snap-mandatory overflow-y-auto py-[44px]"
						>
							{#each hours as h}
								<div
									class="flex h-10 snap-center items-center justify-center text-sm font-black {selectedHour ===
									h
										? 'text-white'
										: 'text-slate-700'} transition-all"
								>
									{h.toString().padStart(2, '0')}
								</div>
							{/each}
						</div>

						<div class="animate-pulse text-sm font-black text-slate-800">:</div>

						<div
							bind:this={minuteScrollContainer}
							on:scroll={handleMinuteScroll}
							class="no-scrollbar h-full flex-1 snap-y snap-mandatory overflow-y-auto py-[44px]"
						>
							{#each minutes as m}
								<div
									class="flex h-10 snap-center items-center justify-center text-sm font-black {selectedMinute ===
									m
										? 'text-white'
										: 'text-slate-700'} transition-all"
								>
									{m.toString().padStart(2, '0')}
								</div>
							{/each}
						</div>
					</div>
				</div>

				<button
					on:click={setNow}
					class="w-full shrink-0 rounded-xl border border-white/5 bg-slate-800 py-2 text-[9px] font-black tracking-widest text-slate-500 uppercase transition-all hover:bg-slate-700 hover:text-blue-400"
				>
					сейчас
				</button>

				<button
					on:click={toggleAvailability}
					class="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-white/5 py-2 text-[9px] font-black tracking-widest uppercase transition-all {showAvailability
						? 'border-blue-500/20 bg-blue-600/10 text-blue-400'
						: 'bg-slate-800 text-slate-500'}"
				>
					{#if showAvailability}
						<Eye class="h-3.5 w-3.5" />
					{:else}
						<EyeOff class="h-3.5 w-3.5" />
					{/if}
					<span>Видимость</span>
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
