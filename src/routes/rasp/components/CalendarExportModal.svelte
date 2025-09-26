<script lang="ts">
	import BottomModal from '$lib/components/ui/BottomModal.svelte';
	import CopyLinkButton from '$lib/components/ui/CopyLinkButton.svelte';

	export let isOpen = false;
	export let onClose: () => void;
	export let selectedGroup = '';

	$: calendarUrl = selectedGroup ? `https://ical.ystuty.ru/group/${selectedGroup}.ical` : '';
</script>

<BottomModal {isOpen} title="Экспорт расписания в календарь" {onClose}>
	<div class="space-y-4">
		{#if !selectedGroup}
			<div class="rounded-lg bg-red-900/50 p-4 text-center">
				<h4 class="text-lg font-semibold text-white">Выберите группу</h4>
				<p class="mt-2 text-gray-300">
					Для экспорта расписания в календарь необходимо сначала выбрать группу
				</p>
			</div>
		{:else}
			<div class="rounded-lg bg-blue-900/50 p-4">
				<h4 class="mb-2 text-lg font-semibold text-white">Инструкция по добавлению:</h4>
				<ol class="list-decimal space-y-2 pl-4">
					<li>Скопируйте ссылку на календарь</li>
					<li>В своём календаре найдите опцию "Добавить календарь по URL"</li>
					<li>Вставьте скопированную ссылку</li>
					<li>Расписание автоматически будет обновляться каждый день</li>
				</ol>
			</div>

			<div class="rounded-lg bg-slate-800 p-4">
				<div class="mb-2 text-sm text-gray-400">Ссылка на календарь:</div>
				<div class="rounded-lg bg-slate-900 p-3 text-sm break-all text-white">
					{calendarUrl}
				</div>
			</div>
		{/if}
	</div>

	<div slot="footer">
		<CopyLinkButton
			params={{ url: calendarUrl }}
			disabled={!selectedGroup}
			className="w-full rounded-lg bg-blue-700 p-3 text-white transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{selectedGroup ? 'Скопировать ссылку' : 'Сначала выберите группу'}
		</CopyLinkButton>
	</div>
</BottomModal>
