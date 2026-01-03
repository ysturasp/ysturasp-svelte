import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDisciplines } from '$lib/db/statGrades';
import type { InstituteId } from '../../../stat/types';

export const GET: RequestHandler = async ({ url }) => {
	const institute = url.searchParams.get('institute') as InstituteId | null;

	if (!institute) {
		return json({ error: 'Не указан институт' }, { status: 400 });
	}

	try {
		const disciplines = await getDisciplines(institute);
		return json(disciplines);
	} catch (error) {
		console.error('Ошибка при получении списка дисциплин:', error);
		return json(
			{
				error: 'Ошибка при получении списка дисциплин',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
