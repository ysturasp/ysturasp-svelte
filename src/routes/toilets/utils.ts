import type { Toilet, ToiletSearchResult, Section, Gender } from './types';
import { getAllToilets, getToiletsByFloorAndSection } from './data/toilets';

export function parseAudience(audience: string): {
	floor: number | null;
	section: Section | null;
	audienceNumber: number | null;
} {
	const cleaned = audience.trim().toUpperCase().replace(/Г-?/g, '');

	const parts = cleaned.split('-');

	if (parts.length === 2) {
		const section = parseInt(parts[0], 10);
		const audienceNum = parseInt(parts[1], 10);

		if (!isNaN(section) && section >= 1 && section <= 3) {
			const floor = Math.floor(audienceNum / 100);
			return {
				floor: floor >= 1 && floor <= 9 ? floor : null,
				section: section as Section,
				audienceNumber: audienceNum
			};
		}
	} else if (parts.length === 1) {
		const audienceNum = parseInt(parts[0], 10);
		if (!isNaN(audienceNum)) {
			const floor = Math.floor(audienceNum / 100);
			const lastTwoDigits = audienceNum % 100;
			let section: Section | null = null;

			if (lastTwoDigits >= 1 && lastTwoDigits <= 19) {
				section = 1;
			} else if (lastTwoDigits >= 20 && lastTwoDigits <= 39) {
				section = 2;
			} else if (lastTwoDigits >= 40 && lastTwoDigits <= 59) {
				section = 3;
			} else if (lastTwoDigits >= 60 && lastTwoDigits <= 99) {
				section = 3;
			}

			return {
				floor: floor >= 1 && floor <= 9 ? floor : null,
				section,
				audienceNumber: audienceNum
			};
		}
	}

	return { floor: null, section: null, audienceNumber: null };
}

function calculateDistance(
	floor1: number,
	section1: Section,
	floor2: number,
	section2: Section
): number {
	const floorDistance = Math.abs(floor1 - floor2);
	const sectionDistance = Math.abs(section1 - section2) * 0.5;
	return floorDistance + sectionDistance;
}

export function findNearestToilet(audience: string, gender: Gender): ToiletSearchResult {
	const parsed = parseAudience(audience);

	if (!parsed.floor || !parsed.section) {
		return {
			toilet: null,
			distance: Infinity,
			message:
				'Не удалось определить этаж и секцию из номера аудитории. Пожалуйста, введите номер в формате "Г-205" или "205"',
			userFloor: undefined
		};
	}

	const { floor, section } = parsed;

	let toilets = getToiletsByFloorAndSection(floor, section).filter((t) => t.gender === gender);

	if (toilets.length > 0) {
		return {
			toilet: toilets[0],
			distance: 0,
			message: `Туалет найден на вашем этаже, ${toilets[0].location}`,
			userFloor: floor
		};
	}

	toilets = getAllToilets()
		.filter((t) => t.floor === floor && t.gender === gender)
		.sort((a, b) => Math.abs(a.section - section) - Math.abs(b.section - section));

	if (toilets.length > 0) {
		const nearest = toilets[0];
		const distance = Math.abs(nearest.section - section);
		return {
			toilet: nearest,
			distance: distance * 0.5,
			message: `Ближайший туалет на вашем этаже в ${nearest.section} секции, ${nearest.location}`,
			alternativeToilets: toilets.slice(1, 3),
			userFloor: floor
		};
	}

	const allToilets = getAllToilets()
		.filter((t) => t.gender === gender)
		.map((t) => ({
			toilet: t,
			distance: calculateDistance(floor, section, t.floor, t.section)
		}))
		.sort((a, b) => a.distance - b.distance);

	if (allToilets.length > 0) {
		const nearest = allToilets[0];
		const floorDiff = Math.abs(nearest.toilet.floor - floor);
		const sectionDiff = Math.abs(nearest.toilet.section - section);

		let message = '';
		if (floorDiff === 0) {
			message = `Ближайший туалет на вашем этаже в ${nearest.toilet.section} секции, ${nearest.toilet.location}`;
		} else if (sectionDiff === 0) {
			message = `Ближайший туалет на ${nearest.toilet.floor} этаже в вашей секции, ${nearest.toilet.location}`;
		} else {
			message = `Ближайший туалет на ${nearest.toilet.floor} этаже в ${nearest.toilet.section} секции, ${nearest.toilet.location}`;
		}

		return {
			toilet: nearest.toilet,
			distance: nearest.distance,
			message,
			alternativeToilets: allToilets.slice(1, 3).map((t) => t.toilet),
			userFloor: floor
		};
	}

	return {
		toilet: null,
		distance: Infinity,
		message: 'К сожалению, туалет для выбранного пола не найден',
		userFloor: parsed.floor || undefined
	};
}
