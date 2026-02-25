<script lang="ts">
	import { notifications } from '$lib/stores/notifications';
	import NotificationItem from '$lib/components/notifications/NotificationItem.svelte';

	export let hasScheduleSwitcher = false;

	function handleContainerClick(event: MouseEvent) {
		event.stopPropagation();
	}

	function handleContainerKey(event: KeyboardEvent) {
		event.stopPropagation();
	}
</script>

<div
	id="notifications-container"
	class="pointer-events-none fixed right-2 left-2 z-110 flex flex-col-reverse gap-3 {hasScheduleSwitcher
		? 'bottom-18 md:bottom-2'
		: 'bottom-2'}"
	role="presentation"
	aria-hidden="true"
	on:click={handleContainerClick}
	on:keydown={handleContainerKey}
>
	{#each $notifications as notification (notification.id)}
		<div
			class="pointer-events-auto"
			role="presentation"
			aria-hidden="true"
			on:click={handleContainerClick}
			on:keydown={handleContainerKey}
		>
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
