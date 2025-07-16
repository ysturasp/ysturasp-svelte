<script lang="ts">
    export let title: string;
    export let titleHref: string | undefined = undefined;
    export let items: Array<{
        href: string;
        text: string;
    }>;
    export let className = '';
</script>

<div class="dropdown relative inline-block {className}">
    {#if titleHref}
        <a href={titleHref} class="text-slate-400 hover:text-blue-400 transition-all">{title}</a>
    {:else}
        <span class="text-slate-400 hover:text-blue-400 transition-all cursor-pointer">{title}</span>
    {/if}
    <div class="dropdown-content">
        {#each items as item}
            <a href={item.href} class="text-slate-400 hover:text-white">{item.text}</a>
        {/each}
    </div>
</div>

<style>
    .dropdown {
        position: relative;
        display: inline-block;
    }

    .dropdown-content {
        position: absolute;
        bottom: 100%;
        right: 0;
        margin-bottom: 0.5rem;
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98));
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 0.75rem;
        padding: 0.5rem;
        z-index: 50;
        min-width: 200px;
        transform-origin: bottom right;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transform: scale(0.95);
        transition: all 0.2s ease-out;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .dropdown-content::after {
        content: '';
        position: absolute;
        bottom: -1rem;
        left: 0;
        right: 0;
        height: 1rem;
    }

    .dropdown:hover .dropdown-content {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transform: scale(1);
    }

    .dropdown-content a {
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        transition: all 0.2s ease;
        text-align: left;
        white-space: nowrap;
    }

    .dropdown-content a:hover {
        background: rgba(59, 130, 246, 0.1);
    }
</style> 