export const institutes = [
	{ value: 'ЗФО', label: 'Заочная форма обучения' },
	{ value: 'ИАД', label: 'Институт архитектуры и дизайна' },
	{ value: 'ИИСТ', label: 'Институт инженеров строительства и транспорта' },
	{ value: 'ИХХТ', label: 'Институт химии и химической технологии' },
	{ value: 'ИЭМ', label: 'Институт экономики и менеджмента' },
	{ value: 'ИЦС', label: 'Институт цифровых систем' },
	{ value: 'ИИМ', label: 'Институт инженерии и машиностроения' },
	{ value: 'ОБЩ', label: 'Общежития' }
];

export function getFullInstituteName(shortName: string): string {
	const institute = institutes.find((i) => i.value === shortName);
	return institute?.label || shortName;
}
