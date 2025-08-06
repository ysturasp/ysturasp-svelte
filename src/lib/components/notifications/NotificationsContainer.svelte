<script lang="ts">
	import { notifications } from '$lib/stores/notifications';
	import NotificationItem from '$lib/components/notifications/NotificationItem.svelte';

	export let hasScheduleSwitcher = false;
</script>

<div
	id="notifications-container"
	class="pointer-events-none fixed right-2 left-2 z-100 flex flex-col-reverse gap-3 {hasScheduleSwitcher
		? 'bottom-18 md:bottom-2'
		: 'bottom-2'}"
>
	{#each $notifications as notification (notification.id)}
		<div class="pointer-events-auto">
			<NotificationItem
				message={notification.message}
				type={notification.type}
				id={notification.id}
				isHiding={notification.isHiding || false}
				on:remove={(e) => notifications.remove(e.detail)}
			/>
		</div>
	{/each}
</div>
