import type { Toilet, ToiletSearchResult, Section, Gender } from './types';
import { getAllToilets, getToiletsByFloorAndSection } from './data/toilets';

function getSectionByAudienceNumber(audienceNumber: number, floor: number): Section | null {
	const maxAudienceNumber = getMaxAudienceNumberForFloor(floor);
	if (maxAudienceNumber === null) {
		return null;
	}

	const third = Math.ceil(maxAudienceNumber / 3);

	if (audienceNumber <= third) {
		return 1;
	} else if (audienceNumber <= third * 2) {
		return 2;
	} else {
		return 3;
	}
}

function getMaxAudienceNumberForFloor(floor: number): number | null {
	const maxNumbers: Record<number, number> = {
		1: 22,
		2: 28,
		3: 37,
		4: 30,
		5: 19,
		6: 33,
		7: 35,
		8: 26,
		9: 25
	};
	return maxNumbers[floor] ?? null;
}

export function parseAudience(audience: string): {
	floor: number | null;
	section: Section | null;
	audienceNumber: number | null;
	error: 'format' | 'out_of_range' | null;
} {
	const cleaned = audience.trim().toUpperCase().replace(/Г-?/g, '');
	if (cleaned.length === 0 || cleaned.length > 8) {
		return { floor: null, section: null, audienceNumber: null, error: 'format' };
	}

	const parts = cleaned.split('-');

	if (parts.length === 2) {
		const section = parseInt(parts[0], 10);
		const audienceNum = parseInt(parts[1], 10);

		if (
			!isNaN(section) &&
			section >= 1 &&
			section <= 3 &&
			!isNaN(audienceNum) &&
			audienceNum > 0 &&
			audienceNum <= 9999
		) {
			const floor = Math.floor(audienceNum / 100);
			const onFloor = audienceNum % 100;
			if (onFloor <= 0) {
				return { floor: null, section: null, audienceNumber: null, error: 'format' };
			}
			const max = getMaxAudienceNumberForFloor(floor);
			if (max !== null && onFloor > max) {
				return { floor: null, section: null, audienceNumber: null, error: 'out_of_range' };
			}
			return {
				floor: floor >= 1 && floor <= 9 ? floor : null,
				section: section as Section,
				audienceNumber: audienceNum,
				error: floor >= 1 && floor <= 9 ? null : 'out_of_range'
			};
		}
	} else if (parts.length === 1) {
		const audienceNum = parseInt(parts[0], 10);
		if (!isNaN(audienceNum) && audienceNum > 0 && audienceNum <= 9999) {
			const floor = Math.floor(audienceNum / 100);
			const audienceNumberOnFloor = audienceNum % 100;

			if (floor >= 1 && floor <= 9 && audienceNumberOnFloor > 0) {
				const max = getMaxAudienceNumberForFloor(floor);
				if (max !== null && audienceNumberOnFloor > max) {
					return {
						floor: null,
						section: null,
						audienceNumber: null,
						error: 'out_of_range'
					};
				}
				const section = getSectionByAudienceNumber(audienceNumberOnFloor, floor);
				return {
					floor,
					section,
					audienceNumber: audienceNum,
					error: section ? null : 'format'
				};
			}
		}
	}

	return { floor: null, section: null, audienceNumber: null, error: 'format' };
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

function describeLocation(toiletSection: Section, userSection: Section): string {
	if (toiletSection === 3) {
		return 'в начале секции';
	}
	if (toiletSection === 2) {
		if (userSection === 1) {
			return 'в начале секции';
		}
		if (userSection === 3) {
			return 'в конце секции';
		}
		return 'в начале секции';
	}
	return 'в начале секции';
}

function withLocation(toilet: Toilet, userSection: Section): Toilet {
	return { ...toilet, location: describeLocation(toilet.section, userSection) };
}

export function findNearestToilet(audience: string, gender: Gender): ToiletSearchResult {
	const parsed = parseAudience(audience);

	if (!parsed.floor || !parsed.section) {
		if (parsed.error === 'format') {
			return {
				toilet: null,
				distance: Infinity,
				message: 'Аудитория введена некорректно. Введите, например, "Г-205" или "205".',
				userFloor: undefined,
				error: 'format'
			};
		}
		if (parsed.error === 'out_of_range') {
			return {
				toilet: null,
				distance: Infinity,
				message: 'Такой аудитории не существует на этажах 1-9.',
				userFloor: undefined,
				error: 'out_of_range'
			};
		}
		return {
			toilet: null,
			distance: Infinity,
			message:
				'Не удалось определить этаж и секцию из номера аудитории. Пожалуйста, введите номер в формате "Г-205" или "205"',
			userFloor: undefined,
			error: 'format'
		};
	}

	const { floor, section } = parsed;

	let toilets = getToiletsByFloorAndSection(floor, section).filter((t) => t.gender === gender);

	if (toilets.length > 0) {
		const toilet = withLocation(toilets[0], section);
		return {
			toilet,
			distance: 0,
			message: `на вашем этаже, ${toilet.location}`,
			userFloor: floor
		};
	}

	toilets = getAllToilets()
		.filter((t) => t.floor === floor && t.gender === gender)
		.sort((a, b) => Math.abs(a.section - section) - Math.abs(b.section - section));

	if (toilets.length > 0) {
		const nearest = withLocation(toilets[0], section);
		const distance = Math.abs(nearest.section - section);
		return {
			toilet: nearest,
			distance: distance * 0.5,
			message: `на вашем этаже в ${nearest.section} секции, ${nearest.location}`,
			alternativeToilets: toilets.slice(1, 3).map((t) => withLocation(t, section)),
			userFloor: floor
		};
	}

	const allToilets = getAllToilets()
		.filter((t) => t.gender === gender)
		.map((t) => ({
			toilet: withLocation(t, section),
			distance: calculateDistance(floor, section, t.floor, t.section)
		}))
		.sort((a, b) => a.distance - b.distance);

	if (allToilets.length > 0) {
		const nearest = allToilets[0];
		const floorDiff = Math.abs(nearest.toilet.floor - floor);
		const sectionDiff = Math.abs(nearest.toilet.section - section);

		let message = '';
		if (floorDiff === 0) {
			message = `на вашем этаже в ${nearest.toilet.section} секции, ${nearest.toilet.location}`;
		} else if (sectionDiff === 0) {
			message = `на ${nearest.toilet.floor} этаже в вашей секции, ${nearest.toilet.location}`;
		} else {
			message = `на ${nearest.toilet.floor} этаже в ${nearest.toilet.section} секции, ${nearest.toilet.location}`;
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
