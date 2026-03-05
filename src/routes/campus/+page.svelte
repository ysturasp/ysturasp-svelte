<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import IntelligentMapPromo from './components/IntelligentMapPromo.svelte';
	import { onMount } from 'svelte';
	import mapboxgl from 'mapbox-gl';

	let map: mapboxgl.Map;
	let mapContainer: HTMLDivElement;

	onMount(() => {
		const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
		if (!token) {
			console.error('VITE_MAPBOX_ACCESS_TOKEN is not set');
			return;
		}
		mapboxgl.accessToken = token;

		map = new mapboxgl.Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/navigation-night-v1',
			center: [39.856503, 57.587234],
			zoom: 15,
			projection: 'globe',
			pitch: 55,
			bearing: -10
		});

		map.on('style.load', () => {
			map.setFog({
				'color': 'rgb(15, 23, 42)',
				'high-color': 'rgb(15, 23, 42)',
				'horizon-blend': 0.1,
				'space-color': 'rgb(15, 23, 42)',
				'star-intensity': 0.8
			});
		});

		map.on('load', () => {
			map.addLayer({
				'id': 'building-layer',
				'type': 'fill-extrusion',
				'source': {
					type: 'vector',
					url: 'mapbox://mapbox.mapbox-streets-v8'
				},
				'source-layer': 'building',
				'paint': {
					'fill-extrusion-color': '#1e293b',
					'fill-extrusion-height': [
						'interpolate',
						['linear'],
						['zoom'],
						0,
						0,
						15.05,
						['get', 'height']
					],
					'fill-extrusion-base': 0,
					'fill-extrusion-opacity': 0.6,
					'fill-extrusion-vertical-gradient': true
				}
			});

			fetch('Кампус.geojson')
				.then((response) => response.json())
				.then((data) => {
					map.addSource('campus', {
						type: 'geojson',
						data: data
					});

					map.addLayer({
						id: 'campus-points',
						type: 'circle',
						source: 'campus',
						paint: {
							'circle-radius': 8,
							'circle-color': '#3b82f6',
							'circle-stroke-width': 3,
							'circle-stroke-color': '#ffffff',
							'circle-opacity': 0.9,
							'circle-stroke-opacity': 0.9
						}
					});

					map.addLayer({
						id: 'campus-labels',
						type: 'symbol',
						source: 'campus',
						layout: {
							'text-field': ['get', 'iconCaption'],
							'text-size': 14,
							'text-offset': [0, -2.5],
							'text-anchor': 'top',
							'text-allow-overlap': true,
							'text-ignore-placement': true,
							'text-transform': 'uppercase',
							'text-letter-spacing': 0.05
						},
						paint: {
							'text-color': '#ffffff',
							'text-halo-color': '#1e293b',
							'text-halo-width': 3,
							'text-opacity': 0.9
						}
					});

					map.on('mouseenter', 'campus-points', () => {
						map.getCanvas().style.cursor = 'pointer';
					});
					map.on('mouseleave', 'campus-points', () => {
						map.getCanvas().style.cursor = '';
					});
				});
		});

		map.addControl(new mapboxgl.NavigationControl());
		map.addControl(new mapboxgl.FullscreenControl());

		return () => {
			map.remove();
		};
	});
</script>

<svelte:head>
	<title>Корпуса и общежития ЯГТУ, Карта кампуса, Статистика, Расписание | ysturasp</title>
	<meta
		name="description"
		content="Корпуса и общежития ЯГТУ, Карта кампуса, Статистика, Расписание | ysturasp"
	/>
	<meta
		name="keywords"
		content="Корпуса ЯГТУ, Общежития ЯГТУ, Карта кампуса ЯГТУ, Статистика ЯГТУ, Расписание ЯГТУ, ysturasp, Ярославский технический университет, ЯГТУ расписание, ЯГТУ кампус, ЯГТУ общежития"
	/>
	<link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet" />
</svelte:head>

<PageLayout>
	<Header />
	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		<section class="mt-8 rounded-2xl bg-slate-800 p-4 md:p-6">
			<div class="mb-4 flex items-center">
				<h2 id="calendarIcon" class="-ml-2 text-4xl font-semibold text-white">📍</h2>
				<h2 class="text-2xl font-semibold text-white md:text-4xl">Карта кампуса ЯГТУ</h2>
			</div>
			<div class="w-full overflow-hidden rounded-2xl">
				<div class="map-container">
					<div bind:this={mapContainer} id="map"></div>
				</div>
			</div>
		</section>
		<IntelligentMapPromo />
	</main>
	<Footer />
</PageLayout>

<style>
	.map-container {
		width: 100%;
		height: 624px;
		border-radius: 10px;
		overflow: hidden;
	}

	#map {
		width: 100%;
		height: 100%;
	}

	:global(.mapboxgl-popup) {
		max-width: 200px;
	}

	:global(.mapboxgl-popup-content) {
		background: #1e293b;
		color: white;
		padding: 10px;
		border-radius: 18px;
	}
</style>
