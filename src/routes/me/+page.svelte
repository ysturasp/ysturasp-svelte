<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import MyGrades from '../profile/components/MyGrades.svelte';
	import AuthButton from '../format/components/AuthButton.svelte';
	import AcademicLink from '../profile/components/AcademicLink.svelte';
	import NavigationLinks from '$lib/components/ui/NavigationLinks.svelte';
	import { fade } from 'svelte/transition';
	import { EDUCATION_FORMS } from '$lib/constants/ystu';

	let groupStats: { average: number; count: number; institute?: string } | null = null;
	let myStats: { average: number; total: number; counts: any } | null = null;

	onMount(async () => {
		await auth.checkAuth();
		await auth.checkAcademic();

		if (!$auth.loading && !$auth.authenticated && $auth.isTelegram) {
			goto('/format');
		}
	});

	$: student = $auth.academicUser;
	$: details = $auth.academicDetailedUser;

	$: if (student?.groupName && myStats && myStats.total > 0) {
		fetchGroupStats(student.groupName, myStats.average);
	}

	async function fetchGroupStats(group: string, userAverage?: number) {
		try {
			let query = `/api/stat/group?group=${encodeURIComponent(group)}`;
			if (userAverage) {
				query += `&userAverage=${userAverage}`;
			}
			const res = await fetch(query);
			if (res.ok) {
				groupStats = await res.json();
			}
		} catch (e) {
			console.error(e);
		}
	}

	function handleStatsUpdate(event: any) {
		myStats = event.detail;
	}

	$: diff =
		groupStats && myStats && myStats.average > 0
			? (myStats.average - groupStats.average).toFixed(2)
			: null;
	$: hasRequiredData = !!student && !!myStats && (!student.groupName || !!groupStats);
	$: isAuthChecked = !$auth.loading && !$auth.academicLoading;
	$: isLoggedIn = $auth.authenticated;
	$: isTelegramUser = $auth.isTelegram;
</script>

<svelte:head>
	<title>Личный кабинет студента | ysturasp</title>
	<meta
		name="description"
		content="Личный кабинет студента ЯГТУ - оценки, статистика и академический профиль"
	/>
</svelte:head>

<PageLayout>
	<Header>
		<NavigationLinks
			slot="links-desktop"
			variant="desktop"
			currentPage="ystu"
			pageType="students"
		/>
		<NavigationLinks
			slot="links-mobile"
			variant="mobile"
			currentPage="ystu"
			pageType="students"
		/>
		<div slot="personal-account-ystu">
			<a
				href="/me"
				class="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg ring-1 shadow-blue-500/20 ring-blue-400 transition-all md:h-12 md:w-12"
				aria-label="Личный кабинет ЯГТУ"
			>
				<svg
					class="h-5 w-5 transition-transform duration-200 group-hover:-translate-y-0.5 md:h-[22px] md:w-[22px]"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
					<circle cx="12" cy="7" r="4" />
				</svg>
			</a>
		</div>
	</Header>

	<main class="container mx-auto px-4 md:px-0">
		{#if !isAuthChecked || (!!student && !hasRequiredData)}
			<div class="mx-auto mt-12 flex max-w-6xl animate-pulse flex-col gap-6 md:mt-16">
				<div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
					<div class="flex items-center gap-6">
						<div
							class="h-24 w-24 rounded-2xl border border-white/5 bg-slate-800/50 md:h-32 md:w-32"
						></div>
						<div class="flex flex-col gap-3">
							<div class="h-5 w-20 rounded bg-slate-800/50"></div>
							<div class="h-10 w-48 rounded-lg bg-slate-800/50 md:h-14"></div>
						</div>
					</div>
					<div class="flex flex-col items-stretch gap-4 md:items-end">
						<div class="flex items-baseline gap-10">
							<div class="flex flex-col gap-2">
								<div class="h-3 w-12 rounded bg-slate-800/50"></div>
								<div class="h-12 w-24 rounded-lg bg-slate-800/50 md:h-16"></div>
							</div>
							<div class="flex flex-col gap-2">
								<div class="h-3 w-12 rounded bg-slate-800/50"></div>
								<div class="h-12 w-24 rounded-lg bg-slate-800/50 md:h-16"></div>
							</div>
						</div>
						<div class="mt-3 h-10 w-48 rounded-xl bg-slate-800/50 md:w-56"></div>
					</div>
				</div>

				<div
					class="overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 shadow-2xl"
				>
					<div class="grid grid-cols-2 gap-px bg-slate-800/20 md:grid-cols-4">
						{#each Array(4) as _}
							<div class="flex flex-col gap-3 bg-slate-900/40 p-5 md:p-6">
								<div class="h-3 w-16 rounded bg-slate-800/50"></div>
								<div class="h-6 w-24 rounded bg-slate-800/50"></div>
							</div>
						{/each}
					</div>
					<div class="flex flex-col gap-6 border-t border-white/5 p-4 md:p-6">
						<div class="flex items-center justify-between">
							<div class="flex flex-col gap-2">
								<div class="h-3 w-32 rounded bg-slate-800/50"></div>
								<div class="h-4 w-48 rounded bg-slate-800/50"></div>
							</div>
							<div class="h-8 w-24 rounded-lg bg-slate-800/50"></div>
						</div>
						<div class="h-10 w-full rounded-lg bg-slate-800/50"></div>
					</div>
				</div>
			</div>

			{#if student}
				<div class="pointer-events-none fixed hidden h-0 w-0 overflow-hidden opacity-0">
					<MyGrades on:averageUpdate={handleStatsUpdate} />
				</div>
			{/if}
		{:else if !isLoggedIn && !isTelegramUser}
			<div in:fade class="mx-auto mt-20 max-w-2xl p-4 text-center">
				<div
					class="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-500/20 bg-blue-600/10"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 95 95"
						class="h-14 w-14"
						fill="none"
					>
						<path
							fill-rule="evenodd"
							clip-rule="evenodd"
							d="M94.9997 73.8889C91.5433 86.0563 80.3544 95 67.0805 95H36.9443V73.8889H94.9997Z"
							fill="#F07C00"
						/>
						<path
							fill-rule="evenodd"
							clip-rule="evenodd"
							d="M0 65.9721C0 58.9596 2.45605 52.5178 6.59731 47.5C2.44174 42.4778 0 36.0537 0 29.0278C0 12.9989 12.9989 0 29.0277 0H94.9998V21.1112H29.0277C24.6562 21.1112 21.1111 24.6562 21.1111 29.0278C21.1111 33.3993 24.6562 36.9444 29.0277 36.9444H94.9998V58.0555H29.0277C24.6562 58.0555 21.1111 61.6005 21.1111 65.9721V94.9998H0V65.9721Z"
							fill="#004589"
						/>
					</svg>
				</div>

				<h1 class="mb-6 text-3xl font-black tracking-tight text-white uppercase">
					Личный кабинет ЯГТУ
				</h1>

				<div class="mx-auto mb-8 max-w-sm space-y-6 text-left">
					<div class="flex items-start gap-4">
						<div
							class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-white/5 bg-slate-800 text-[10px] font-black text-slate-400"
						>
							1
						</div>
						<p class="text-sm leading-snug text-slate-300">
							Сначала нужно <b>войти через Google</b>, чтобы мы могли сохранить ваши
							данные и показывать оценки
						</p>
					</div>
					<div class="flex items-start gap-4">
						<div
							class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-white/5 bg-slate-800 text-[10px] font-black text-slate-400"
						>
							2
						</div>
						<p class="text-sm leading-snug text-slate-300">
							После входа вы сможете <b>привязать личный кабинет ЯГТУ</b>, введя логин
							и пароль от ЛК.
						</p>
					</div>
				</div>

				<div class="flex justify-center">
					<AuthButton />
				</div>
			</div>
		{:else if isLoggedIn && !student}
			<div in:fade class="mx-auto mt-20 max-w-2xl p-4 text-center">
				<h1 class="mb-4 text-3xl font-black tracking-tight text-white uppercase">
					Привязка кабинета ЯГТУ
				</h1>

				<p class="mx-auto mb-8 max-w-md text-sm leading-snug text-slate-300">
					Вы авторизованы - теперь привяжите
					<b>личный кабинет ЯГТУ</b>, чтобы смотреть оценки, средний балл и статистику.
				</p>

				<div class="text-left">
					<AcademicLink />
				</div>
			</div>
		{:else if !student}
			<div in:fade class="mx-auto mt-20 max-w-2xl p-4 text-center">
				<div
					class="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-600/10"
				>
					<svg
						class="h-10 w-10 text-blue-500"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M12 11V7a4 4 0 0 1 8 0v4h3v10H1V11h3V7a4 4 0 0 1 8 0v4" />
					</svg>
				</div>

				<h1 class="mb-6 text-3xl font-black tracking-tight text-white uppercase">
					Личный кабинет ЯГТУ
				</h1>

				<div class="mx-auto mb-10 max-w-sm space-y-6 text-left">
					{#if $auth.isTelegram}
						<div class="flex items-start gap-4">
							<div
								class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-blue-500/20 bg-blue-600/20 text-[10px] font-black text-blue-400"
							>
								!
							</div>
							<p class="text-sm leading-snug text-slate-300">
								В Telegram <b>авторизация через Google не требуется</b>.
							</p>
						</div>
						<div class="flex items-start gap-4">
							<div
								class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-white/5 bg-slate-800 text-[10px] font-black text-slate-400"
							>
								1
							</div>
							<p class="text-sm leading-snug text-slate-300">
								Просто перейдите в профиль и <b>привяжите личный кабинет ЯГТУ</b>,
								введя логин и пароль.
							</p>
						</div>
					{:else}
						<div class="flex items-start gap-4">
							<div
								class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-white/5 bg-slate-800 text-[10px] font-black text-slate-400"
							>
								1
							</div>
							<p class="text-sm leading-snug text-slate-300">
								Сначала нужно <b>войти через Google</b>, чтобы мы могли сохранить
								ваши данные.
							</p>
						</div>
						<div class="flex items-start gap-4">
							<div
								class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-white/5 bg-slate-800 text-[10px] font-black text-slate-400"
							>
								2
							</div>
							<p class="text-sm leading-snug text-slate-300">
								Затем в профиле <b>привязать личный кабинет ЯГТУ</b>, введя логин и
								пароль.
							</p>
						</div>
					{/if}
				</div>

				<a
					href="/profile"
					class="flex w-full items-center justify-center rounded-xl bg-blue-600 px-8 py-4 text-xs font-black tracking-widest text-white uppercase shadow-xl shadow-blue-500/10 transition-all hover:bg-blue-500 active:scale-95"
				>
					{$auth.isTelegram ? 'Привязать кабинет ЯГТУ' : 'Перейти к авторизации'}
				</a>
			</div>
		{:else}
			<div
				in:fade={{ duration: 250 }}
				class="mx-auto mt-12 flex max-w-6xl flex-col gap-6 md:mt-16"
			>
				<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
					<div class="flex flex-1 items-center gap-6">
						<div class="relative flex-shrink-0">
							<img
								src={student.photoUrl}
								alt="Student"
								class="h-24 w-24 rounded-2xl border border-slate-700 object-cover shadow-2xl md:h-32 md:w-32"
							/>
						</div>
						<div class="flex flex-col gap-1.5">
							<div class="mb-1 flex flex-wrap gap-2">
								<span
									class="rounded border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-400 uppercase"
								>
									{student.groupName}
								</span>
								{#if details?.isBudget}
									<span
										class="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-400 uppercase"
									>
										Бюджет
									</span>
								{/if}
							</div>
							<h1
								class="text-3xl leading-[0.9] font-bold tracking-tight text-white uppercase md:text-5xl"
							>
								{student.lastName}<br />
								<span class="text-blue-500"
									>{student.firstName} {student.patronymic}</span
								>
							</h1>
						</div>
					</div>

					<div class="flex flex-col items-stretch gap-4 md:items-end">
						<div class="flex items-baseline gap-10">
							<div>
								<div
									class="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase"
								>
									Ср. балл
								</div>
								<div
									class="text-5xl font-bold md:text-7xl {myStats &&
									myStats.average >= 4
										? 'text-emerald-400'
										: 'text-rose-400'} leading-none tracking-tighter"
								>
									{myStats ? myStats.average.toFixed(2) : '—'}
								</div>
							</div>
							<div>
								<div
									class="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase"
								>
									Всего
								</div>
								<div
									class="text-5xl leading-none font-bold tracking-tighter text-white md:text-7xl"
								>
									{myStats ? myStats.total : '—'}
								</div>
							</div>
						</div>

						<a
							href="/profile"
							class="mt-2 flex items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-xs font-bold text-blue-400 transition-all hover:bg-blue-500/20"
						>
							Перейти в профиль ysturasp
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
									d="M14 5l7 7m0 0l-7 7m7-7H3"
								/>
							</svg>
						</a>
					</div>
				</div>

				<div
					class="overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 shadow-2xl transition-all"
				>
					<div class="grid grid-cols-2 gap-px bg-slate-800/50 md:grid-cols-4">
						<div class="flex flex-col items-start bg-slate-900/40 p-5 text-left md:p-6">
							<p
								class="mb-1.5 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
							>
								Зачётка
							</p>
							<p class="font-mono text-lg font-bold text-white uppercase">
								{details?.recordBook || '—'}
							</p>
						</div>
						<div class="flex flex-col items-start bg-slate-900/40 p-5 text-left md:p-6">
							<p
								class="mb-1.5 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
							>
								Курс
							</p>
							<p class="text-lg font-bold text-white uppercase">
								{details?.course || '—'} КУРС
							</p>
						</div>
						<div class="flex flex-col items-start bg-slate-900/40 p-5 text-left md:p-6">
							<p
								class="mb-1.5 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
							>
								Поступление
							</p>
							<p class="text-lg font-bold text-white uppercase">
								{details?.admissionYearId || '—'} ГОД
							</p>
						</div>
						<div class="flex flex-col items-start bg-slate-900/40 p-5 text-left md:p-6">
							<p
								class="mb-1.5 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
							>
								Форма
							</p>
							<p class="text-lg font-bold text-white uppercase">
								{details ? EDUCATION_FORMS[details.educationFormId] || '—' : '—'}
							</p>
						</div>
					</div>

					{#if myStats && myStats.total > 0}
						<div class="space-y-6 border-t border-white/5 p-4 md:p-6">
							<div
								class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
							>
								<div class="flex flex-col"></div>

								{#if groupStats}
									<div class="flex flex-col items-start gap-1.5 sm:items-end">
										<div
											class="flex w-full items-center justify-between gap-4 sm:w-auto"
										>
											<div
												class="text-[10px] font-bold tracking-widest text-slate-500 uppercase"
											>
												Рейтинг в группе
											</div>
											<div
												class="flex-shrink-0 rounded bg-slate-800/80 px-2 py-0.5 text-[9px] font-bold tracking-tighter text-slate-500 uppercase md:hidden"
											>
												Среднее: {groupStats.average.toFixed(2)}
											</div>
										</div>

										<div class="flex items-center gap-2 sm:justify-end">
											{#if (groupStats as any).percentile !== undefined}
												<span
													class="text-sm font-bold {(groupStats as any)
														.percentile >= 50
														? 'text-emerald-400'
														: 'text-slate-300'} leading-tight"
												>
													Вы лучше, чем {(groupStats as any).percentile}%
													студентов группы
												</span>
											{:else if diff}
												<span
													class="text-sm font-bold {Number(diff) >= 0
														? 'text-emerald-400'
														: 'text-rose-400'} leading-tight"
												>
													{Number(diff) >= 0 ? 'Выше' : 'Ниже'} среднего на
													{Math.abs(Number(diff))}
												</span>
											{/if}
											<div
												class="hidden flex-shrink-0 rounded bg-slate-800 px-2 py-0.5 text-[9px] font-bold tracking-tighter text-slate-500 uppercase md:block"
											>
												Среднее: {groupStats.average.toFixed(2)}
											</div>
										</div>
									</div>
								{/if}
							</div>

							<div class="space-y-4">
								<div
									class="flex h-10 w-full overflow-hidden rounded-lg bg-slate-800/50 shadow-inner ring-1 ring-white/10"
								>
									{#each [{ val: 2, color: 'bg-rose-500/80', hover: 'hover:bg-rose-500' }, { val: 3, color: 'bg-amber-500/80', hover: 'hover:bg-amber-500' }, { val: 4, color: 'bg-blue-500/80', hover: 'hover:bg-blue-500' }, { val: 5, color: 'bg-emerald-500/80', hover: 'hover:bg-emerald-500' }, { val: 0, color: 'bg-slate-600/60', hover: 'hover:bg-slate-500', label: 'зачет' }] as m}
										{#if (myStats.counts[m.val] || 0) > 0}
											<div
												class="group relative h-full border-r border-slate-900/30 {m.color} transition-all {m.hover}"
												style="width: {(
													((myStats.counts[m.val] || 0) / myStats.total) *
													100
												).toFixed(2)}%"
											>
												<div
													class="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white uppercase opacity-0 transition-opacity group-hover:opacity-100"
												>
													{m.label || m.val}
												</div>
											</div>
										{/if}
									{/each}
								</div>

								<div class="flex flex-wrap gap-2.5">
									{#each [{ val: 2, label: 'Неуд', color: 'bg-rose-500' }, { val: 3, label: 'Удовл', color: 'bg-amber-500' }, { val: 4, label: 'Хор', color: 'bg-blue-500' }, { val: 5, label: 'Отл', color: 'bg-emerald-500' }, { val: 0, label: 'Зачёт', color: 'bg-slate-500' }] as item}
										{#if (myStats.counts[item.val] || 0) > 0}
											<div
												class="flex items-center gap-2 rounded-lg border border-white/5 bg-slate-800/40 px-2 py-1"
											>
												<div
													class="h-1.5 w-1.5 rounded-full {item.color}"
												></div>
												<span
													class="text-[9px] font-black tracking-tight text-slate-500 uppercase"
													>{item.label}</span
												>
												<b class="ml-0.5 text-[11px] font-black text-white"
													>{myStats.counts[item.val]}</b
												>
											</div>
										{/if}
									{/each}
								</div>
							</div>
						</div>
					{/if}
				</div>

				<div class="mt-4 pb-10">
					<MyGrades on:averageUpdate={handleStatsUpdate} />
				</div>
			</div>
		{/if}
	</main>

	<Footer />
</PageLayout>

<style>
	:global(body) {
		background-color: #020617;
	}
</style>
