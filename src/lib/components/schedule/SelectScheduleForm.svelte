<script lang="ts">
    import type { Direction, Course } from '$lib/types/schedule';
    import { notifications } from '$lib/stores/notifications';

    export let directions: Direction[];
    export let selectedDirection = '';
    export let selectedGroup = '';
    export let onSubmit: () => void;
    export let onDirectionChange: () => void;

    async function copyScheduleLink() {
        if (!selectedDirection || !selectedGroup) {
            notifications.add('Сначала выберите профиль и группу', 'error');
            return;
        }

        const url = new URL(window.location.href);
        url.searchParams.set('direction', selectedDirection);
        url.searchParams.set('group', selectedGroup);

        try {
            await navigator.clipboard.writeText(url.toString());
            notifications.add('Ссылка скопирована в буфер обмена', 'success');
        } catch (error) {
            notifications.add('Не удалось скопировать ссылку', 'error');
        }
    }
</script>

<form class="grid grid-cols-1 gap-4" on:submit|preventDefault={onSubmit}>
    <div>
        <label for="institute-select" class="block text-white mb-2">Выберите профиль:</label>
        <select
            id="institute-select"
            class="w-full p-2 bg-slate-900 text-white rounded-xl"
            bind:value={selectedDirection}
            on:change={onDirectionChange}
        >
            <option value="">Выберите профиль</option>
            {#each directions as direction}
                <option value={direction.id}>{direction.name}</option>
            {/each}
        </select>
    </div>

    <div>
        <label for="group-select" class="block text-white mb-2">Выберите группу:</label>
        <select
            id="group-select"
            class="w-full p-2 bg-slate-900 text-white rounded-xl"
            bind:value={selectedGroup}
            disabled={!selectedDirection}
        >
            <option value="">Сначала выберите профиль</option>
            {#if selectedDirection}
                {#each Object.entries(directions.find(d => d.id === selectedDirection)?.courses || {}) as [key, course]}
                    <option value={key}>{(course as Course).name}</option>
                {/each}
            {/if}
        </select>
    </div>

    <button
        type="submit"
        class="p-2 bg-blue-700 text-white rounded-xl hover:bg-blue-600 transition-all"
        disabled={!selectedDirection || !selectedGroup}
    >
        Показать расписание
    </button>

    <div class="flex justify-between items-center w-full">
        <button
            type="button"
            on:click={copyScheduleLink}
            class="p-2 border-2 border-blue-700 text-white rounded-lg hover:border-blue-800 transition-all flex items-center justify-center"
        >
            <span class="text-3xl md:text-xl align-middle">🔗</span>
            <span class="ml-2 text-sm align-middle hidden md:inline">Скопировать ссылку на расписание</span>
        </button>
    </div>
</form> 