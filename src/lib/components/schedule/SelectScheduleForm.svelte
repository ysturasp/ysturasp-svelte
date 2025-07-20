<script lang="ts">
    import type { Direction, Course } from '$lib/types/schedule';
    import CopyLinkButton from '$lib/components/ui/CopyLinkButton.svelte';

    export let directions: Direction[];
    export let selectedDirection = '';
    export let selectedGroup = '';
    export let onSubmit: () => void;
    export let onDirectionChange: () => void;
    export let scheduleShown = false;
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

    {#if scheduleShown && selectedDirection && selectedGroup}
        <div class="flex justify-between items-center w-full">
            <CopyLinkButton
                params={{
                    direction: selectedDirection,
                    group: selectedGroup
                }}
                successMessage="Ссылка на расписание группы скопирована"
            >
                Скопировать ссылку на расписание
            </CopyLinkButton>
        </div>
    {/if}
</form> 