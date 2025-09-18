import { build, files, version } from '$service-worker';

const self = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (globalThis.self));

const CACHE = `ysturasp-cache-${version}`;
const STATIC_CACHE = `ysturasp-static-${version}`;
const API_CACHE = `ysturasp-api-${version}`;

const ASSETS = [...build, ...files];

const CACHE_PAGES = [
	'/',
	'/rasp',
	'/raspprep',
	'/raspaudience',
	'/yspu/rasp',
	'/yspu/raspprep',
	'/yspu/raspaudience',
	'/about',
	'/campus',
	'/installapp',
	'/support'
];

const INTERNAL_API_PREFIXES = ['/api/vk'];

const EXTERNAL_API_HOSTS = ['api-ochre-eta-11.vercel.app'];

self.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const staticCache = await caches.open(STATIC_CACHE);
		await staticCache.addAll(ASSETS);

		const pageCache = await caches.open(CACHE);
		await pageCache.addAll(CACHE_PAGES);
	}

	event.waitUntil(addFilesToCache());
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		const cacheNames = await caches.keys();
		const deletePromises = cacheNames
			.filter((name) => name.startsWith('ysturasp-') && !name.includes(version))
			.map((name) => caches.delete(name));

		await Promise.all(deletePromises);
	}

	event.waitUntil(deleteOldCaches());
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);
		const staticCache = await caches.open(STATIC_CACHE);
		const apiCache = await caches.open(API_CACHE);

		if (ASSETS.includes(url.pathname)) {
			const response = await staticCache.match(url.pathname);
			if (response) {
				return response;
			}
		}

		const isApiRequest =
			url.pathname.startsWith('/api/') ||
			EXTERNAL_API_HOSTS.some((host) => url.hostname.includes(host));

		if (isApiRequest) {
			try {
				const response = await fetch(event.request);

				if (!(response instanceof Response)) {
					throw new Error('invalid response from fetch');
				}

				if (response.status === 200) {
					const shouldCacheInternal = INTERNAL_API_PREFIXES.some((prefix) =>
						url.pathname.startsWith(prefix)
					);
					const shouldCacheExternal = EXTERNAL_API_HOSTS.some((host) =>
						url.hostname.includes(host)
					);

					if (shouldCacheInternal || shouldCacheExternal) {
						apiCache.put(event.request, response.clone());
					}
				}

				return response;
			} catch (err) {
				const cachedResponse = await apiCache.match(event.request);
				if (cachedResponse) {
					const headers = new Headers(cachedResponse.headers);
					headers.set('X-Served-From-Cache', 'true');
					headers.set('X-Cache-Timestamp', new Date().toISOString());

					return new Response(cachedResponse.body, {
						status: cachedResponse.status,
						statusText: cachedResponse.statusText,
						headers
					});
				}
				throw err;
			}
		}

		try {
			const response = await fetch(event.request);

			if (!(response instanceof Response)) {
				throw new Error('invalid response from fetch');
			}

			if (response.status === 200 && url.pathname !== '/') {
				cache.put(event.request, response.clone());
			}

			return response;
		} catch (err) {
			const cachedResponse = await cache.match(event.request);
			if (cachedResponse) {
				return cachedResponse;
			}

			if (url.pathname !== '/' && CACHE_PAGES.includes(url.pathname)) {
				const offlineResponse = await cache.match('/');
				if (offlineResponse) {
					return offlineResponse;
				}
			}

			throw err;
		}
	}

	event.respondWith(respond());
});

self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}

	if (event.data && event.data.type === 'GET_VERSION') {
		event.ports[0].postMessage({ version });
	}
});
