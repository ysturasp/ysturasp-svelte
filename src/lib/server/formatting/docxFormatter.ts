import JSZip from 'jszip';
import { js2xml, xml2js, type Element as XmlElement } from 'xml-js';
import type { FormatParams } from '$lib/types/formatting';

const TWIPS_PER_POINT = 20;
const TWIPS_PER_INCH = 1440;

const headingStyles: Record<number, string[]> = {
	1: ['heading1', 'heading 1', 'заголовок1', 'заголовок 1'],
	2: ['heading2', 'heading 2', 'заголовок2', 'заголовок 2'],
	3: ['heading3', 'heading 3', 'заголовок3', 'заголовок 3']
};

type ParagraphContext = {
	element: XmlElement;
	bodyIndex: number;
};

export async function formatDocx(buffer: Buffer, params: FormatParams): Promise<Buffer> {
	const zip = await JSZip.loadAsync(buffer);

	const documentEntry = zip.file('word/document.xml');
	if (!documentEntry) {
		throw new Error('Не удалось найти содержимое документа');
	}

	const documentXml = await documentEntry.async('string');
	const updatedDocumentXml = processDocumentXml(documentXml, params);
	zip.file('word/document.xml', updatedDocumentXml);

	const stylesEntry = zip.file('word/styles.xml');
	if (stylesEntry) {
		const stylesXml = await stylesEntry.async('string');
		const updatedStylesXml = processStylesXml(stylesXml, params);
		zip.file('word/styles.xml', updatedStylesXml);
	}

	return await zip.generateAsync({ type: 'nodebuffer' });
}

function processDocumentXml(xml: string, params: FormatParams): string {
	const json = xml2js(xml, { compact: false }) as XmlElement;
	const documentNode = findElement(json, 'w:document');
	const body = documentNode ? findElement(documentNode, 'w:body') : undefined;
	if (!documentNode || !body) {
		return xml;
	}

	removeTableOfContents(body);
	formatBodyParagraphs(body, params);
	setDocumentMargins(body, params);

	return js2xml(json, { compact: false, spaces: 4 });
}

function processStylesXml(xml: string, params: FormatParams): string {
	const json = xml2js(xml, { compact: false }) as XmlElement;
	const stylesRoot = findElement(json, 'w:styles');
	if (!stylesRoot) {
		return xml;
	}

	const docDefaults = ensureChild(stylesRoot, 'w:docDefaults');
	const runDefaultsWrapper = ensureChild(docDefaults, 'w:rPrDefault');
	const runDefaults = ensureChild(runDefaultsWrapper, 'w:rPr');
	applyRunFormatting(runDefaults, params);

	const paragraphDefaultsWrapper = ensureChild(docDefaults, 'w:pPrDefault');
	const paragraphDefaults = ensureChild(paragraphDefaultsWrapper, 'w:pPr');
	applyParagraphSpacing(paragraphDefaults, {
		before: 0,
		after: 0,
		line: calculateLineSpacing(params.text.lineHeight)
	});
	setParagraphIndent(paragraphDefaults, params.text.indent);

	return js2xml(json, { compact: false, spaces: 4 });
}

function formatBodyParagraphs(body: XmlElement, params: FormatParams) {
	const bodyElements = body.elements ?? [];
	const paragraphContexts: ParagraphContext[] = [];

	for (let i = 0; i < bodyElements.length; i++) {
		const element = bodyElements[i];
		if (isElement(element, 'w:p')) {
			paragraphContexts.push({ element, bodyIndex: i });
		} else if (isElement(element, 'w:tbl')) {
			formatTable(element, params);
		}
	}

	const titleBoundaryIndex = findTitlePageBoundary(paragraphContexts);
	pruneEmptyParagraphs(body.elements ?? [], paragraphContexts, titleBoundaryIndex);

	for (const context of paragraphContexts) {
		formatParagraph(context.element, params);
	}
}

function formatTable(table: XmlElement, params: FormatParams) {
	const rows = table.elements ?? [];
	for (const row of rows) {
		if (!isElement(row, 'w:tr')) continue;
		for (const cell of row.elements ?? []) {
			if (!isElement(cell, 'w:tc')) continue;
			for (const child of cell.elements ?? []) {
				if (isElement(child, 'w:p')) {
					formatParagraph(child, params, { insideTable: true });
				}
			}
		}
	}
}

function formatParagraph(
	paragraph: XmlElement,
	params: FormatParams,
	options: { insideTable?: boolean } = {}
) {
	const paragraphText = getParagraphText(paragraph).trim();
	const pPr = ensureChild(paragraph, 'w:pPr');
	const headingLevel = getHeadingLevel(pPr);
	const hasNumbering = Boolean(findElement(pPr, 'w:numPr'));
	const hasImage = paragraphHasImage(paragraph);
	const isFigureCaption = /^рисунок\s+\d+/i.test(paragraphText);
	const isTableCaption = /^таблица\s+\d+/i.test(paragraphText);

	if (
		headingLevel &&
		paragraphText === paragraphText.toUpperCase() &&
		/[A-ZА-Я]/.test(paragraphText)
	) {
		updateSingleRunText(paragraph, formatHeadingText(paragraphText));
	}

	if (hasImage) {
		setParagraphAlignment(pPr, 'center');
		setParagraphSpacing(pPr, params, { before: 16, after: 0 });
		setParagraphIndent(pPr, 0);
	} else if (isFigureCaption) {
		setParagraphAlignment(pPr, 'center');
		setParagraphSpacing(pPr, params, { before: 0, after: 16 });
		setParagraphIndent(pPr, 0);
	} else if (isTableCaption) {
		setParagraphAlignment(pPr, 'left');
		setParagraphSpacing(pPr, params, { before: 16, after: 0 });
		setParagraphIndent(pPr, params.text.indent);
	} else if (headingLevel) {
		setParagraphAlignment(pPr, 'left');
		const headerSpacing = params.headers[`h${headingLevel}` as keyof typeof params.headers];
		setParagraphSpacing(pPr, params, {
			before: headerSpacing.spacingBefore,
			after: headerSpacing.spacingAfter
		});
		setParagraphIndent(pPr, params.text.indent);
	} else if (hasNumbering) {
		setParagraphAlignment(pPr, 'left');
		setParagraphSpacing(pPr, params, { before: 0, after: 0 });
		setParagraphIndent(pPr, hasImage ? 0 : params.text.indent);
	} else {
		setParagraphAlignment(pPr, headingLevel ? 'left' : 'both');
		setParagraphSpacing(pPr, params, { before: 0, after: 0 });
		setParagraphIndent(pPr, options.insideTable ? 0 : params.text.indent);
	}

	applyRunFormattingToParagraph(paragraph, params);
}

function applyRunFormattingToParagraph(paragraph: XmlElement, params: FormatParams) {
	for (const element of paragraph.elements ?? []) {
		if (!isElement(element, 'w:r')) continue;
		const rPr = ensureChild(element, 'w:rPr');
		applyRunFormatting(rPr, params);
	}
}

function applyRunFormatting(runProperties: XmlElement, params: FormatParams) {
	const fonts = ensureChild(runProperties, 'w:rFonts');
	fonts.attributes = {
		...(fonts.attributes ?? {}),
		'w:ascii': params.text.font,
		'w:hAnsi': params.text.font,
		'w:cs': params.text.font,
		'w:eastAsia': params.text.font
	};

	const fontSizeValue = (params.text.size * 2).toString();
	const sz = ensureChild(runProperties, 'w:sz');
	sz.attributes = { ...(sz.attributes ?? {}), 'w:val': fontSizeValue };

	const szCs = ensureChild(runProperties, 'w:szCs');
	szCs.attributes = { ...(szCs.attributes ?? {}), 'w:val': fontSizeValue };

	if (params.text.removeBold) {
		removeChild(runProperties, 'w:b');
		removeChild(runProperties, 'w:bCs');
	}
	if (params.text.removeItalic) {
		removeChild(runProperties, 'w:i');
		removeChild(runProperties, 'w:iCs');
	}
	if (params.text.removeUnderline) {
		removeChild(runProperties, 'w:u');
	}
}

function setDocumentMargins(body: XmlElement, params: FormatParams) {
	let sectPr = findElement(body, 'w:sectPr');
	if (!sectPr) {
		sectPr = createElement('w:sectPr');
		body.elements = [...(body.elements ?? []), sectPr];
	}

	const pgMar = ensureChild(sectPr, 'w:pgMar');
	pgMar.attributes = {
		...(pgMar.attributes ?? {}),
		'w:top': cmToTwip(params.margins.top).toString(),
		'w:right': cmToTwip(params.margins.right).toString(),
		'w:bottom': cmToTwip(params.margins.bottom).toString(),
		'w:left': cmToTwip(params.margins.left).toString(),
		'w:header': pointsToTwip(16).toString(),
		'w:footer': pointsToTwip(16).toString(),
		'w:gutter': '0'
	};
}

function removeTableOfContents(body: XmlElement) {
	body.elements = (body.elements ?? []).filter((element) => !isTableOfContents(element));
}

function isTableOfContents(element?: XmlElement): boolean {
	if (!element || !isElement(element, 'w:sdt')) {
		return false;
	}
	return containsDocPartGallery(element);
}

function containsDocPartGallery(element: XmlElement): boolean {
	for (const child of element.elements ?? []) {
		if (isElement(child, 'w:docPartGallery')) {
			const value = child.attributes?.['w:val']?.toString().toLowerCase() ?? '';
			if (value.includes('table of contents') || value.includes('оглавление')) {
				return true;
			}
		}
		if (containsDocPartGallery(child)) {
			return true;
		}
	}
	return false;
}

function pruneEmptyParagraphs(
	bodyElements: XmlElement[],
	paragraphs: ParagraphContext[],
	titleBoundary: number
) {
	let lastContentIndex = -1;
	for (let i = paragraphs.length - 1; i >= 0; i--) {
		if (!isParagraphEmpty(paragraphs[i].element)) {
			lastContentIndex = paragraphs[i].bodyIndex;
			break;
		}
	}

	for (let i = paragraphs.length - 1; i >= 0; i--) {
		const context = paragraphs[i];
		if (context.bodyIndex <= titleBoundary) continue;
		if (!isParagraphEmpty(context.element)) continue;
		if (context.bodyIndex === lastContentIndex) continue;

		const previous = i > 0 ? paragraphs[i - 1].element : undefined;
		if (previous && getHeadingLevel(ensureChild(previous, 'w:pPr'))) continue;

		bodyElements.splice(context.bodyIndex, 1);
	}
}

function isParagraphEmpty(paragraph: XmlElement): boolean {
	if (paragraphHasImage(paragraph)) {
		return false;
	}
	const text = getParagraphText(paragraph).trim();
	return text.length === 0;
}

function paragraphHasImage(paragraph: XmlElement): boolean {
	for (const run of paragraph.elements ?? []) {
		if (!isElement(run, 'w:r')) continue;
		for (const child of run.elements ?? []) {
			if (isElement(child, 'w:drawing') || isElement(child, 'w:pict')) {
				return true;
			}
		}
	}
	return false;
}

function findTitlePageBoundary(paragraphs: ParagraphContext[]): number {
	for (const context of paragraphs) {
		const text = getParagraphText(context.element).trim();
		if (
			/^[12][0-9]{3}\.?$/.test(text) ||
			/^\([12][0-9]{3}\)$/.test(text) ||
			/ярославль[\s,]*[12][0-9]{3}/i.test(text)
		) {
			return context.bodyIndex;
		}
	}
	return -1;
}

function getParagraphText(paragraph: XmlElement): string {
	const parts: string[] = [];
	for (const run of paragraph.elements ?? []) {
		if (!isElement(run, 'w:r')) continue;
		for (const child of run.elements ?? []) {
			if (isElement(child, 'w:t')) {
				const textNode = child.elements?.find((el) => el.type === 'text');
				if (textNode && textNode.text !== undefined) {
					parts.push(String(textNode.text));
				}
			}
		}
	}
	return parts.join('');
}

function updateSingleRunText(paragraph: XmlElement, value: string) {
	const runs = (paragraph.elements ?? []).filter((element) => isElement(element, 'w:r'));
	if (runs.length !== 1) return;
	const run = runs[0];
	const textElement = run.elements?.find((element) => isElement(element, 'w:t'));
	const textNode = textElement?.elements?.find((item) => item.type === 'text');
	if (textNode) {
		textNode.text = value;
	}
}

function setParagraphAlignment(pPr: XmlElement, alignment: 'left' | 'center' | 'both') {
	const jc = ensureChild(pPr, 'w:jc');
	jc.attributes = { ...(jc.attributes ?? {}), 'w:val': alignment };
}

function setParagraphSpacing(
	pPr: XmlElement,
	params: FormatParams,
	overrides: { before?: number; after?: number }
) {
	const spacing = ensureChild(pPr, 'w:spacing');
	const before = overrides.before ?? 0;
	const after = overrides.after ?? 0;
	spacing.attributes = {
		...(spacing.attributes ?? {}),
		'w:before': pointsToTwip(before).toString(),
		'w:after': pointsToTwip(after).toString(),
		'w:line': calculateLineSpacing(params.text.lineHeight).toString(),
		'w:lineRule': 'auto'
	};
}

function setParagraphIndent(pPr: XmlElement, indentCm: number) {
	const indent = ensureChild(pPr, 'w:ind');
	const indentTwip = cmToTwip(indentCm);
	indent.attributes = {
		...(indent.attributes ?? {}),
		'w:firstLine': indentTwip.toString(),
		'w:left': '0'
	};
}

function applyParagraphSpacing(
	element: XmlElement,
	options: { before: number; after: number; line: number }
) {
	const spacing = ensureChild(element, 'w:spacing');
	spacing.attributes = {
		...(spacing.attributes ?? {}),
		'w:before': options.before.toString(),
		'w:after': options.after.toString(),
		'w:line': options.line.toString(),
		'w:lineRule': 'auto'
	};
}

function getHeadingLevel(pPr?: XmlElement): number | null {
	if (!pPr) return null;
	const styleElement = findElement(pPr, 'w:pStyle');
	if (!styleElement?.attributes?.['w:val']) {
		return null;
	}
	const style = styleElement.attributes['w:val'].toString().toLowerCase();
	for (const [level, names] of Object.entries(headingStyles)) {
		if (names.includes(style)) {
			return Number(level);
		}
	}
	return null;
}

function findElement(root: XmlElement, name: string): XmlElement | undefined {
	return root.elements?.find((element) => isElement(element, name));
}

function ensureChild(parent: XmlElement, name: string): XmlElement {
	let child = findElement(parent, name);
	if (child) {
		return child;
	}
	child = createElement(name);
	parent.elements = [child, ...(parent.elements ?? [])];
	return child;
}

function createElement(name: string): XmlElement {
	return {
		type: 'element',
		name,
		elements: []
	};
}

function removeChild(parent: XmlElement, name: string) {
	if (!parent.elements) return;
	parent.elements = parent.elements.filter((element) => !isElement(element, name));
}

function isElement(element: XmlElement | undefined, name: string): element is XmlElement {
	return Boolean(element && element.type === 'element' && element.name === name);
}

function formatHeadingText(text: string): string {
	const normalized = text.toLowerCase();
	const match = /^(\d+[\s\.]+)(.+)$/.exec(normalized);
	const [prefix, body] = match ? [match[1], match[2]] : ['', normalized];
	const formatted = body
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
	return `${prefix}${formatted}`.trim();
}

function cmToTwip(cm: number): number {
	const inches = cm / 2.54;
	return Math.round(inches * TWIPS_PER_INCH);
}

function pointsToTwip(points: number): number {
	return Math.round(points * TWIPS_PER_POINT);
}

function calculateLineSpacing(multiplier: number): number {
	return Math.max(240, Math.round(multiplier * 240));
}
