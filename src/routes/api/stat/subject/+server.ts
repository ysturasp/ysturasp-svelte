import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSubjectStats } from '$lib/db/statGrades';
import type { InstituteId } from '../../../stat/types';

export const GET: RequestHandler = async ({ url }) => {
	const institute = url.searchParams.get('institute') as InstituteId | null;
	const discipline = url.searchParams.get('discipline');

	if (!institute || !discipline) {
		return json({ error: 'Не указаны институт или дисциплина' }, { status: 400 });
	}

	try {
		const stats = await getSubjectStats(institute, discipline);
		return json(stats);
	} catch (error) {
		console.error('Ошибка при получении статистики по предмету:', error);
		return json(
			{
				error: 'Ошибка при получении статистики',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
