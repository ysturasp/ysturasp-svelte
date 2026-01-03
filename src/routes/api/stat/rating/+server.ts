import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTopAntiTop } from '$lib/db/statGrades';
import type { InstituteId } from '../../../stat/types';

export const GET: RequestHandler = async ({ url }) => {
	const institute = url.searchParams.get('institute') as InstituteId | null;

	if (!institute) {
		return json({ error: 'Не указан институт' }, { status: 400 });
	}

	try {
		const data = await getTopAntiTop(institute);
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
