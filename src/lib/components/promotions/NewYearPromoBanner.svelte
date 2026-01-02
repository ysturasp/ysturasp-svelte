<script lang="ts">
	import { getCurrentPromotion, formatPromotionEndDate } from '$lib/utils/promotions';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import BottomModal from '$lib/components/ui/BottomModal.svelte';
	import { browser } from '$app/environment';
	import TgsSticker from '$lib/components/common/TgsSticker.svelte';
	import { auth } from '$lib/stores/auth';

	const promotion = getCurrentPromotion();
	let isOpen = $state(false);
	let timer: ReturnType<typeof setTimeout> | null = null;

	const shouldShow = $derived(
		promotion !== null && promotion.isActive && !$auth.hasPaidService && !$auth.loading
	);

	onMount(() => {
		if (browser) {
			if ($auth.loading) {
				auth.checkAuth();
			}
		}
	});

	$effect(() => {
		if (browser && typeof window !== 'undefined' && shouldShow) {
			if (timer) {
				clearTimeout(timer);
			}

			timer = setTimeout(() => {
				isOpen = true;
			}, 1000);

			return () => {
				if (timer) {
					clearTimeout(timer);
					timer = null;
				}
			};
		} else {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
			isOpen = false;
		}
	});

	function handleClose() {
		isOpen = false;
	}

	function goToFormat() {
		handleClose();
		goto('/format');
	}
</script>

{#if shouldShow && promotion}
	<BottomModal
		{isOpen}
		title=""
		subtitle=""
		subtitleClass=""
		onClose={handleClose}
		contentClass="overflow-y-auto px-4"
		showCloseButton={true}
	>
		<div class="space-y-5">
			<div class="text-center">
				<div class="mb-3 flex items-center justify-center">
					<TgsSticker
						src="/stickers/christmas_tree.tgs"
						width="120px"
						height="120px"
						autoplay={true}
						once={false}
						quality={3}
					/>
				</div>
				<h2 class="mb-3 text-2xl font-semibold text-white md:text-3xl">
					{promotion.name}
				</h2>
				<div class="mb-4 flex items-center justify-center gap-3">
					<span
						class="rounded-full bg-yellow-500/30 px-4 py-2 text-base font-bold text-yellow-200"
					>
						Скидка {promotion.discountPercent}%
					</span>
					<span class="text-sm text-slate-400">
						до {formatPromotionEndDate(promotion)}
					</span>
				</div>
			</div>

			<div class="rounded-xl border border-yellow-500/30 bg-yellow-500/20 p-4">
				<p class="text-center text-base text-yellow-100/90 md:text-lg">
					{promotion.description}
				</p>

				<h2 class="mb-4 text-center text-xs text-yellow-400/80 md:text-lg">
					а протестировать можно бесплатно прямо сейчас
				</h2>

				<div class="space-y-2.5 text-sm text-yellow-200/80">
					<div class="flex items-center gap-2">
						<svg
							class="h-5 w-5 shrink-0 text-yellow-400"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						<span>Скоро сессия — приведите отчёты в порядок заранее</span>
					</div>
					<div class="flex items-center gap-2">
						<svg
							class="h-5 w-5 shrink-0 text-yellow-400"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						<span>Впереди новый семестр — закупите форматирования дешево</span>
					</div>
				</div>
			</div>
		</div>

		<div slot="footer" class="space-y-3">
			<button
				onclick={goToFormat}
				class="w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700"
			>
				Купить со скидкой
			</button>
			<button
				onclick={handleClose}
				class="w-full rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-600"
			>
				Может быть позже
			</button>
		</div>
	</BottomModal>
{/if}
