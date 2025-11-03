import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = ({ url }) => {
	const origin = url.origin;

	const content = `# channels of communication in descending order of preference
contact: ${origin}/support
contact: https://t.me/ysturasp_bot

# security policy
policy: https://github.com/ysturasp/ysturasp-svelte/blob/main/SECURITY.md

# acknowledgments to researchers
acknowledgments: https://github.com/ysturasp/ysturasp-svelte/blob/main/SECURITY.md#hall-of-fame

preferred-languages: ru, en
expires: 2026-01-01T12:00:00Z`;

	return new Response(content, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'public, max-age=86400'
		}
	});
};

