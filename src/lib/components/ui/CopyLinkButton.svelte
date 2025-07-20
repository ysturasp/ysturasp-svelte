<script lang="ts">
  import { notifications } from '$lib/stores/notifications';

  export let disabled = false;
  export let params: Record<string, string> = {};
  export let className = '';
  export let successMessage = 'Ссылка скопирована в буфер обмена';
  export let errorMessage = 'Не удалось скопировать ссылку';

  async function copyLink() {
    const url = new URL(window.location.href);
    
    url.search = '';
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });

    const textToCopy = url.toString();

    try {
      await navigator.clipboard.writeText(textToCopy);
      notifications.add(successMessage, 'success');
    } catch (error) {
      try {
        const tempInput = document.createElement('input');
        tempInput.value = textToCopy;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        notifications.add(successMessage, 'success');
      } catch (fallbackError) {
        notifications.add(errorMessage, 'error');
      }
    }
  }
</script>

<button
  type="button"
  class="p-2 border-2 border-blue-700 text-white rounded-2xl hover:border-blue-800 transition-all flex items-center justify-center {className}"
  on:click={copyLink}
  {disabled}
>
  <span class="text-3xl md:text-xl align-middle">🔗</span>
  <span class="ml-2 text-sm align-middle hidden md:inline">
    <slot>Скопировать ссылку</slot>
  </span>
</button> 