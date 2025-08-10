<script lang="ts">
	import { onMount } from 'svelte';

	let activeTab = 'page';

	const tabs = [
		{ id: 'page', icon: '📄', title: 'Параметры страницы' },
		{ id: 'text', icon: '📝', title: 'Форматирование текста' },
		{ id: 'headers', icon: '📌', title: 'Заголовки' },
		{ id: 'refs', icon: '🔗', title: 'Ссылки и обращения' },
		{ id: 'elements', icon: '🎨', title: 'Оформление элементов' },
		{ id: 'lists', icon: '📋', title: 'Списки и перечисления' }
	];

	const pageRules = {
		margins: {
			top: 2,
			right: 1,
			bottom: 2,
			left: 3
		},
		pageNumbers: {
			position: 'top-right',
			startFrom: 'introduction'
		}
	};

	const textRules = {
		font: 'Times New Roman',
		size: 14,
		indent: 1.25,
		alignment: 'justify',
		lineHeight: 'одинарный',
		tableSize: '12-14'
	};

	const headerLevels = [
		{
			level: 1,
			topMargin: 0,
			bottomMargin: 36,
			examples: ['1 Аналитическая часть', 'Введение', 'Заключение']
		},
		{
			level: 2,
			topMargin: 24,
			bottomMargin: 24,
			examples: ['1.1 Определение процесса']
		},
		{
			level: 3,
			topMargin: 12,
			bottomMargin: 0,
			examples: ['1.1.1 Методология']
		}
	];

	function getPagePreview() {
		return `
			<svg width="200" height="280" viewBox="0 0 200 280">
				<rect x="25" y="20" width="140" height="240" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
				<rect x="45" y="35" width="110" height="210" fill="#0f172a"/>
				<line x1="25" y1="20" x2="45" y2="35" stroke="#3b82f6" stroke-width="1" stroke-dasharray="2"/>
				<line x1="165" y1="20" x2="155" y2="35" stroke="#3b82f6" stroke-width="1" stroke-dasharray="2"/>
				<line x1="165" y1="260" x2="155" y2="245" stroke="#3b82f6" stroke-width="1" stroke-dasharray="2"/>
				<line x1="25" y1="260" x2="45" y2="245" stroke="#3b82f6" stroke-width="1" stroke-dasharray="2"/>
				<text x="5" y="145" fill="#3b82f6" font-size="10" transform="rotate(-90, 15, 140)">3 см</text>
				<text x="175" y="155" fill="#3b82f6" font-size="10" transform="rotate(90, 185, 140)">1 см</text>
				<text x="100" y="15" fill="#3b82f6" font-size="10" text-anchor="middle">2 см</text>
				<text x="100" y="272" fill="#3b82f6" font-size="10" text-anchor="middle">2 см</text>
			</svg>
		`;
	}

	function getTextPreview() {
		return `
			<svg width="200" height="100" viewBox="0 0 200 100">
				<rect x="10" y="10" width="180" height="80" fill="#1e293b"/>
				<line x1="35" y1="30" x2="175" y2="30" stroke="#3b82f6" stroke-width="2"/>
				<line x1="35" y1="45" x2="175" y2="45" stroke="#3b82f6" stroke-width="2"/>
				<line x1="35" y1="60" x2="175" y2="60" stroke="#3b82f6" stroke-width="2"/>
				<text x="45" y="25" fill="#3b82f6" font-size="10">Times New Roman, 14pt</text>
				<text x="35" y="41" fill="#3b82f6" font-size="10">текст текст текст текст текст</text>
				<path d="M45,29 L45,70" stroke="#e7000b" stroke-width="2" stroke-dasharray="2"/>
				<text x="49" y="69" fill="#3b82f6" font-size="8">1.25 см</text>
			</svg>
		`;
	}
</script>

<div class="mt-8 rounded-2xl bg-slate-800 p-4 md:p-6">
	<div class="mb-6 flex items-center border-b border-slate-700 pb-4">
		<h2 class="text-4xl font-semibold text-white">📋</h2>
		<h2 class="ml-3 text-xl font-semibold text-white md:text-3xl">Правила форматирования</h2>
	</div>

	<div class="mb-6 grid grid-cols-3 gap-1.5 sm:grid-cols-6 md:gap-2">
		{#each tabs as tab}
			<button
				class="group relative flex flex-col items-center justify-center rounded-lg p-2 transition-all {activeTab ===
				tab.id
					? 'bg-blue-500/10 text-blue-400'
					: 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'}"
				on:click={() => (activeTab = tab.id)}
			>
				<span class="text-2xl transition-transform group-hover:scale-110">{tab.icon}</span>
				<span class="mt-1 text-center text-xs">{tab.title}</span>
				{#if activeTab === tab.id}
					<div
						class="absolute -bottom-1 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-blue-400"
					></div>
				{/if}
			</button>
		{/each}
	</div>

	<div class="rounded-xl bg-slate-900/50 p-4 ring-1 ring-slate-700/50">
		{#if activeTab === 'page'}
			<div class="grid gap-6 md:grid-cols-2">
				<div>
					<h3 class="mb-4 text-xl font-semibold text-white">Параметры страницы</h3>
					<ul class="space-y-2 text-slate-300">
						<li class="flex items-center gap-2">
							<span class="text-blue-400">→</span>
							Левое поле: {pageRules.margins.left} см
						</li>
						<li class="flex items-center gap-2">
							<span class="text-blue-400">→</span>
							Правое поле: {pageRules.margins.right} см
						</li>
						<li class="flex items-center gap-2">
							<span class="text-blue-400">→</span>
							Верхнее поле: {pageRules.margins.top} см
						</li>
						<li class="flex items-center gap-2">
							<span class="text-blue-400">→</span>
							Нижнее поле: {pageRules.margins.bottom} см
						</li>
						<li class="mt-4 text-slate-400">
							Номера страниц начинаются с введения и располагаются в правом верхнем
							углу
						</li>
					</ul>
				</div>
				<div class="flex justify-center">
					{@html getPagePreview()}
				</div>
			</div>
		{:else if activeTab === 'text'}
			<div class="grid gap-6 md:grid-cols-2">
				<div>
					<h3 class="mb-4 text-xl font-semibold text-white">Форматирование текста</h3>
					<ul class="space-y-2 text-slate-300">
						<li class="flex items-center gap-2">
							<span class="text-blue-400">→</span>
							Шрифт: {textRules.font}
						</li>
						<li class="flex items-center gap-2">
							<span class="text-blue-400">→</span>
							Размер: {textRules.size} пт
						</li>
						<li class="flex items-center gap-2">
							<span class="text-blue-400">→</span>
							Красная строка: {textRules.indent} см
						</li>
						<li class="flex items-center gap-2">
							<span class="text-blue-400">→</span>
							Выравнивание: по ширине
						</li>
						<li class="flex items-center gap-2">
							<span class="text-blue-400">→</span>
							Межстрочный интервал: {textRules.lineHeight}
						</li>
						<li class="mt-4 text-slate-400">
							В таблицах допускается размер шрифта {textRules.tableSize} пт
						</li>
					</ul>
				</div>
				<div class="flex justify-center">
					{@html getTextPreview()}
				</div>
			</div>
		{:else if activeTab === 'headers'}
			<div class="space-y-4">
				<h3 class="text-xl font-semibold text-white">Уровни заголовков</h3>
				{#each headerLevels as header}
					<div class="rounded-lg bg-slate-800 p-4">
						<h4 class="mb-2 text-lg font-semibold text-white">
							Уровень {header.level}
						</h4>
						<div class="grid gap-4 md:grid-cols-2">
							<div>
								<p class="text-slate-300">
									Отступ сверху: {header.topMargin} пт
								</p>
								<p class="text-slate-300">
									Отступ снизу: {header.bottomMargin} пт
								</p>
							</div>
							<div>
								<p class="text-slate-400">Примеры:</p>
								<ul class="mt-2 space-y-1 text-blue-400">
									{#each header.examples as example}
										<li>{example}</li>
									{/each}
								</ul>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else if activeTab === 'refs'}
			<div class="space-y-4">
				<h3 class="mb-4 text-xl font-semibold text-white">Правила обращений</h3>
				<div class="grid gap-4 md:grid-cols-2">
					<div class="rounded-lg bg-slate-800 p-4">
						<h4 class="mb-2 text-lg font-semibold text-blue-400">К рисункам</h4>
						<p class="text-slate-300">В скобках: (рисунок 1)</p>
						<p class="text-slate-300">В тексте: показано на рисунке 1</p>
					</div>
					<div class="rounded-lg bg-slate-800 p-4">
						<h4 class="mb-2 text-lg font-semibold text-blue-400">К таблицам</h4>
						<p class="text-slate-300">В скобках: (таблица 1)</p>
						<p class="text-slate-300">В тексте: представлено в таблице 1</p>
					</div>
					<div class="rounded-lg bg-slate-800 p-4">
						<h4 class="mb-2 text-lg font-semibold text-blue-400">К литературе</h4>
						<p class="text-slate-300">В квадратных скобках: [1]</p>
					</div>
					<div class="rounded-lg bg-slate-800 p-4">
						<h4 class="mb-2 text-lg font-semibold text-blue-400">К формулам</h4>
						<p class="text-slate-300">В круглых скобках: (1)</p>
					</div>
				</div>
			</div>
		{:else if activeTab === 'elements'}
			<div class="space-y-4">
				<h3 class="text-xl font-semibold text-white">Оформление элементов</h3>
				<div class="grid gap-4 md:grid-cols-2">
					<div class="rounded-lg bg-slate-800 p-4">
						<h4 class="mb-2 text-lg font-semibold text-blue-400">Рисунки</h4>
						<ul class="space-y-2 text-slate-300">
							<li>• Выравнивание по центру</li>
							<li>• Пробел до и после рисунка</li>
							<li>• Подпись: по центру, Times New Roman, 14 пт</li>
						</ul>
					</div>
					<div class="rounded-lg bg-slate-800 p-4">
						<h4 class="mb-2 text-lg font-semibold text-blue-400">Таблицы</h4>
						<ul class="space-y-2 text-slate-300">
							<li>• Название с красной строки</li>
							<li>• Интервал после названия: 6 пт</li>
							<li>• При переносе: "Продолжение таблицы"/"Окончание таблицы"</li>
						</ul>
					</div>
					<div class="rounded-lg bg-slate-800 p-4">
						<h4 class="mb-2 text-lg font-semibold text-blue-400">Формулы</h4>
						<ul class="space-y-2 text-slate-300">
							<li>• Интервал до и после: 6 пт</li>
							<li>• После формулы: запятая, если есть "где"</li>
							<li>• После формулы: точка, если нет "где"</li>
						</ul>
					</div>
					<div class="rounded-lg bg-slate-800 p-4">
						<h4 class="mb-2 text-lg font-semibold text-blue-400">Литература</h4>
						<ul class="space-y-2 text-slate-300">
							<li>• Электронный ресурс: указать дату обращения</li>
							<li>• Книги/журналы: автор, название, год, страницы</li>
						</ul>
					</div>
				</div>
			</div>
		{:else if activeTab === 'lists'}
			<div class="space-y-4">
				<h3 class="mb-4 text-xl font-semibold text-white">Списки и перечисления</h3>
				<div class="grid gap-4 md:grid-cols-2">
					<div class="rounded-lg bg-slate-800 p-4">
						<h4 class="mb-2 text-lg font-semibold text-blue-400">
							Маркированный список
						</h4>
						<div class="text-slate-300">
							<p>—первый пункт;</p>
							<p>—второй пункт;</p>
							<p>—третий пункт.</p>
						</div>
					</div>
					<div class="rounded-lg bg-slate-800 p-4">
						<h4 class="mb-2 text-lg font-semibold text-blue-400">Буквенный список</h4>
						<div class="text-slate-300">
							<p>а) Первый пункт;</p>
							<p>б) Второй пункт;</p>
							<p>в) Третий пункт.</p>
						</div>
					</div>
				</div>
				<div class="mt-4 rounded-lg bg-slate-700 p-4 text-slate-400">
					<p class="mb-2">Важные замечания:</p>
					<ul class="list-disc space-y-1 pl-4">
						<li>В конце каждого пункта, кроме последнего - точка с запятой</li>
						<li>В последнем пункте - точка</li>
						<li>При написании с большой буквы - везде точки</li>
					</ul>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	:global(svg) {
		max-width: 100%;
		height: auto;
	}
</style>
