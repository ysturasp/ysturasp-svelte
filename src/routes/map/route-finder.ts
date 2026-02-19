import type { BuildingMap, Auditorium, Route, Point } from './types';
import { findAuditorium } from './data';

function getSection(buildingMap: BuildingMap, sectionId: number, floor: number) {
	return buildingMap.sections.find((s) => s.id === sectionId && s.floor === floor);
}

function getAuditoriumCenter(buildingMap: BuildingMap, aud: Auditorium): Point | null {
	const section = getSection(buildingMap, aud.section, aud.floor);
	if (!section) return null;
	return {
		x: section.position.x + aud.position.x + aud.width / 2,
		y: section.position.y + aud.position.y + aud.height / 2
	};
}

function getCorridorY(buildingMap: BuildingMap, sectionId: number, floor: number): number | null {
	const section = getSection(buildingMap, sectionId, floor);
	if (!section) return null;
	return section.position.y + section.height / 2;
}

function getStairsBlocksForFloor(buildingMap: BuildingMap, floor: number) {
	return (buildingMap.stairsBlocks || [])
		.filter((b) => b.floor === floor)
		.sort((a, b) => a.x - b.x);
}

function getBetweenSectionsBlock(
	buildingMap: BuildingMap,
	floor: number,
	between: '12' | '23'
): { x: number; y: number; width: number; height: number; floor: number } | null {
	const blocks = getStairsBlocksForFloor(buildingMap, floor);
	if (blocks.length < 2) return null;
	return between === '12' ? blocks[0] : blocks[1];
}

function blockCenter(block: { x: number; y: number; width: number; height: number }): Point {
	return { x: block.x + block.width / 2, y: block.y + block.height / 2 };
}

function buildSectionPath(fromSection: number, toSection: number): number[] {
	if (fromSection === toSection) return [fromSection];
	const step = fromSection < toSection ? 1 : -1;
	const path: number[] = [];
	for (let s = fromSection; s !== toSection + step; s += step) path.push(s);
	return path;
}

function pickVerticalBlockType(sectionId: number, targetSectionId: number): '12' | '23' {
	if (sectionId === 1) return '12';
	if (sectionId === 3) return '23';
	return targetSectionId <= 2 ? '12' : '23';
}

function pushPoint(points: Point[], p: Point) {
	const last = points[points.length - 1];
	if (!last || last.x !== p.x || last.y !== p.y) points.push(p);
}

function polylineDistance(points: Point[]): number {
	let d = 0;
	for (let i = 0; i < points.length - 1; i++) {
		const dx = points[i + 1].x - points[i].x;
		const dy = points[i + 1].y - points[i].y;
		d += Math.sqrt(dx * dx + dy * dy);
	}
	return d;
}

const FORBIDDEN_TRANSIT = { sectionId: 2, floor: 6 } as const;
type Between = '12' | '23';
type Side = 'left' | 'right';

function safeAdjacentFloor(floor: number): number {
	return floor > 1 ? floor - 1 : floor + 1;
}

function betweenForTransition(a: number, b: number): Between {
	return (a === 1 && b === 2) || (a === 2 && b === 1) ? '12' : '23';
}

function sideForSectionToBetween(sectionId: number, between: Between): Side {
	if (sectionId === 1) return 'right';
	if (sectionId === 3) return 'left';
	return between === '12' ? 'left' : 'right';
}

function portalPoint(
	buildingMap: BuildingMap,
	sectionId: number,
	floor: number,
	side: Side
): Point | null {
	const section = getSection(buildingMap, sectionId, floor);
	const corrY = getCorridorY(buildingMap, sectionId, floor);
	if (!section || corrY === null) return null;
	return {
		x: side === 'left' ? section.position.x : section.position.x + section.width,
		y: corrY
	};
}

function buildRoutePolyline(
	buildingMap: BuildingMap,
	from: Auditorium,
	to: Auditorium
): Point[] | null {
	const fromCenter = getAuditoriumCenter(buildingMap, from);
	const toCenter = getAuditoriumCenter(buildingMap, to);
	if (!fromCenter || !toCenter) return null;

	const points: Point[] = [];

	const fromCorrY = getCorridorY(buildingMap, from.section, from.floor);
	const toCorrY = getCorridorY(buildingMap, to.section, to.floor);
	if (fromCorrY === null || toCorrY === null) return null;

	pushPoint(points, fromCenter);
	pushPoint(points, { x: fromCenter.x, y: fromCorrY });

	if (from.floor === to.floor && from.section === to.section) {
		pushPoint(points, { x: toCenter.x, y: fromCorrY });
		pushPoint(points, toCenter);
		return points;
	}

	const sectionPath = buildSectionPath(from.section, to.section);
	const needFloorChange = from.floor !== to.floor;

	let travelFloor = needFloorChange ? to.floor : from.floor;
	if (
		travelFloor === FORBIDDEN_TRANSIT.floor &&
		sectionPath.includes(FORBIDDEN_TRANSIT.sectionId)
	) {
		travelFloor = safeAdjacentFloor(travelFloor);
	}

	if (sectionPath.length === 1) {
		const between: Between = from.section === 3 ? '23' : '12';
		const side: Side = sideForSectionToBetween(from.section, between);
		const pEdgeFrom = portalPoint(buildingMap, from.section, from.floor, side);
		const pEdgeTo = portalPoint(buildingMap, from.section, to.floor, side);
		const blockFrom = getBetweenSectionsBlock(buildingMap, from.floor, between);
		const blockTo = getBetweenSectionsBlock(buildingMap, to.floor, between);
		if (!pEdgeFrom || !pEdgeTo || !blockFrom || !blockTo) return null;

		const x = blockCenter(blockFrom).x;
		const yFrom = blockCenter(blockFrom).y;
		const yTo = blockCenter(blockTo).y;

		pushPoint(points, pEdgeFrom);
		pushPoint(points, { x, y: pEdgeFrom.y });
		pushPoint(points, { x, y: yFrom });
		pushPoint(points, { x, y: yTo });
		pushPoint(points, { x, y: pEdgeTo.y });
		pushPoint(points, pEdgeTo);
	} else {
		let currentFloor = from.floor;

		for (let i = 0; i < sectionPath.length - 1; i++) {
			const a = sectionPath[i];
			const b = sectionPath[i + 1];
			const between = betweenForTransition(a, b);
			const dirRight = a < b;

			let exitFloor = currentFloor;
			if (needFloorChange && i === 0) exitFloor = travelFloor;
			if (needFloorChange && b === to.section && travelFloor !== to.floor)
				exitFloor = to.floor;

			if (b === FORBIDDEN_TRANSIT.sectionId && exitFloor === FORBIDDEN_TRANSIT.floor) {
				exitFloor = safeAdjacentFloor(exitFloor);
			}

			const aSide: Side = dirRight ? 'right' : 'left';
			const bSide: Side = dirRight ? 'left' : 'right';
			const pA = portalPoint(buildingMap, a, currentFloor, aSide);
			if (!pA) return null;

			const blockAtEnter = getBetweenSectionsBlock(buildingMap, currentFloor, between);
			const blockAtExit = getBetweenSectionsBlock(buildingMap, exitFloor, between);
			if (!blockAtEnter || !blockAtExit) return null;

			const x = blockCenter(blockAtEnter).x;

			pushPoint(points, pA);
			pushPoint(points, { x, y: pA.y });

			if (exitFloor !== currentFloor) {
				const pBOnExitFloor = portalPoint(buildingMap, b, exitFloor, bSide);
				if (!pBOnExitFloor) return null;
				pushPoint(points, { x, y: pBOnExitFloor.y });
				currentFloor = exitFloor;
			}

			const pB = portalPoint(buildingMap, b, currentFloor, bSide);
			if (!pB) return null;
			if (pB.y !== points[points.length - 1].y) {
				pushPoint(points, { x, y: pB.y });
			}
			pushPoint(points, pB);
		}

		if (currentFloor !== to.floor) {
			const prev = sectionPath.length >= 2 ? sectionPath[sectionPath.length - 2] : to.section;
			const between = betweenForTransition(prev, to.section);
			const side: Side = prev < to.section ? 'left' : 'right';
			const pEdge = portalPoint(buildingMap, to.section, currentFloor, side);
			const pEdgeTo = portalPoint(buildingMap, to.section, to.floor, side);
			const blockFrom = getBetweenSectionsBlock(buildingMap, currentFloor, between);
			if (!pEdge || !pEdgeTo || !blockFrom) return null;
			const x = blockCenter(blockFrom).x;
			pushPoint(points, { x, y: pEdge.y });
			pushPoint(points, { x, y: pEdgeTo.y });
			pushPoint(points, pEdgeTo);
		}
	}

	const finalCorr = getCorridorY(buildingMap, to.section, to.floor);
	if (finalCorr === null) return null;
	pushPoint(points, { x: toCenter.x, y: finalCorr });
	pushPoint(points, toCenter);

	return points;
}

export function findRoute(buildingMap: BuildingMap, fromId: string, toId: string): Route | null {
	const from = findAuditorium(buildingMap, fromId);
	const to = findAuditorium(buildingMap, toId);

	if (!from || !to) return null;

	if (from.id === to.id) {
		const polyline = buildRoutePolyline(buildingMap, from, to) || undefined;
		return {
			path: [from],
			polyline,
			totalDistance: 0,
			instructions: ['Вы уже в этой аудитории']
		};
	}

	const polyline = buildRoutePolyline(buildingMap, from, to) || undefined;
	const prettyDistance = polyline
		? polylineDistance(polyline)
		: calculateDistance(buildingMap, from, to);

	const instructions: string[] = [];
	if (from.section === to.section && from.floor === to.floor) {
		instructions.push(`Выйдите из ${from.name} в коридор`);
		instructions.push(`Идите по коридору до ${to.name}`);
	} else {
		instructions.push(`Выйдите из ${from.name} в коридор`);
		if (from.section !== to.section) {
			instructions.push(`Дойдите до перехода в секцию ${to.section}`);
		}
		if (from.floor !== to.floor) {
			instructions.push(`Поднимитесь/спуститесь на этаж ${to.floor}`);
		}
		instructions.push(`Идите по коридору до ${to.name}`);
	}

	return {
		path: [from, to],
		polyline,
		totalDistance: prettyDistance,
		instructions
	};
}

function calculateDistance(buildingMap: BuildingMap, a: Auditorium, b: Auditorium): number {
	const sectionA = buildingMap.sections.find((s) => s.id === a.section && s.floor === a.floor);
	const sectionB = buildingMap.sections.find((s) => s.id === b.section && s.floor === b.floor);

	if (!sectionA || !sectionB) return 1000;

	const absXA = sectionA.position.x + a.position.x + a.width / 2;
	const absYA = sectionA.position.y + a.position.y + a.height / 2;
	const absXB = sectionB.position.x + b.position.x + b.width / 2;
	const absYB = sectionB.position.y + b.position.y + b.height / 2;

	return Math.sqrt(Math.pow(absXB - absXA, 2) + Math.pow(absYB - absYA, 2));
}
