<script lang="ts">
	import { notifications } from '$lib/stores/notifications';
	import type { NotificationType } from '$lib/types';
	import NotificationsContainer from './NotificationsContainer.svelte';

	export let message: string = '';
	export let type: NotificationType = 'info';
	export let show: boolean = false;

	$: if (show && message) {
		notifications.add(message, type);
		show = false;
	}
</script>

<NotificationsContainer />
