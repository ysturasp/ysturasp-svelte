<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import Portal from '$lib/components/ui/Portal.svelte';
	import { onMount } from 'svelte';

	export let isOpen = false;
	export let onClose: () => void;
	export let onSelect: (date: string | undefined) => void;
	export let currentDate: string | undefined = undefined;

	let searchQuery = '';
	let showCalendar = false;
	let selectedDate = currentDate ? new Date(currentDate) : new Date();
	let container: HTMLElement;
	let searchInput: HTMLInputElement;

	let placeholderText = '';
	const examples = ['7 дней', '12 августа', 'завтра', 'понедельник'];
	let currentExampleIndex = 0;
	let isTyping = true;
	let typingInterval: ReturnType<typeof setInterval>;

	onMount(() => {
		startTypingAnimation();
		return () => {
			if (typingInterval) clearInterval(typingInterval);
		};
	});

	function startTypingAnimation() {
		let currentText = '';
		let isDeleting = false;
		let charIndex = 0;

		typingInterval = setInterval(() => {
			const example = examples[currentExampleIndex];

			if (!isDeleting) {
				if (charIndex < example.length) {
					currentText = example.substring(0, charIndex + 1);
					charIndex++;
				} else {
					isDeleting = true;
					setTimeout(() => {
						charIndex = example.length;
					}, 1500);
				}
			} else {
				if (charIndex > 0) {
					currentText = example.substring(0, charIndex - 1);
					charIndex--;
				} else {
					isDeleting = false;
					currentExampleIndex = (currentExampleIndex + 1) % examples.length;
				}
			}

			placeholderText = currentText;
		}, 100);
	}

	interface DatePreset {
		id: string;
		label: string;
		value: string | undefined;
		description?: string;
	}

	$: datePresets = getDatePresets();
	$: filteredPresets = filterPresets(searchQuery);
	$: parsedDates = parseSearchQuery(searchQuery);
	$: allOptions = getAllOptions(filteredPresets, parsedDates);

	function getAllOptions(presets: DatePreset[], parsed: DatePreset[]): DatePreset[] {
		const options = [...presets];

		if (parsed.length > 0) {
			options.unshift(...parsed);
		}

		return options;
	}

	function getDatePresets(): DatePreset[] {
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(today.getDate() + 1);

		const nextWeek = new Date(today);
		nextWeek.setDate(today.getDate() + 7);

		return [
			{
				id: 'custom',
				label: 'Календарь...',
				value: undefined,
				description: 'Выбрать дату'
			},
			{
				id: 'tomorrow',
				label: 'Завтра',
				value: formatDate(tomorrow),
				description: formatDateDescription(tomorrow)
			},
			{
				id: 'week',
				label: 'Через неделю',
				value: formatDate(nextWeek),
				description: formatDateDescription(nextWeek)
			},
			{
				id: 'clear',
				label: 'Убрать дату',
				value: undefined,
				description: 'Без срока'
			}
		];
	}

	function filterPresets(query: string): DatePreset[] {
		if (!query.trim()) return datePresets;

		const lowerQuery = query.toLowerCase();
		return datePresets.filter(
			(preset) =>
				preset.label.toLowerCase().includes(lowerQuery) ||
				preset.description?.toLowerCase().includes(lowerQuery)
		);
	}

	function parseSearchQuery(query: string): DatePreset[] {
		if (!query.trim()) return [];

		const today = new Date();
		const lowerQuery = query.toLowerCase().trim();
		const results: DatePreset[] = [];

		if (lowerQuery === 'сегодня' || lowerQuery === 'today') {
			results.push({
				id: 'parsed-today',
				label: 'сегодня',
				value: formatDate(today),
				description: formatDateDescription(today)
			});
			return results;
		}

		if (lowerQuery === 'завтра' || lowerQuery === 'tomorrow') {
			const tomorrow = new Date(today);
			tomorrow.setDate(today.getDate() + 1);
			results.push({
				id: 'parsed-tomorrow',
				label: 'завтра',
				value: formatDate(tomorrow),
				description: formatDateDescription(tomorrow)
			});
			return results;
		}

		if (lowerQuery === 'послезавтра') {
			const dayAfter = new Date(today);
			dayAfter.setDate(today.getDate() + 2);
			results.push({
				id: 'parsed-day-after',
				label: 'послезавтра',
				value: formatDate(dayAfter),
				description: formatDateDescription(dayAfter)
			});
			return results;
		}

		const daysMatch = lowerQuery.match(/^(\d+)\s*(д|дня|дней|day|days)$/);
		if (daysMatch) {
			const days = parseInt(daysMatch[1]);
			const date = new Date(today);
			date.setDate(today.getDate() + days);
			results.push({
				id: 'parsed-days',
				label: `через ${days} ${getPlural(days, 'день', 'дня', 'дней')}`,
				value: formatDate(date),
				description: formatDateDescription(date)
			});
			return results;
		}

		const hoursMatch = lowerQuery.match(/^(\d+)\s*(ч|час|часа|часов|h|hour|hours)$/);
		if (hoursMatch) {
			const hours = parseInt(hoursMatch[1]);
			const date = new Date(today);
			date.setHours(today.getHours() + hours);
			results.push({
				id: 'parsed-hours',
				label: `через ${hours} ${getPlural(hours, 'час', 'часа', 'часов')}`,
				value: formatDate(date),
				description: formatDateDescription(date)
			});
			return results;
		}

		const weeksMatch = lowerQuery.match(/^(\d+)\s*(н|нед|недели|неделя|w|week|weeks)$/);
		if (weeksMatch) {
			const weeks = parseInt(weeksMatch[1]);
			const date = new Date(today);
			date.setDate(today.getDate() + weeks * 7);
			results.push({
				id: 'parsed-weeks',
				label: `через ${weeks} ${getPlural(weeks, 'неделю', 'недели', 'недель')}`,
				value: formatDate(date),
				description: formatDateDescription(date)
			});
			return results;
		}

		const spaceeDateMatch = lowerQuery.match(/^(\d{1,2})\s+(\d{1,2})(?:\s+(\d{4}))?$/);
		if (spaceeDateMatch) {
			const day = parseInt(spaceeDateMatch[1]);
			const month = parseInt(spaceeDateMatch[2]) - 1;
			const year = spaceeDateMatch[3] ? parseInt(spaceeDateMatch[3]) : today.getFullYear();

			if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
				const date = new Date(year, month, day);
				results.push({
					id: 'parsed-space-date',
					label: formatDateDescription(date),
					value: formatDate(date),
					description: formatDateDescription(date)
				});
				return results;
			}
		}

		const monthNames = {
			января: 0,
			январь: 0,
			jan: 0,
			january: 0,
			февраля: 1,
			февраль: 1,
			feb: 1,
			february: 1,
			марта: 2,
			март: 2,
			mar: 2,
			march: 2,
			апреля: 3,
			апрель: 3,
			apr: 3,
			april: 3,
			мая: 4,
			май: 4,
			may: 4,
			июня: 5,
			июнь: 5,
			jun: 5,
			june: 5,
			июля: 6,
			июль: 6,
			jul: 6,
			july: 6,
			августа: 7,
			август: 7,
			aug: 7,
			august: 7,
			сентября: 8,
			сентябрь: 8,
			sep: 8,
			september: 8,
			октября: 9,
			октябрь: 9,
			oct: 9,
			october: 9,
			ноября: 10,
			ноябрь: 10,
			nov: 10,
			november: 10,
			декабря: 11,
			декабрь: 11,
			dec: 11,
			december: 11
		};

		const monthNameMatch = lowerQuery.match(/^(\d{1,2})\s+([а-яa-z]+)(?:\s+(\d{4}))?$/);
		if (monthNameMatch) {
			const day = parseInt(monthNameMatch[1]);
			const monthInput = monthNameMatch[2];
			const year = monthNameMatch[3] ? parseInt(monthNameMatch[3]) : today.getFullYear();

			if (day >= 1 && day <= 31) {
				const matchingMonths = Object.entries(monthNames).filter(([name, _]) =>
					name.startsWith(monthInput)
				);

				const uniqueMonths = new Map<number, string>();
				matchingMonths.forEach(([name, monthNum]) => {
					if (!uniqueMonths.has(monthNum)) {
						uniqueMonths.set(monthNum, name);
					} else {
						const current = uniqueMonths.get(monthNum)!;
						if (
							(name.endsWith('я') || name.endsWith('а')) &&
							!(current.endsWith('я') || current.endsWith('а'))
						) {
							uniqueMonths.set(monthNum, name);
						}
					}
				});

				const sortedMonths = Array.from(uniqueMonths.entries())
					.sort(([a], [b]) => a - b)
					.slice(0, 5);

				sortedMonths.forEach(([monthNum, monthName], index) => {
					const date = new Date(year, monthNum, day);
					results.push({
						id: `parsed-month-${index}`,
						label: `${day} ${monthName}${year !== today.getFullYear() ? ` ${year}` : ''}`,
						value: formatDate(date),
						description: formatDateDescription(date)
					});
				});

				if (results.length > 0) return results;
			}
		}

		const dateMatch = lowerQuery.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?$/);
		if (dateMatch) {
			const day = parseInt(dateMatch[1]);
			const month = parseInt(dateMatch[2]) - 1;
			const year = dateMatch[3] ? parseInt(dateMatch[3]) : today.getFullYear();

			if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
				const date = new Date(year, month, day);
				results.push({
					id: 'parsed-dot-date',
					label: formatDateDescription(date),
					value: formatDate(date),
					description: formatDateDescription(date)
				});
				return results;
			}
		}

		const dashDateMatch = lowerQuery.match(/^(\d{1,2})-(\d{1,2})(?:-(\d{4}))?$/);
		if (dashDateMatch) {
			const day = parseInt(dashDateMatch[1]);
			const month = parseInt(dashDateMatch[2]) - 1;
			const year = dashDateMatch[3] ? parseInt(dashDateMatch[3]) : today.getFullYear();

			if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
				const date = new Date(year, month, day);
				results.push({
					id: 'parsed-dash-date',
					label: formatDateDescription(date),
					value: formatDate(date),
					description: formatDateDescription(date)
				});
				return results;
			}
		}

		const weekDays = {
			понедельник: 1,
			пн: 1,
			monday: 1,
			mon: 1,
			вторник: 2,
			вт: 2,
			tuesday: 2,
			tue: 2,
			среда: 3,
			ср: 3,
			wednesday: 3,
			wed: 3,
			четверг: 4,
			чт: 4,
			thursday: 4,
			thu: 4,
			пятница: 5,
			пт: 5,
			friday: 5,
			fri: 5,
			суббота: 6,
			сб: 6,
			saturday: 6,
			sat: 6,
			воскресенье: 0,
			вс: 0,
			sunday: 0,
			sun: 0
		};

		if (lowerQuery.length >= 2) {
			const matchingDays = Object.entries(weekDays).filter(([name, _]) =>
				name.startsWith(lowerQuery)
			);

			if (matchingDays.length > 0) {
				const uniqueDays = new Map<number, string>();
				matchingDays.forEach(([name, dayNum]) => {
					if (!uniqueDays.has(dayNum)) {
						uniqueDays.set(dayNum, name);
					} else {
						const current = uniqueDays.get(dayNum)!;
						if (name.length > current.length) {
							uniqueDays.set(dayNum, name);
						}
					}
				});

				const sortedDays = Array.from(uniqueDays.entries()).slice(0, 5);

				sortedDays.forEach(([dayNum, dayName], index) => {
					const currentDay = today.getDay();
					let daysToAdd = dayNum - currentDay;
					if (daysToAdd <= 0) daysToAdd += 7;

					const date = new Date(today);
					date.setDate(today.getDate() + daysToAdd);

					results.push({
						id: `parsed-weekday-${index}`,
						label: dayName,
						value: formatDate(date),
						description: formatDateDescription(date)
					});
				});

				if (results.length > 0) return results;
			}
		}

		const simpleNumberMatch = lowerQuery.match(/^(\d{1,2})$/);
		if (simpleNumberMatch) {
			const day = parseInt(simpleNumberMatch[1]);

			if (day >= 1 && day <= 31) {
				const currentYear = today.getFullYear();
				const currentMonth = today.getMonth();
				const currentDay = today.getDate();

				const thisMonthDate = new Date(currentYear, currentMonth, day, 12, 0, 0, 0);
				const isThisMonthValid =
					thisMonthDate.getDate() === day && thisMonthDate.getMonth() === currentMonth;

				if (isThisMonthValid && day >= currentDay) {
					results.push({
						id: 'parsed-this-month',
						label: `${day} число этого месяца`,
						value: formatDate(thisMonthDate),
						description: formatDateDescription(thisMonthDate)
					});
				}

				const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
				const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
				const nextMonthDate = new Date(nextYear, nextMonth, day, 12, 0, 0, 0);

				if (nextMonthDate.getDate() === day && nextMonthDate.getMonth() === nextMonth) {
					const monthNames = [
						'января',
						'февраля',
						'марта',
						'апреля',
						'мая',
						'июня',
						'июля',
						'августа',
						'сентября',
						'октября',
						'ноября',
						'декабря'
					];

					results.push({
						id: 'parsed-next-month',
						label: `${day} ${monthNames[nextMonth]}${nextYear !== currentYear ? ` ${nextYear}` : ''}`,
						value: formatDate(nextMonthDate),
						description: formatDateDescription(nextMonthDate)
					});
				}

				if (!isThisMonthValid || day < currentDay) {
					const nextYearDate = new Date(currentYear + 1, currentMonth, day, 12, 0, 0, 0);
					if (
						nextYearDate.getDate() === day &&
						nextYearDate.getMonth() === currentMonth
					) {
						const monthNames = [
							'января',
							'февраля',
							'марта',
							'апреля',
							'мая',
							'июня',
							'июля',
							'августа',
							'сентября',
							'октября',
							'ноября',
							'декабря'
						];

						results.push({
							id: 'parsed-next-year',
							label: `${day} ${monthNames[currentMonth]} ${nextYear + 1}`,
							value: formatDate(nextYearDate),
							description: formatDateDescription(nextYearDate)
						});
					}
				}

				if (results.length > 0) return results;
			}
		}

		return results;
	}

	function getPlural(num: number, one: string, few: string, many: string): string {
		const lastDigit = num % 10;
		const lastTwoDigits = num % 100;

		if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return many;
		if (lastDigit === 1) return one;
		if (lastDigit >= 2 && lastDigit <= 4) return few;
		return many;
	}

	function formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function formatDateDescription(date: Date): string {
		return date.toLocaleDateString('ru-RU', {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		});
	}

	function handleClickOutside(event: MouseEvent) {
		if (container && !container.contains(event.target as Node)) {
			event.stopPropagation();
			onClose();
		}
	}

	function handleContainerClick(event: MouseEvent) {
		event.stopPropagation();
	}

	function handlePresetSelect(preset: DatePreset) {
		if (preset.id === 'custom') {
			showCalendar = true;
			return;
		}

		onSelect(preset.value);
		onClose();
	}

	function handleSearchSubmit() {
		if (allOptions.length > 0) {
			handlePresetSelect(allOptions[0]);
		}
	}

	function handleCalendarSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.value) {
			onSelect(input.value);
			onClose();
		}
	}

	function handleBackToPresets() {
		showCalendar = false;
		searchQuery = '';
	}

	$: if (isOpen && searchInput) {
		setTimeout(() => searchInput?.focus(), 100);
	}
</script>

{#if isOpen}
	<Portal>
		<div
			class="fixed inset-0 z-120 flex items-center justify-center bg-black/50 px-4"
			transition:fade={{ duration: 200 }}
			on:click={handleClickOutside}
		>
			<div
				bind:this={container}
				class="w-full max-w-md rounded-2xl bg-slate-900 shadow-xl ring-1 ring-blue-500/50"
				transition:scale={{ duration: 200, easing: quintOut }}
				on:click={handleContainerClick}
			>
				{#if showCalendar}
					<div class="p-4">
						<div class="mb-4 flex items-center justify-between">
							<button
								on:click={handleBackToPresets}
								class="flex items-center gap-2 text-gray-400 hover:text-white"
							>
								<svg
									class="h-4 w-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M10 19l-7-7m0 0l7-7m-7 7h18"
									/>
								</svg>
								Назад
							</button>
							<h3 class="text-lg font-semibold text-white">Выберите дату</h3>
							<button
								on:click={onClose}
								class="text-gray-400 hover:text-white"
								aria-label="Закрыть"
							>
								<svg
									class="h-6 w-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>

						<div class="space-y-4">
							<input
								type="date"
								bind:value={selectedDate}
								on:change={handleCalendarSelect}
								class="w-full rounded-lg bg-slate-800 p-3 text-white"
							/>
						</div>
					</div>
				{:else}
					<div class="p-4">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-lg font-semibold text-white">Срок выполнения</h3>
							<button
								on:click={onClose}
								class="text-gray-400 hover:text-white"
								aria-label="Закрыть"
							>
								<svg
									class="h-6 w-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>

						<form on:submit|preventDefault={handleSearchSubmit} class="mb-4">
							<input
								bind:this={searchInput}
								bind:value={searchQuery}
								type="text"
								placeholder={placeholderText}
								class="w-full rounded-lg bg-slate-800 p-3 text-white placeholder:text-gray-400"
								autocomplete="off"
							/>
						</form>

						<div class="max-h-64 space-y-1 overflow-y-auto">
							{#each allOptions as preset, index}
								<button
									class="flex w-full items-center justify-between rounded-lg p-3 text-left transition-all hover:bg-slate-800 {index ===
										0 && parsedDates.length > 0
										? 'bg-slate-800/50'
										: ''}"
									on:click={() => handlePresetSelect(preset)}
								>
									<div class="flex items-center gap-3">
										<div class="text-gray-400">
											{#if preset.id.startsWith('parsed-')}
												<svg
													class="h-4 w-4"
													fill="currentColor"
													viewBox="0 0 16 16"
												>
													<path
														d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM12.5303 6.53033C12.8232 6.23744 12.8232 5.76256 12.5303 5.46967C12.2374 5.17678 11.7626 5.17678 11.4697 5.46967L7 9.93934L4.53033 7.46967C4.23744 7.17678 3.76256 7.17678 3.46967 7.46967C3.17678 7.76256 3.17678 8.23744 3.46967 8.53033L6.46967 11.5303C6.76256 11.8232 7.23744 11.8232 7.53033 11.5303L12.5303 6.53033Z"
													/>
												</svg>
											{:else}
												<svg
													class="h-4 w-4"
													fill="currentColor"
													viewBox="0 0 16 16"
												>
													<path
														d="M11 1C13.2091 1 15 2.79086 15 5V11C15 13.2091 13.2091 15 11 15H5C2.79086 15 1 13.2091 1 11V5C1 2.79086 2.79086 1 5 1H11ZM13.5 6H2.5V11C2.5 12.3807 3.61929 13.5 5 13.5H11C12.3807 13.5 13.5 12.3807 13.5 11V6Z"
													/>
												</svg>
											{/if}
										</div>
										<span class="text-white">{preset.label}</span>
									</div>
									{#if preset.description}
										<span class="text-sm text-gray-400"
											>{preset.description}</span
										>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</Portal>
{/if}
