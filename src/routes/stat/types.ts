export interface Stats {
	average: number;
	count5: number;
	count4: number;
	count3: number;
	count2: number;
}

export interface SubjectStats {
	position: number;
	subject: string;
	average: number;
	count: number;
}

export interface RecentlyViewedItem {
	discipline: string;
	institute: InstituteId;
	stats: Stats;
}

export interface Instructors {
	teachers: string[];
}

export type InstituteId =
	| 'btn-digital-systems'
	| 'btn-architecture-design'
	| 'btn-civil-transport'
	| 'btn-chemistry'
	| 'btn-economics-management'
	| 'btn-engineering-machinery';

export type InstituteUrls = Record<InstituteId, string>;

export interface NotificationOptions {
	message: string;
	type: 'success' | 'error' | 'warning';
}

export interface ReferralStats {
	referralCount: number;
	statsLimit: number;
}
