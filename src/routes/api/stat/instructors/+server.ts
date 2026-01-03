import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getInstructors } from '$lib/db/statGrades';
import type { InstituteId } from '../../../stat/types';

export const GET: RequestHandler = async ({ url }) => {
	const institute = url.searchParams.get('institute') as InstituteId | null;
	const subject = url.searchParams.get('subject');

	if (!institute || !subject) {
		return json({ error: 'Не указаны институт или предмет' }, { status: 400 });
	}

	try {
		const instructors = await getInstructors(institute, subject);
		return json(instructors);
	} catch (error) {
		console.error('Ошибка при получении преподавателей:', error);
		return json(
			{
				error: 'Ошибка при получении преподавателей',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
