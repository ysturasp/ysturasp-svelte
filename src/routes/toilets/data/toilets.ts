import type { Toilet, Section, Gender } from '../types';

const toiletsData: Omit<Toilet, 'id'>[] = [
	{ floor: 1, section: 2, gender: 'male', location: 'около аудитории ???' },

	{ floor: 2, section: 2, gender: 'female', location: 'около аудитории ???' }, // ???

	{ floor: 3, section: 2, gender: 'female', location: 'около аудитории ???' }, // ???

	{ floor: 4, section: 2, gender: 'male', location: 'около аудитории ???' },

	{ floor: 5, section: 2, gender: 'female', location: 'около аудитории ???' }, // ???

	{ floor: 6, section: 2, gender: 'male', location: 'около аудитории ???' }, // ???

	{ floor: 7, section: 2, gender: 'female', location: 'около аудитории ???' },

	{ floor: 8, section: 2, gender: 'male', location: 'около аудитории ???' },

	{ floor: 9, section: 2, gender: 'female', location: 'около аудитории ???' } // ???
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
