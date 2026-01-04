import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTopAntiTop } from '$lib/db/statGrades';
import type { InstituteId } from '../../../stat/types';

export const GET: RequestHandler = async ({ url }) => {
	const institute = url.searchParams.get('institute') as InstituteId | null;
	const courseParam = url.searchParams.get('course');
	const minGradesParam = url.searchParams.get('minGrades');

	if (!institute) {
		return json({ error: 'Не указан институт' }, { status: 400 });
	}

	const filters = {
		course: courseParam ? parseInt(courseParam, 10) : undefined,
		minGrades: minGradesParam ? parseInt(minGradesParam, 10) : undefined
	};

	try {
		const data = await getTopAntiTop(institute, filters);
		return json(data);
	} catch (error) {
		console.error('Ошибка при получении топ-10 и антитоп-10:', error);
		return json(
			{
				error: 'Ошибка при получении данных',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
