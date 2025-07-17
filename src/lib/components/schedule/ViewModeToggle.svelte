<script lang="ts">
    export let viewMode: 'all' | 'actual';
    export let onToggle: (mode: 'all' | 'actual') => void;
</script>

<div class="flex justify-center items-center">
    <div class="bg-slate-800 rounded-2xl p-2 flex items-center">
        <button
            class="px-4 py-2 rounded-2xl mr-2 transition-all {viewMode === 'all' ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-400'}"
            on:click={() => onToggle('all')}
        >
            Общее расписание
        </button>
        <button
            class="px-4 py-2 rounded-2xl transition-all {viewMode === 'actual' ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-400'}"
            on:click={() => onToggle('actual')}
        >
            Актуальное по дате
        </button>
    </div>
</div> 