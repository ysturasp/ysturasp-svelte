import { sentrySvelteKit } from '@sentry/sveltekit';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');

	const getAllowedHosts = (): string[] => {
		const envHosts =
			env.VITE_ALLOWED_HOSTS ||
			env.ALLOWED_HOSTS ||
			process.env.VITE_ALLOWED_HOSTS ||
			process.env.ALLOWED_HOSTS;
		if (envHosts) {
			const hosts = envHosts.split(/[,\s]+/).filter((host) => host.trim().length > 0);
			return hosts;
		}
		const defaultHosts = ['ysturasp.ru'];
		return defaultHosts;
	};

	const allowedHosts = getAllowedHosts();

	return {
		plugins: [
			sentrySvelteKit({
				sourceMapsUploadOptions: {
					org: 'ysturasp',
					project: 'javascript-sveltekit'
				}
			}),
			tailwindcss(),
			sveltekit()
		],
		server: {
			allowedHosts
		}
	};
});
