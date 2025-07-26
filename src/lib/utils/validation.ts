export function validateSettingsName(name: string): { isValid: boolean; reason?: string } {
	if (!name || typeof name !== 'string') {
		return { isValid: false, reason: 'Название не может быть пустым' };
	}

	if (name.length < 3) {
		return { isValid: false, reason: 'Название слишком короткое (минимум 3 символа)' };
	}
	if (name.length > 50) {
		return { isValid: false, reason: 'Название слишком длинное (максимум 50 символов)' };
	}

	const stopWords = [
		'admin',
		'root',
		'system',
		'script',
		'delete',
		'drop',
		'update',
		'insert',
		'select',
		'<script>',
		'javascript:',
		'onerror=',
		'onload=',
		'onclick=',
		'alert(',
		'console.',
		'document.',
		'window.',
		'eval(',
		'setTimeout(',
		'setInterval(',

		'hitler',
		'nazi',
		'reich',
		'cocaine',
		'heroin',
		'drugs',

		'fuck',
		'fuck1ng',
		'fvck',
		'phuck',
		'f*ck',
		'f**k',
		'fucc',
		'fuk',
		'fcuk',
		'shit',
		'sh1t',
		'sh*t',
		'shyt',
		'bullshit',
		'crap',
		'dick',
		'd1ck',
		'cock',
		'c0ck',
		'penis',
		'pen1s',
		'p3n1s',
		'ass',
		'@ss',
		'a$$',
		'asshole',
		'@sshole',
		'a$$hole',
		'bitch',
		'b1tch',
		'b*tch',
		'bytch',
		'biatch',
		'whore',
		'wh0re',
		'hoe',
		'slut',
		'sl*t',
		'pussy',
		'puss1',
		'pu$$y',
		'vagina',
		'vag1na',
		'bastard',
		'b@stard',
		'retard',

		'хуй',
		'хуя',
		'хуе',
		'хуё',
		'хуи',
		'хуюшки',
		'хер',
		'хрен',
		'пизд',
		'пздц',
		'пиздец',
		'пизда',
		'пиздато',
		'пиздатый',
		'бляд',
		'блят',
		'блядь',
		'бля',
		'блеять',
		'блядство',
		'ебат',
		'еба',
		'ебл',
		'ебн',
		'ёб',
		'еб',
		'ёба',
		'ебу',
		'ебё',
		'ибат',
		'ебан',
		'ебун',
		'заеб',
		'уеб',
		'въеб',
		'съеб',
		'оеб',
		'мудак',
		'мудоз',
		'мудил',
		'мудень',
		'мудеть',
		'сука',
		'сучк',
		'сучар',
		'суч',
		'сукин',
		'пидор',
		'пидр',
		'пидар',
		'педик',
		'пидж',
		'гондон',
		'гандон',
		'гондур',
		'долбо',
		'долба',
		'далбо',
		'дрочи',
		'драчи',
		'дроч',
		'елда',
		'елдак',
		'елд',
		'жопа',
		'жоп',
		'жеп',
		'залупа',
		'золупа',
		'залуп',
		'конча',
		'кончи',
		'конч',
		'манда',
		'манд',
		'мандав',
		'мразь',
		'мраз',
		'мразот',
		'очко',
		'очколиз',
		'пердун',
		'пердеж',
		'пердун',
		'срака',
		'срать',
		'сральник',
		'шлюха',
		'шлюш',
		'шалава',

		'x у й',
		'x y й',
		'xy й',
		'x уй',
		'xyй',
		'п и з д',
		'p i z d',
		'пи3д',
		'пи3да',
		'e б а т',
		'e b a t',
		'ёбт',
		'йобт',
		'b l y a t',
		'b l я t',
		'блиад',
		'бл1ад',
		'сцука',
		'сцуко',
		'сцучка',
		'pid0r',
		'p1d0r',
		'пед1к',

		'wtf',
		'stfu',
		'omfg',
		'ffs',
		'kys',
		'нах',
		'нех',
		'нах.',
		'пох',
		'пох.',
		'поху',
		'пахую'
	];

	const lowerName = name.toLowerCase();
	for (const word of stopWords) {
		if (lowerName.includes(word)) {
			return { isValid: false, reason: 'Название содержит недопустимые слова' };
		}
	}

	const sqlPatterns = [
		'--',
		';',
		'/*',
		'*/',
		'union',
		'select',
		'from',
		'where',
		'drop',
		'delete',
		'update',
		'insert',
		'exec',
		'execute',
		'sp_',
		'xp_'
	];

	for (const pattern of sqlPatterns) {
		if (lowerName.includes(pattern)) {
			return { isValid: false, reason: 'Название содержит недопустимые символы' };
		}
	}

	const xssPatterns = [
		'<',
		'>',
		'"',
		"'",
		'`',
		'(',
		')',
		'{',
		'}',
		'[',
		']',
		'javascript:',
		'data:',
		'vbscript:',
		'expression(',
		'url(',
		'@import'
	];

	for (const pattern of xssPatterns) {
		if (name.includes(pattern)) {
			return { isValid: false, reason: 'Название содержит недопустимые символы' };
		}
	}

	const allowedPattern = /^[a-zA-Zа-яА-ЯёЁ0-9\s\-_.,!?]+$/;
	if (!allowedPattern.test(name)) {
		return {
			isValid: false,
			reason: 'Название может содержать только буквы, цифры и базовые знаки препинания'
		};
	}

	if (/(.)\1{4,}/.test(name)) {
		return { isValid: false, reason: 'Название содержит слишком много повторяющихся символов' };
	}

	return { isValid: true };
}
