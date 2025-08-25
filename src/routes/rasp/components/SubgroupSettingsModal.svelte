<script lang="ts">
	import BottomModal from '$lib/components/ui/BottomModal.svelte';
	import type { SubgroupSettings, TeacherSubgroups } from '../stores/subgroups';

	export let isOpen = false;
	export let settings: SubgroupSettings = {};
	export let teacherSubgroups: TeacherSubgroups = {};
	export let onSave: (settings: SubgroupSettings) => void;
	export let onClose: () => void;

	let localSettings: SubgroupSettings = { ...settings };

	$: if (isOpen) {
		localSettings = { ...settings };
		updateLabWorksList();
	}

	$: if (teacherSubgroups) {
		updateLabWorksList();
	}

	interface LabWorkInfo {
		name: string;
		isDivision: boolean;
		key: string;
		teacherName?: string;
	}

	let uniqueLabWorks: LabWorkInfo[] = [];

	function updateLabWorksList() {
		if (!teacherSubgroups || Object.keys(teacherSubgroups).length === 0) {
			uniqueLabWorks = [];
			return;
		}

		const labWorksMap = new Map<string, LabWorkInfo>();

		Object.entries(teacherSubgroups).forEach(([key, data]) => {
			const [subject, teacher] = key.split('_');
			const settingKey = subject.startsWith('null (преп.') ? `null_${teacher}` : subject;

			labWorksMap.set(settingKey, {
				name: data.displayName,
				isDivision: data.isDivision,
				key: settingKey,
				teacherName: data.teacher
			});
		});

		uniqueLabWorks = Array.from(labWorksMap.values());
	}

	function handleSave() {
		onSave(localSettings);
		onClose();
	}

	function toggleLabWork(key: string) {
		localSettings[key] = !localSettings[key];
		localSettings = { ...localSettings };
	}
</script>

<BottomModal {isOpen} title="Настройка подгрупп" {onClose}>
	<div class="mb-4">
		<div class="mb-4 flex items-center rounded-lg bg-yellow-50 p-4 font-bold text-yellow-900">
			<svg class="mr-2 h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
				<path
					d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"
				/>
			</svg>
			<div class="text-sm">
				Перед выбором предметов для деления на подгруппы убедитесь, что алгоритм
				распределения подгруппы для данного предмета работает корректно (посмотреть можно в
				секции "Распределение подгрупп" под расписанием)
			</div>
		</div>
	</div>

	<div class="max-h-96 space-y-4 overflow-y-auto">
		{#if uniqueLabWorks.length === 0}
			<div class="p-4 text-center text-white">
				Предметов для деления на подгруппы не найдено
			</div>
		{:else}
			{#each uniqueLabWorks.sort((a, b) => Number(b.isDivision) - Number(a.isDivision)) as labWork}
				<div class="flex items-center justify-between rounded-lg bg-slate-800 p-3">
					<div class="flex flex-grow flex-col gap-1 text-white">
						{#if !labWork.isDivision}
							<span class="self-start rounded-full bg-yellow-600 px-2 py-1 text-xs">
								Всей группой
							</span>
						{:else}
							<span class="self-start rounded-full bg-green-600 px-2 py-1 text-xs">
								По подгруппам
							</span>
						{/if}
						<span>{labWork.name}</span>
					</div>

					<label class="switch">
						<input
							type="checkbox"
							checked={localSettings[labWork.key] || false}
							on:change={() => toggleLabWork(labWork.key)}
						/>
						<span class="slider round"></span>
					</label>
				</div>
			{/each}
		{/if}
	</div>

	<div slot="footer">
		<button
			on:click={handleSave}
			class="w-full rounded-lg bg-blue-700 p-3 text-white transition-all hover:bg-blue-600"
		>
			Сохранить настройки
		</button>
	</div>
</BottomModal>

<style>
	.switch {
		position: relative;
		display: inline-block;
		width: 34px;
		height: 20px;
		flex-shrink: 0;
	}

	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #ccc;
		transition: 0.4s;
		border-radius: 20px;
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 12px;
		width: 12px;
		left: 4px;
		bottom: 4px;
		background-color: white;
		transition: 0.4s;
		border-radius: 50%;
	}

	input:checked + .slider {
		background-color: #2196f3;
	}

	input:checked + .slider:before {
		transform: translateX(14px);
	}
</style>
