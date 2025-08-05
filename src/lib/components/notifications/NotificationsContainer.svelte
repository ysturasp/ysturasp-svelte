<script lang="ts">
	import { notifications } from '$lib/stores/notifications';
	import NotificationItem from '$lib/components/notifications/NotificationItem.svelte';
</script>

<div
	id="notifications-container"
	class="pointer-events-none fixed right-2 bottom-2 left-2 z-50 flex flex-col-reverse gap-3"
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
