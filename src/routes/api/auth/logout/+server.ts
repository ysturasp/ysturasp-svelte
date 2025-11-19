import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete('session_token', { path: '/' });
	cookies.delete('user_id', { path: '/' });
	return json({ success: true });
};
