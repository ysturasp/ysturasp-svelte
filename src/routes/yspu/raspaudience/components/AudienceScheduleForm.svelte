<script lang="ts">
    import { onMount } from 'svelte';
    import CopyLinkButton from '$lib/components/ui/CopyLinkButton.svelte';
    import type { Audience } from '../api';
    import { notifications } from '$lib/stores/notifications';

    export let audiences: Audience[] = [];
    export let selectedAudience = '';
    export let onSubmit: () => void;

    let searchQuery = '';
    let showOptions = false;
    let filteredAudiences: Audience[] = [];
    let overlay: HTMLDivElement;

    $: {
        filteredAudiences = audiences.filter(audience =>
            audience.number.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    function selectAudience(audience: Audience) {
        selectedAudience = audience.id;
        searchQuery = audience.number;
        showOptions = false;
        overlay.classList.add('hidden');
    }

    function clearSelection() {
        selectedAudience = '';
        searchQuery = '';
    }

    function handleFocus() {
        showOptions = true;
        overlay.classList.remove('hidden');
    }

    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        const input = document.getElementById('combobox-input');
        const options = document.getElementById('combobox-options');
        
        if (input && options && !input.contains(target) && !options.contains(target)) {
            showOptions = false;
            overlay.classList.add('hidden');
        }
    }

    onMount(() => {
        overlay = document.createElement('div');
        overlay.classList.add('ambient-overlay', 'hidden');
        document.body.appendChild(overlay);

        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        };
    });
</script>

<form class="grid grid-cols-1 gap-4" on:submit|preventDefault={onSubmit}>
    <div class="relative">
        <input
            id="combobox-input"
            type="text"
            class="block w-full p-2.5 bg-slate-900 border border-gray-600 rounded-2xl text-gray-300 focus:ring-blue-500 focus:border-blue-500"
            class:ambient-focuss={showOptions}
            placeholder="Выберите аудиторию..."
            bind:value={searchQuery}
            on:focus={handleFocus}
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
        />

        {#if selectedAudience}
            <button
                type="button"
                class="clear-button"
                on:click|stopPropagation={clearSelection}
            >
                ×
            </button>
        {/if}

        {#if showOptions}
            <ul
                id="combobox-options"
                class="absolute w-full p-2 bg-slate-900 border border-gray-600 rounded-2xl mt-1 overflow-hidden combobox-options"
                class:active={showOptions}
                class:ambient-focus={showOptions}
            >
                {#each filteredAudiences as audience}
                    <li
                        class="p-2 cursor-pointer hover:bg-gray-700 rounded"
                        on:mousedown={() => selectAudience(audience)}
                    >
                        {audience.number}
                    </li>
                {/each}
            </ul>
        {/if}
    </div>

    <button
        type="submit"
        class="p-2 bg-blue-700 text-white rounded-2xl hover:bg-blue-600 transition-all"
        disabled={!selectedAudience}
    >
        Показать расписание
    </button>

    <CopyLinkButton
        disabled={!selectedAudience}
        params={{ audience: selectedAudience }}
        successMessage="Ссылка на расписание аудитории скопирована"
    >
        Скопировать ссылку на расписание
    </CopyLinkButton>
</form>

<style>
    .clear-button {
        display: none;
        position: absolute;
        padding-left: 7px;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        border: none;
        color: gray;
        font-size: 2rem;
        cursor: pointer;
        z-index: 9999;
    }

    .relative input:not(:placeholder-shown) + .clear-button {
        display: block;
    }

    .combobox-options {
        max-height: 300px;
        overflow-y: auto;
        opacity: 0;
        transform: translateY(-10px);
        transition: opacity 0.8s ease, transform 0.8s ease;
        max-height: 0;
        overflow: scroll;
    }

    .combobox-options.active {
        opacity: 1;
        transform: translateY(0);
        max-height: 300px;
    }

    .combobox-options li {
        border-radius: 18px;
        transition: background-color 0.3s ease-in-out;
    }

    .combobox-options li:hover {
        border-radius: 18px;
        background-color: #0072e461;
    }

    .ambient-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(30, 30, 30, 0.7);
        z-index: 9998;
        backdrop-filter: blur(1px);
        -webkit-backdrop-filter: blur(1px);
        pointer-events: none;
        transition: backdrop-filter 0.6s ease-in-out, background 0.6s ease-in-out;
    }

    .ambient-focuss {
        position: relative;
        background: rgba(1, 21, 51, 0.931);
        box-shadow: 0 0 200px rgb(0, 57, 117);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        z-index: 9999;
    }

    .ambient-focus {
        background: rgba(1, 21, 51, 0.931);
        box-shadow: 0 0 200px rgb(0, 57, 117);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        z-index: 9999;
        transition: box-shadow 0.6s ease-in-out, backdrop-filter 0.6s ease-in-out;
    }
</style> 