import { json } from '@sveltejs/kit';

export async function GET() {
	try {
		const response = await fetch(
			'https://wakatime.com/api/v1/users/2b3e5e01-02f2-42cd-a398-4320e5ee2982/stats/all_time?timeout=15'
		);
		const data = await response.json();
		return json(data);
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Ошибка при получении данных Wakatime' }), {
			status: 500
		});
	}
}
