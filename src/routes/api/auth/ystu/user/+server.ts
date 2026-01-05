import { json, type RequestHandler } from '@sveltejs/kit';
import { getDetailedUserInfo } from '$lib/api/ystu';
import { getAcademicTokens } from '$lib/server/academicSession';

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		const { accessToken } = getAcademicTokens(cookies);
		if (!accessToken) {
			return json({ error: 'Сессия ЯГТУ не найдена' }, { status: 401 });
		}

		const userData = await getDetailedUserInfo(accessToken);
		return json(userData);
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};
