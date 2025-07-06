<script lang="ts">
  import { notifications } from '$lib/stores/notifications';
  import NotificationItem from './NotificationItem.svelte';
</script>

<div id="notifications-container" class="fixed bottom-5 right-5 left-5 sm:right-10 sm:left-auto z-50 flex flex-col-reverse gap-3 pointer-events-none">
  {#each $notifications as notification (notification.id)}
    <div class="pointer-events-auto">
      <NotificationItem
        message={notification.message}
        type={notification.type}
        id={notification.id}
        on:remove={(e) => notifications.remove(e.detail)}
      />
    </div>
  {/each}
</div> 