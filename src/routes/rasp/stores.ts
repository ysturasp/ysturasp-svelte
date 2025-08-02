import { writable } from 'svelte/store';
import type { YSTULesson } from './types';

interface HiddenSubject {
	lessonName: string;
	type: number;
	teacher: string;
}

export const hiddenSubjects = writable<Record<string, HiddenSubject[]>>({});

export function toggleSubjectVisibility(group: string, subject: HiddenSubject) {
	hiddenSubjects.update((subjects) => {
		const groupSubjects = subjects[group] || [];
		const existingIndex = groupSubjects.findIndex(
			(s) =>
				s.lessonName === subject.lessonName &&
				s.type === subject.type &&
				s.teacher === subject.teacher
		);

		if (existingIndex >= 0) {
			groupSubjects.splice(existingIndex, 1);
		} else {
			if (!subjects[group]) subjects[group] = [];
			subjects[group].push(subject);
		}

		localStorage.setItem(`hiddenSubjects_${group}`, JSON.stringify(subjects[group]));
		return { ...subjects };
	});
}

export function restoreAllSubjects(group: string) {
	hiddenSubjects.update((subjects) => {
		subjects[group] = [];
		localStorage.setItem(`hiddenSubjects_${group}`, '[]');
		return { ...subjects };
	});
}
