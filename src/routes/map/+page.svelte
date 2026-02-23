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

		if (!routeStart) {
			routeStart = auditorium;
		} else if (!routeEnd && routeStart.id !== auditorium.id) {
			routeEnd = auditorium;
			calculateRoute();
		} else if (routeStart.id === auditorium.id) {
			routeStart = null;
			routeEnd = null;
			currentRoute = null;
		} else if (routeEnd?.id === auditorium.id) {
			routeEnd = null;
			currentRoute = null;
		} else {
			routeStart = auditorium;
			routeEnd = null;
			currentRoute = null;
		}
	}

	function handleStartChange(aud: Auditorium | null) {
		routeStart = aud;
		if (routeStart && routeEnd) {
			calculateRoute();
		} else {
			currentRoute = null;
		}
	}

	function handleEndChange(aud: Auditorium | null) {
		routeEnd = aud;
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
		return () => clearInterval(interval);
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
	<div class="relative h-[100svh] w-screen overflow-hidden bg-slate-900">
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

		<AuditoriumInfo auditorium={selectedAuditorium} onClose={closeAuditoriumInfo} />
	</div>
</PageLayout>
