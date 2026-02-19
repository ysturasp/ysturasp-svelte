import type { BuildingMap, Auditorium, Section, Connection, Point } from './types';

function createSection(
	id: number,
	floor: number,
	x: number,
	y: number,
	width: number,
	height: number,
	auditoriums: Omit<Auditorium, 'floor' | 'section'>[]
): Section {
	return {
		id,
		floor,
		position: { x, y },
		width,
		height,
		auditoriums: auditoriums.map((aud) => ({
			...aud,
			floor,
			section: id
		})),
		connections: []
	};
}

export function createBuildingMap(): BuildingMap {
	const sections: Section[] = [];
	const connections: Connection[] = [];

	const SECTION_WIDTH = 280;
	const SECTION_HEIGHT = 120;
	const SECTION_SPACING = 50;
	const STAIRS_WIDTH = 30;
	const FLOOR_SPACING = 20;
	const SECTION_STEP = 15;

	const ROOMS_PER_ROW = 7;
	const SECTION_PADDING_X = 12;
	const SECTION_PADDING_Y = 12;
	const ROOM_GAP_X = 8;
	const CORRIDOR_HEIGHT = 18;
	const CORRIDOR_GAP_Y = 8;

	function createAuditoriumsForSection(
		sectionId: number,
		floor: number,
		sectionX: number,
		sectionY: number
	): Omit<Auditorium, 'floor' | 'section'>[] {
		const auditoriums: Omit<Auditorium, 'floor' | 'section'>[] = [];

		const availableWidth = SECTION_WIDTH - SECTION_PADDING_X * 2;
		const roomWidth = (availableWidth - ROOM_GAP_X * (ROOMS_PER_ROW - 1)) / ROOMS_PER_ROW;

		const availableHeight =
			SECTION_HEIGHT - SECTION_PADDING_Y * 2 - CORRIDOR_HEIGHT - CORRIDOR_GAP_Y * 2;
		const roomHeight = availableHeight / 2;

		const startX = SECTION_PADDING_X;
		const topStartY = SECTION_PADDING_Y;
		const bottomStartY =
			SECTION_PADDING_Y + roomHeight + CORRIDOR_GAP_Y + CORRIDOR_HEIGHT + CORRIDOR_GAP_Y;

		const sectionOffset = (sectionId - 1) * 14;

		for (let i = 0; i < ROOMS_PER_ROW; i++) {
			const x = startX + i * (roomWidth + ROOM_GAP_X);
			const y = topStartY;
			const inSectionNumber = sectionOffset + (i + 1);
			const roomNumber = floor * 100 + inSectionNumber;
			auditoriums.push({
				id: `${roomNumber}`,
				name: `${roomNumber}`,
				position: { x, y },
				width: roomWidth,
				height: roomHeight,
				capacity: 20 + Math.floor(Math.random() * 15)
			});
		}

		for (let i = 0; i < ROOMS_PER_ROW; i++) {
			const x = startX + i * (roomWidth + ROOM_GAP_X);
			const y = bottomStartY;
			const inSectionNumber = sectionOffset + (ROOMS_PER_ROW + i + 1);
			const roomNumber = floor * 100 + inSectionNumber;
			auditoriums.push({
				id: `${roomNumber}`,
				name: `${roomNumber}`,
				position: { x, y },
				width: roomWidth,
				height: roomHeight,
				capacity: 20 + Math.floor(Math.random() * 15)
			});
		}

		return auditoriums;
	}

	const TOTAL_FLOORS = 9;
	for (let floor = 1; floor <= TOTAL_FLOORS; floor++) {
		for (let sectionId = 1; sectionId <= 3; sectionId++) {
			const sectionX = (sectionId - 1) * (SECTION_WIDTH + SECTION_SPACING);
			const sectionY =
				(TOTAL_FLOORS - floor) * (SECTION_HEIGHT + FLOOR_SPACING) +
				(sectionId - 1) * SECTION_STEP;

			const auditoriums =
				floor === 6 && sectionId === 2
					? []
					: createAuditoriumsForSection(sectionId, floor, sectionX, sectionY);

			const section = createSection(
				sectionId,
				floor,
				sectionX,
				sectionY,
				SECTION_WIDTH,
				SECTION_HEIGHT,
				auditoriums
			);

			sections.push(section);
		}
	}

	const stairsBlocks: Array<{
		x: number;
		y: number;
		width: number;
		height: number;
		floor: number;
	}> = [];
	for (let floor = 1; floor <= TOTAL_FLOORS; floor++) {
		const stairsX1 = SECTION_WIDTH + (SECTION_SPACING - STAIRS_WIDTH) / 2;
		const stairsY1 =
			(TOTAL_FLOORS - floor) * (SECTION_HEIGHT + FLOOR_SPACING) + SECTION_STEP / 2;
		stairsBlocks.push({
			x: stairsX1,
			y: stairsY1,
			width: STAIRS_WIDTH,
			height: SECTION_HEIGHT + SECTION_STEP,
			floor
		});

		const stairsX2 = SECTION_WIDTH * 2 + SECTION_SPACING + (SECTION_SPACING - STAIRS_WIDTH) / 2;
		const stairsY2 = (TOTAL_FLOORS - floor) * (SECTION_HEIGHT + FLOOR_SPACING) + SECTION_STEP;
		stairsBlocks.push({
			x: stairsX2,
			y: stairsY2,
			width: STAIRS_WIDTH,
			height: SECTION_HEIGHT + SECTION_STEP,
			floor
		});
	}

	for (let floor = 1; floor <= TOTAL_FLOORS; floor++) {
		const stairs1 = stairsBlocks.find((s) => s.floor === floor && s.x < SECTION_WIDTH * 2);
		if (stairs1) {
			connections.push({
				from: `section-1-${floor}`,
				to: `section-2-${floor}`,
				type: 'stairs',
				points: [
					{ x: SECTION_WIDTH, y: SECTION_HEIGHT / 2 },
					{ x: stairs1.x + STAIRS_WIDTH / 2, y: stairs1.y + stairs1.height / 2 },
					{ x: SECTION_WIDTH + SECTION_SPACING, y: SECTION_HEIGHT / 2 + SECTION_STEP }
				]
			});
		}

		const stairs2 = stairsBlocks.find((s) => s.floor === floor && s.x > SECTION_WIDTH * 2);
		if (stairs2) {
			connections.push({
				from: `section-2-${floor}`,
				to: `section-3-${floor}`,
				type: 'stairs',
				points: [
					{
						x: SECTION_WIDTH * 2 + SECTION_SPACING,
						y: SECTION_HEIGHT / 2 + SECTION_STEP
					},
					{ x: stairs2.x + STAIRS_WIDTH / 2, y: stairs2.y + stairs2.height / 2 },
					{
						x: SECTION_WIDTH * 2 + SECTION_SPACING * 2,
						y: SECTION_HEIGHT / 2 + SECTION_STEP * 2
					}
				]
			});
		}
	}

	for (let sectionId = 1; sectionId <= 3; sectionId++) {
		for (let floor = 1; floor <= TOTAL_FLOORS - 1; floor++) {
			const sectionX = (sectionId - 1) * (SECTION_WIDTH + SECTION_SPACING);
			const currentFloorY = (TOTAL_FLOORS - floor) * (SECTION_HEIGHT + FLOOR_SPACING);
			const nextFloorY = (TOTAL_FLOORS - (floor + 1)) * (SECTION_HEIGHT + FLOOR_SPACING);

			connections.push({
				from: `section-${sectionId}-${floor}`,
				to: `section-${sectionId}-${floor + 1}`,
				type: 'stairs',
				points: [
					{ x: SECTION_WIDTH - 30, y: SECTION_HEIGHT },
					{ x: SECTION_WIDTH - 30, y: SECTION_HEIGHT + FLOOR_SPACING }
				].map((p) => ({
					x: p.x + sectionX,
					y: p.y + currentFloorY
				}))
			});
		}
	}

	return {
		sections,
		connections,
		stairsBlocks
	};
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
