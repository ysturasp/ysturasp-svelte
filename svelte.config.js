import adapterNetlify from '@sveltejs/adapter-netlify';
import adapterNode from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter:
			process.env.BUILD_ADAPTER === 'node'
				? adapterNode()
				: adapterNetlify({
						edge: false,
						split: false
					}),
		alias: {
			$lib: './src/lib'
		},
		serviceWorker: {
			register: true
		}
	},
	preprocess: vitePreprocess()
};

export default config;
