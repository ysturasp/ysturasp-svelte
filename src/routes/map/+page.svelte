<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import BuildingMapCanvas from './components/BuildingMapCanvas.svelte';
	import MapBottomPanel from './components/MapBottomPanel.svelte';
	import AuditoriumInfo from './components/AuditoriumInfo.svelte';
	import { createBuildingMap, getAllAuditoriums } from './data';
	import { findRoute } from './route-finder';
	import type { Auditorium, Route } from './types';

	let buildingMap = createBuildingMap();
	let auditoriums = getAllAuditoriums(buildingMap);
	let selectedAuditorium: Auditorium | null = null;
	let routeStart: Auditorium | null = null;
	let routeEnd: Auditorium | null = null;
	let currentRoute: Route | null = null;
	let hoveredAuditorium: Auditorium | null = null;
	let auditoriumStatuses: Record<string, boolean> = {};

	function handleAuditoriumClick(auditorium: Auditorium) {
		selectedAuditorium = auditorium;
		if (auditorium === routeStart) {
			handleStartChange(null);
		} else if (auditorium === routeEnd) {
			handleEndChange(null);
		}
	}

	function handleStartChange(aud: Auditorium | null) {
		routeStart = aud;
		if (aud && routeEnd && aud.id === routeEnd.id) routeEnd = null;
		if (routeStart && routeEnd) {
			calculateRoute();
		} else {
			currentRoute = null;
		}
	}

	function handleEndChange(aud: Auditorium | null) {
		routeEnd = aud;
		if (aud && routeStart && aud.id === routeStart.id) routeStart = null;
		if (routeStart && routeEnd) {
			calculateRoute();
		} else {
			currentRoute = null;
		}
	}

	function handleSwap() {
		const temp = routeStart;
		routeStart = routeEnd;
		routeEnd = temp;
		if (routeStart && routeEnd) {
			calculateRoute();
		}
	}

	function getAuditoriumStatus(aud: Auditorium | null): boolean | null {
		if (!aud) return null;
		const baseName = aud.name;
		const gName = `Г-${baseName}`;
		const withoutPrefix = baseName.replace(/^Г-/, '');
		const actualStatus =
			auditoriumStatuses[baseName] ??
			auditoriumStatuses[gName] ??
			auditoriumStatuses[withoutPrefix];
		return actualStatus ?? null;
	}

	function calculateRoute() {
		if (!routeStart || !routeEnd) {
			currentRoute = null;
			return;
		}

		const route = findRoute(buildingMap, routeStart.id, routeEnd.id);
		currentRoute = route;
	}

	function handleAuditoriumHover(aud: Auditorium | null) {
		hoveredAuditorium = aud;
	}

	function closeAuditoriumInfo() {
		selectedAuditorium = null;
	}

	async function loadAuditoriumStatuses() {
		try {
			const response = await fetch('/api/map/auditoriums-status');
			if (response.ok) {
				const data = await response.json();
				console.log('Loaded auditorium statuses:', data);
				auditoriumStatuses = data;
			}
		} catch (error) {
			console.error('Error loading auditorium statuses:', error);
		}
	}

	onMount(() => {
		loadAuditoriumStatuses();
		const interval = setInterval(loadAuditoriumStatuses, 60000);
		const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
		const body = typeof document !== 'undefined' ? document.body : null;
		const html = typeof document !== 'undefined' ? document.documentElement : null;
		const prev = body
			? {
					position: body.style.position,
					top: body.style.top,
					left: body.style.left,
					right: body.style.right,
					width: body.style.width,
					overflow: body.style.overflow
				}
			: null;
		const prevHtmlOverflow = html ? html.style.overflow : null;

		if (body && html) {
			html.style.overflow = 'hidden';
			body.style.overflow = 'hidden';
			body.style.position = 'fixed';
			body.style.top = `-${scrollY}px`;
			body.style.left = '0';
			body.style.right = '0';
			body.style.width = '100%';
		}

		return () => {
			clearInterval(interval);
			if (body && html && prev) {
				body.style.position = prev.position;
				body.style.top = prev.top;
				body.style.left = prev.left;
				body.style.right = prev.right;
				body.style.width = prev.width;
				body.style.overflow = prev.overflow;
				html.style.overflow = prevHtmlOverflow ?? '';
				window.scrollTo(0, scrollY);
			}
		};
	});
</script>

<svelte:head>
	<title>Интерактивная карта корпуса | ysturasp</title>
	<meta
		name="description"
		content="Интерактивная карта корпуса ЯГТУ с построением маршрутов между аудиториями"
	/>
</svelte:head>

<PageLayout>
	<div
		class="relative h-[100svh] w-screen overflow-hidden bg-slate-900 supports-[height:100dvh]:h-[100dvh]"
	>
		<div class="absolute inset-0">
			<BuildingMapCanvas
				{buildingMap}
				{selectedAuditorium}
				{routeStart}
				{routeEnd}
				{currentRoute}
				{auditoriumStatuses}
				onAuditoriumClick={handleAuditoriumClick}
				onAuditoriumHover={handleAuditoriumHover}
			/>
		</div>

		<Header />

		<MapBottomPanel
			{routeStart}
			{routeEnd}
			{currentRoute}
			{auditoriums}
			onStartChange={handleStartChange}
			onEndChange={handleEndChange}
			onSwap={handleSwap}
		/>

		<AuditoriumInfo
			auditorium={selectedAuditorium}
			onClose={closeAuditoriumInfo}
			status={getAuditoriumStatus(selectedAuditorium)}
			onSelectAsStart={handleStartChange}
			onSelectAsEnd={handleEndChange}
			isStartSelected={Boolean(
				selectedAuditorium && routeStart && selectedAuditorium.id === routeStart.id
			)}
			isEndSelected={Boolean(
				selectedAuditorium && routeEnd && selectedAuditorium.id === routeEnd.id
			)}
		/>
	</div>
</PageLayout>
