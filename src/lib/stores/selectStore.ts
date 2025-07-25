import { writable } from 'svelte/store';

export const currentOpenSelect = writable<string | null>(null);