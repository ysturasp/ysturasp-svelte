<script lang="ts">
    import type { Direction, Course } from '$lib/types/schedule';
    import CopyLinkButton from '$lib/components/ui/CopyLinkButton.svelte';
    import CustomSelect from '$lib/components/ui/CustomSelect.svelte';

    export let directions: Direction[];
    export let selectedDirection = '';
    export let selectedGroup = '';
    export let onSubmit: () => void;
    export let onDirectionChange: () => void;
    export let scheduleShown = false;

    export let selectedDirectionLabel = '';
    export let selectedGroupLabel = '';

    $: directionItems = directions.map(direction => ({
        id: direction.id,
        label: direction.name
    }));

    $: groupItems = selectedDirection ? 
        Object.entries(directions.find(d => d.id === selectedDirection)?.courses || {})
            .map(([key, course]) => ({
                id: key,
                label: (course as Course).name
            }))
        : [];

    function handleDirectionSelect(event: CustomEvent) {
        selectedDirection = event.detail.id;
        selectedDirectionLabel = event.detail.label;
        selectedGroup = '';
        selectedGroupLabel = '';
        onDirectionChange();
    }

    function handleGroupSelect(event: CustomEvent) {
        selectedGroup = event.detail.id;
        selectedGroupLabel = event.detail.label;
    }
</script>

<form class="grid grid-cols-1 gap-4" on:submit|preventDefault={onSubmit}>
    <div>
        <label class="block text-white mb-2">Выберите профиль:</label>
        <CustomSelect
            items={directionItems}
            bind:selectedId={selectedDirection}
            placeholder="Выберите профиль"
            on:select={handleDirectionSelect}
            width="100%"
            searchPlaceholder="Поиск профиля..."
        />
    </div>

    <div>
        <label class="block text-white mb-2">Выберите группу:</label>
        <CustomSelect
            items={groupItems}
            bind:selectedId={selectedGroup}
            placeholder={selectedDirection ? "Выберите группу" : "Сначала выберите профиль"}
            on:select={handleGroupSelect}
            disabled={!selectedDirection}
            width="100%"
            searchPlaceholder="Поиск группы..."
        />
    </div>

    <button
        type="submit"
        class="p-2 bg-blue-700 text-white rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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