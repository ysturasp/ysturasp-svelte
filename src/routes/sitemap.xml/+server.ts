import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = ({ url }) => {
	const origin = url.origin;

	const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${origin}/rasp</loc>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${origin}/raspaudience</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${origin}/raspprep</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${origin}/yspu/rasp</loc>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${origin}/yspu/raspaudience</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${origin}/yspu/raspprep</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${origin}/stat</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${origin}/campus</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${origin}/format</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${origin}/groups</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${origin}/about</loc>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${origin}/support</loc>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${origin}/legal</loc>
    <priority>0.5</priority>
  </url>
</urlset>`;

	return new Response(content, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
