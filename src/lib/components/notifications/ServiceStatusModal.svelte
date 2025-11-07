<script lang="ts">
	import BottomModal from '$lib/components/ui/BottomModal.svelte';
	import type { UptimeRobotMonitor } from '$lib/utils/uptimerobot';
	import { onMount } from 'svelte';

	export let isOpen = false;
	export let downServices: UptimeRobotMonitor[] = [];
	export let totalDown: number = 0;
	export let onClose: (() => void) | undefined = undefined;

	$: {
		console.log('ServiceStatusModal - isOpen:', isOpen);
		console.log('ServiceStatusModal - downServices:', downServices);
		console.log('ServiceStatusModal - totalDown:', totalDown);
	}

	function handleClose() {
		console.log('ServiceStatusModal - handleClose called');
		if (onClose) {
			onClose();
		}
	}

	function formatUptime(ratio: string): string {
		const num = parseFloat(ratio);
		return num.toFixed(2) + '%';
	}
</script>

<BottomModal
	{isOpen}
	title="⚠️ ой, что-то сломалось"
	subtitle="Некоторые сервисы временно недоступны"
	subtitleClass="text-yellow-400"
	onClose={handleClose}
>
	<div class="space-y-4">
		{#if downServices.length > 0}
			<div class="space-y-3">
				{#each downServices as service}
					<div class="rounded-lg border border-red-500/30 bg-red-950/20 p-4">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								{#if service.name === 'API rasp YSTUtu'}
									<h4 class="font-semibold text-white">
										API расписания от YSTUtu
									</h4>
								{:else}
									<h4 class="font-semibold text-white">{service.name}</h4>
								{/if}
								<div class="space-y-1 text-sm text-gray-400">
									<div class="flex items-center gap-2">
										<span class="inline-block h-2 w-2 rounded-full bg-red-500"
										></span>
										<span class="mb-1 text-sm text-red-500"
											>Сервис сейчас недоступен</span
										>
									</div>
								</div>
								{#if service.name === 'API rasp YSTUtu'}
									<div class="text-sm text-gray-400">
										ysturasp не владеет этим сервисом, проблема будет вскоре
										исправлена его владельцем
									</div>
								{:else}
									<div class="text-sm text-gray-400">
										ysturasp владеет этим сервисом, мы уже работаем над ее
										исправлением
									</div>
								{/if}
								<div class="text-sm text-yellow-400/80">
									Если вы смотрели расписание недавно, можете проигнорировать это
									уведомление, оно было успешно закэшировано
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div slot="footer">
		<button
			class="w-full rounded-lg bg-blue-700 p-3 text-white transition-all hover:bg-blue-600"
			on:click={() => window.open('https://stats.uptimerobot.com/COz2FUGsub', '_blank')}
		>
			Посмотреть доступность сервисов
		</button>
	</div>
</BottomModal>
