<script lang="ts">
	import { quintOut } from 'svelte/easing';
	import { scale, fade } from 'svelte/transition';
	import { onMount, onDestroy } from 'svelte';
	import type { TeacherSubgroups } from '../stores/subgroups';
	import type { SemesterInfo } from '$lib/utils/semester';
	import { getWeekNumberByDate } from '$lib/utils/semester';
	import * as XLSX from 'xlsx';

	export let teacherSubgroups: TeacherSubgroups = {};
	export let selectedSemester: SemesterInfo | null = null;
	export let show = false;

	let subjects = new Set<string>();
	let dates = new Set<string>();
	let dateToWeek = new Map<string, number>();
	let subjectStats: Record<string, { group1: number; group2: number }> = {};
	let scrollY: number;

	$: if (show) {
		prepareTableData();
	}

	function toggleScrollLock(enabled: boolean) {
		const body = document.body;
		const scrollbarWidth = window.innerWidth - body.clientWidth;

		if (enabled) {
			scrollY = window.scrollY;
			body.style.position = 'fixed';
			body.style.top = `-${scrollY}px`;
			body.style.width = '100%';
		} else {
			body.style.position = '';
			body.style.top = '';
			body.style.width = '';
			window.scrollTo(0, scrollY);
		}
	}

	$: if (show) {
		toggleScrollLock(true);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && show) {
			close();
		}
	}

	function handleOutsideClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.modal-content')) {
			close();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeydown);
		if (show) {
			toggleScrollLock(false);
		}
	});

	function prepareTableData() {
		subjects.clear();
		dates.clear();
		dateToWeek.clear();
		subjectStats = {};

		Object.entries(teacherSubgroups).forEach(([key, data]) => {
			const [subject, teacher] = key.split('_');
			const displaySubject = subject === 'null' ? `null (${teacher})` : subject;
			subjects.add(displaySubject);

			if (!subjectStats[displaySubject]) {
				subjectStats[displaySubject] = { group1: 0, group2: 0 };
			}

			Object.entries(data.dates || {}).forEach(([dateTime, info]) => {
				const [date] = dateTime.split('_');
				dates.add(date);

				if (info.subgroup === 1) subjectStats[displaySubject].group1++;
				if (info.subgroup === 2) subjectStats[displaySubject].group2++;

				if (selectedSemester) {
					const weekNum = getWeekNumberByDate(
						new Date(date.split('.').reverse().join('-')),
						selectedSemester
					);
					dateToWeek.set(date, weekNum);
				}
			});
		});
	}

	function downloadExcel() {
		const wb = XLSX.utils.book_new();
		const data: any[][] = [];

		const subjectsHeader = ['ysturasp', ''];
		const statsHeader = ['', ''];
		Array.from(subjects).forEach((subject) => {
			subjectsHeader.push(subject, '');
			statsHeader.push(
				`1-я: ${subjectStats[subject].group1} зан.`,
				`2-я: ${subjectStats[subject].group2} зан.`
			);
		});
		data.push(subjectsHeader);
		data.push(statsHeader);

		const headers = ['Неделя', 'Дата'];
		Array.from(subjects).forEach(() => {
			headers.push('Время', 'Подгруппа');
		});
		data.push(headers);

		const weekGroups = Array.from(dateToWeek.entries())
			.sort(([, a], [, b]) => a - b)
			.reduce(
				(acc, [date, week]) => {
					const weekGroup = acc.find((g) => g.week === week);
					if (weekGroup) {
						weekGroup.dates.push(date);
					} else {
						acc.push({ week, dates: [date] });
					}
					return acc;
				},
				[] as { week: number; dates: string[] }[]
			);

		weekGroups.forEach((weekGroup) => {
			weekGroup.dates.sort().forEach((date, dateIdx) => {
				const row = [dateIdx === 0 ? `${weekGroup.week}-я` : '', date];

				Array.from(subjects).forEach((subject) => {
					const items: { time: string; subgroup: string }[] = [];
					Object.entries(teacherSubgroups).forEach(([key, data]) => {
						const [subjectName, teacher] = key.split('_');
						const displaySubject =
							subjectName === 'null' ? `null (${teacher})` : subjectName;
						if (displaySubject === subject) {
							Object.entries(data.dates || {}).forEach(([dateTime, info]) => {
								const [cellDate, timeValue] = dateTime.split('_');
								if (cellDate === date) {
									items.push({
										time: timeValue?.replace('-', ' - ') || '',
										subgroup: `${info.subgroup}-я${info.isVUC ? ' (ВУЦ)' : ''}`
									});
								}
							});
						}
					});
					row.push(
						items.map((i) => i.time).join('\n'),
						items.map((i) => i.subgroup).join('\n')
					);
				});

				data.push(row);
			});
		});

		const ws = XLSX.utils.aoa_to_sheet(data);

		const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];

		let colIndex = 0;
		Array.from(subjects).forEach(() => {
			merges.push({
				s: { r: 0, c: colIndex + 2 },
				e: { r: 0, c: colIndex + 3 }
			});
			colIndex += 2;
		});

		let currentRow = 3;
		weekGroups.forEach((weekGroup) => {
			if (weekGroup.dates.length > 1) {
				merges.push({
					s: { r: currentRow, c: 0 },
					e: { r: currentRow + weekGroup.dates.length - 1, c: 0 }
				});
			}
			currentRow += weekGroup.dates.length;
		});

		ws['!merges'] = merges;

		const colWidth = Array(headers.length).fill({ wch: 15 });
		colWidth[0] = { wch: 8 };
		colWidth[1] = { wch: 12 };
		ws['!cols'] = colWidth;

		XLSX.utils.book_append_sheet(wb, ws, 'Распределение подгрупп');
		XLSX.writeFile(wb, 'subgroups_distribution.xlsx');
	}

	function close() {
		show = false;
		toggleScrollLock(false);
	}
</script>

{#if show}
	<div
		class="fixed inset-0 z-100"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		on:click={handleOutsideClick}
		on:keydown={handleKeydown}
	>
		<div
			class="absolute inset-0 bg-black/50"
			transition:fade={{
				duration: 150
			}}
		></div>

		<div
			class="fixed inset-0 flex items-center justify-center overflow-y-auto overscroll-contain"
			transition:scale={{
				duration: 200,
				opacity: 0,
				start: 0.95,
				easing: quintOut
			}}
		>
			<div
				class="modal-content mx-auto my-4 w-[calc(100%-1.5rem)] max-w-7xl rounded-2xl bg-slate-800 p-4"
			>
				<div class="mb-4">
					<h3 class="text-xl font-semibold text-white md:text-2xl">
						📊 Таблица распределения подгрупп
					</h3>
				</div>

				<div
					class="mb-4 max-h-[calc(100vh-16rem)] overflow-auto rounded-lg ring-1 ring-blue-500/50"
				>
					<div class="min-w-max">
						<table class="w-full text-left text-xs text-white">
							<thead>
								<tr class="bg-slate-700">
									<th colspan="2" class="px-2 py-1.5 text-center">ysturasp</th>
									{#each Array.from(subjects) as subject}
										<th
											colspan="2"
											class="border-l border-slate-600 px-2 py-1.5 text-center"
										>
											<div class="font-medium">{subject}</div>
											<div class="mt-0.5 text-[10px] text-yellow-400">
												1-я: {subjectStats[subject].group1} зан. | 2-я: {subjectStats[
													subject
												].group2} зан.
											</div>
										</th>
									{/each}
								</tr>
								<tr class="bg-slate-700">
									<th class="px-2 py-1.5 text-center">Неделя</th>
									<th class="px-2 py-1.5 text-center">Дата</th>
									{#each Array.from(subjects) as _}
										<th
											class="border-l border-slate-600 px-2 py-1.5 text-center"
											>Время</th
										>
										<th class="px-2 py-1.5 text-center">Подгруппа</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each Array.from(dateToWeek.entries())
									.sort(([, a], [, b]) => a - b)
									.reduce((acc, [date, week]) => {
											const weekGroup = acc.find((g) => g.week === week);
											if (weekGroup) {
												weekGroup.dates.push(date);
											} else {
												acc.push({ week, dates: [date] });
											}
											return acc;
										}, [] as { week: number; dates: string[] }[]) as weekGroup}
									{#each weekGroup.dates.sort() as date, dateIdx}
										<tr class="border-b border-slate-600 hover:bg-slate-700">
											{#if dateIdx === 0}
												<td
													class="bg-slate-700 px-2 py-1.5 text-center"
													rowspan={weekGroup.dates.length}
												>
													{weekGroup.week}-я
												</td>
											{/if}
											<td class="px-2 py-1.5">{date}</td>
											{#each Array.from(subjects) as subject}
												{@const entries = (() => {
													const items: {
														time: string;
														subgroup: string;
													}[] = [];
													Object.entries(teacherSubgroups).forEach(
														([key, data]) => {
															const [subjectName, teacher] =
																key.split('_');
															const displaySubject =
																subjectName === 'null'
																	? `null (${teacher})`
																	: subjectName;
															if (displaySubject === subject) {
																Object.entries(
																	data.dates || {}
																).forEach(([dateTime, info]) => {
																	const [cellDate, timeValue] =
																		dateTime.split('_');
																	if (cellDate === date) {
																		items.push({
																			time:
																				timeValue?.replace(
																					'-',
																					' - '
																				) || '',
																			subgroup: `${info.subgroup}-я${info.isVUC ? ' (ВУЦ)' : ''}`
																		});
																	}
																});
															}
														}
													);
													return items;
												})()}
												<td
													class="border-l border-slate-600 px-2 py-1.5 text-center"
												>
													{#each entries as e}
														<div>{e.time}</div>
													{/each}
												</td>
												<td class="px-2 py-1.5 text-center">
													{#each entries as e}
														<div>{e.subgroup}</div>
													{/each}
												</td>
											{/each}
										</tr>
									{/each}
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-2">
					<button
						on:click={close}
						class="flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm text-white transition-colors hover:bg-slate-600 md:text-base"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
						Закрыть
					</button>
					<button
						on:click={downloadExcel}
						class="flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm text-white transition-colors hover:bg-green-600 md:text-base"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
							/>
						</svg>
						Скачать Excel
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
