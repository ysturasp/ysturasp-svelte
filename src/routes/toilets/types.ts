export type Gender = 'male' | 'female';

export type Section = 1 | 2 | 3;

export interface Toilet {
	id: string;
	floor: number;
	section: Section;
	gender: Gender;
	location: string;
}

export interface ToiletSearchParams {
	audience: string;
	gender: Gender;
}

export interface ToiletSearchResult {
	toilet: Toilet | null;
	distance: number;
	message: string;
	alternativeToilets?: Toilet[];
	userFloor?: number;
}
