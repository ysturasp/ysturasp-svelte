import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = ({ url }) => {
	const origin = url.origin;

	const content = `User-agent: *
Host: ${url.host}
Sitemap: ${origin}/sitemap.xml
Clean-param: week&semester /rasp
Clean-param: week&semester /raspprep
Clean-param: week&semester /raspaudience
Clean-param: week&semester /yspu/rasp
Clean-param: week&semester /yspu/raspprep
Clean-param: week&semester /yspu/raspaudience`;

	return new Response(content, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
