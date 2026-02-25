import type { Auditorium, BuildingMap } from './types';

export async function fetchBuildingMap(): Promise<BuildingMap> {
	const response = await fetch('/api/map');
	if (!response.ok) {
		throw new Error('Failed to fetch building map');
	}
	const map: BuildingMap = await response.json();

	map.sections.forEach((section) => {
		section.auditoriums.forEach((aud) => {
			aud.floor = section.floor;
			aud.section = section.id;
		});
	});

	return map;
}

export function getAllAuditoriums(buildingMap: BuildingMap): Auditorium[] {
	return buildingMap.sections.flatMap((section) => section.auditoriums);
}

export function findAuditorium(buildingMap: BuildingMap, id: string): Auditorium | undefined {
	for (const section of buildingMap.sections) {
		const aud = section.auditoriums.find((a) => a.id === id);
		if (aud) return aud;
	}
	return undefined;
}
