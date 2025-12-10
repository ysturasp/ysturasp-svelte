import type { Toilet, Section, Gender } from '../types';

const toiletsData: Omit<Toilet, 'id'>[] = [
	{ floor: 1, section: 2, gender: 'male', location: 'в начале секции' },

	{ floor: 2, section: 2, gender: 'female', location: 'в начале секции' },
	{ floor: 2, section: 3, gender: 'female', location: 'в начале секции' },

	{ floor: 3, section: 2, gender: 'female', location: 'в начале секции' },
	{ floor: 3, section: 3, gender: 'male', location: 'в начале секции' },

	{ floor: 4, section: 2, gender: 'male', location: 'в начале секции' },
	{ floor: 4, section: 3, gender: 'female', location: 'в начале секции' },

	{ floor: 5, section: 2, gender: 'female', location: 'в начале секции' },
	// секция заперта
	// { floor: 5, section: 3, gender: 'male', location: 'около аудитории ???' },

	// секция закрыта (IT отдел)
	// { floor: 6, section: 2, gender: 'male', location: 'около аудитории ???' },
	{ floor: 6, section: 3, gender: 'female', location: 'в начале секции' },

	{ floor: 7, section: 2, gender: 'female', location: 'в начале секции' },
	{ floor: 7, section: 3, gender: 'female', location: 'в начале секции' },

	{ floor: 8, section: 2, gender: 'male', location: 'в начале секции' },
	{ floor: 8, section: 3, gender: 'male', location: 'в начале секции' },

	{ floor: 9, section: 2, gender: 'male', location: 'в начале секции' },
	{ floor: 9, section: 3, gender: 'male', location: 'в начале секции' }
];

export function getAllToilets(): Toilet[] {
	return toiletsData.map((toilet, index) => ({
		...toilet,
		id: `toilet-${toilet.floor}-${toilet.section}-${toilet.gender}-${index}`
	}));
}

export function getToiletsByFloor(floor: number): Toilet[] {
	return getAllToilets().filter((toilet) => toilet.floor === floor);
}

export function getToiletsBySection(section: Section): Toilet[] {
	return getAllToilets().filter((toilet) => toilet.section === section);
}

export function getToiletsByFloorAndSection(floor: number, section: Section): Toilet[] {
	return getAllToilets().filter((toilet) => toilet.floor === floor && toilet.section === section);
}

export function getToiletsByGender(gender: Gender): Toilet[] {
	return getAllToilets().filter((toilet) => toilet.gender === gender);
}
