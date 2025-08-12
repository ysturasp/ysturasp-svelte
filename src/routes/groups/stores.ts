import { writable } from 'svelte/store';

export const authToken = writable<string | null>(null);
export const refreshToken = writable<string | null>(null);

export interface Group {
	id: string;
	institute: string;
	name: string;
	link: string;
	verified: boolean;
	date: string;
	token?: string;
}

export const groups = writable<Group[]>([]);
