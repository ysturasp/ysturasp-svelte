<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { afterNavigate } from '$app/navigation';

	export let id: number;

	function loadMetricaScript(): Promise<void> {
		return new Promise((resolve) => {
			const src = 'https://mc.yandex.ru/metrika/tag.js';
			if (document.querySelector(`script[src="${src}"]`)) {
				resolve();
				return;
			}
			const s = document.createElement('script');
			s.async = true;
			s.src = src;
			s.onload = () => resolve();
			document.head.appendChild(s);
		});
	}

	function initMetrica() {
		if (!(window as any).__ym_inited_ids__) (window as any).__ym_inited_ids__ = {};
		if ((window as any).__ym_inited_ids__[id]) return;
		try {
			(window as any).ym?.(id, 'init', {
				clickmap: true,
				trackLinks: true,
				accurateTrackBounce: true,
				webvisor: true
			});
			(window as any).__ym_inited_ids__[id] = true;
		} catch {}
	}

	function sendHit() {
		try {
			(window as any).ym?.(id, 'hit', window.location.href);
		} catch {}
	}

	onMount(() => {
		if (!browser) return;

		if (typeof (window as any).ym !== 'function') {
			const w = window as any;
			w.ym =
				w.ym ||
				function () {
					(w.ym.a = w.ym.a || []).push(arguments);
				};
			w.ym.l = Date.now();
		}

		(async () => {
			await loadMetricaScript();
			initMetrica();
			sendHit();
		})();

		afterNavigate(() => {
			sendHit();
		});
	});
</script>

<noscript>
	<div>
		<img
			src={'https://mc.yandex.ru/watch/' + id}
			style="position: absolute; left: -9999px"
			alt=""
		/>
	</div>
</noscript>
