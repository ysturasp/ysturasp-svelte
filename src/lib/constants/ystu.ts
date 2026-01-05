import type { InstituteId } from '../../routes/stat/types';

export const FACULTY_NAME_MAP: Record<string, InstituteId> = {
	'Институт цифровых систем': 'btn-digital-systems',
	'Институт инженерии и машиностроения': 'btn-engineering-machinery',
	'Институт архитектуры и дизайна': 'btn-architecture-design',
	'Институт химии и химической технологии': 'btn-chemistry',
	'Институт экономики и менеджмента': 'btn-economics-management',
	'Институт инженеров строительства и транспорта': 'btn-civil-transport'
};

export const EDUCATION_FORMS: Record<number, string> = {
	10: 'Очная',
	20: 'Заочная',
	30: 'Очно-заочная'
};
