<script lang="ts">
	export let weekType: 'numerator' | 'denominator' | null;
</script>

{#if weekType}
	<span
		class="ml-2 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {weekType ===
		'numerator'
			? 'bg-blue-500/10 text-blue-400'
			: 'bg-purple-500/10 text-purple-400'}"
	>
		{weekType === 'numerator' ? 'числитель' : 'знаменатель'}
	</span>
{/if}
