/**
 * 轻量 markdown 解析器：只产出 token 模型，不生成 HTML 字符串。
 * 目标场景是流式输出：输入经常是半截的（未闭合围栏、半张表），
 * 因此所有构造在解析失败或无闭合标记时都退回段落文本，绝不抛错。
 */

export interface MdInline {
  kind: 'text' | 'strong' | 'em' | 'code' | 'link';
  text: string;
  href?: string;
}

export type MdHeadingLevel = 1 | 2 | 3;

export type MdBlock =
  | { kind: 'heading'; level: MdHeadingLevel; inlines: MdInline[] }
  | { kind: 'paragraph'; inlines: MdInline[] }
  | { kind: 'list'; ordered: boolean; items: MdInline[][] }
  | { kind: 'code'; lang: string; code: string }
  | { kind: 'quote'; inlines: MdInline[] }
  | { kind: 'table'; head: MdInline[][]; rows: MdInline[][][] }
  | { kind: 'hr' };

const FENCE_RE = /^(`{3,}|~{3,})(.*)$/;
const CLOSE_FENCE_RE = /^(`{3,}|~{3,})$/;
const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const HR_RE = /^([-*_])(?:\s*\1){2,}$/;
const QUOTE_RE = /^>\s?/;
const ITEM_RE = /^([-*+]|\d{1,9}[.)])\s+(.*)$/;

function isSpace(ch: string | undefined): boolean {
  return ch === undefined || ch === '' || /\s/.test(ch);
}

function isWord(ch: string | undefined): boolean {
  return ch !== undefined && ch !== '' && /[\w\u4e00-\u9fff]/.test(ch);
}

/** 强调标记不能在单词中间打开（避免 snake_case 被当成斜体）。 */
function canOpen(src: string, index: number, marker: string): boolean {
  const prev = src[index - 1];
  const next = src[index + marker.length];
  if (next === undefined || isSpace(next)) return false;
  if (marker === '_' && isWord(prev)) return false;
  return true;
}

function findCloser(src: string, marker: string, from: number): number {
  let index = from;
  while (index < src.length) {
    const hit = src.indexOf(marker, index);
    if (hit === -1) return -1;
    if (marker === '*' && src[hit + 1] === '*') {
      index = hit + 2;
      continue;
    }
    if (isSpace(src[hit - 1])) {
      index = hit + marker.length;
      continue;
    }
    return hit;
  }
  return -1;
}

export function parseInline(src: string): MdInline[] {
  const out: MdInline[] = [];
  if (!src) return out;
  let buffer = '';
  const flush = (): void => {
    if (buffer) {
      out.push({ kind: 'text', text: buffer });
      buffer = '';
    }
  };

  let i = 0;
  while (i < src.length) {
    const ch = src[i] ?? '';

    if (ch === '`') {
      const end = src.indexOf('`', i + 1);
      if (end === -1) {
        buffer += src.slice(i);
        break;
      }
      flush();
      out.push({ kind: 'code', text: src.slice(i + 1, end) });
      i = end + 1;
      continue;
    }

    if (ch === '*' && src[i + 1] === '*') {
      if (!canOpen(src, i, '**')) {
        buffer += ch;
        i += 1;
        continue;
      }
      const end = findCloser(src, '**', i + 2);
      if (end === -1) {
        buffer += ch;
        i += 1;
        continue;
      }
      flush();
      out.push({ kind: 'strong', text: src.slice(i + 2, end) });
      i = end + 2;
      continue;
    }

    if (ch === '*' || ch === '_') {
      if (!canOpen(src, i, ch)) {
        buffer += ch;
        i += 1;
        continue;
      }
      const end = findCloser(src, ch, i + 1);
      if (end === -1) {
        buffer += ch;
        i += 1;
        continue;
      }
      flush();
      out.push({ kind: 'em', text: src.slice(i + 1, end) });
      i = end + 1;
      continue;
    }

    if (ch === '[') {
      const label = src.indexOf('](', i + 1);
      const close = label === -1 ? -1 : src.indexOf(')', label + 2);
      if (label !== -1 && close !== -1) {
        const text = src.slice(i + 1, label);
        const href = src.slice(label + 2, close).trim();
        if (text && href) {
          flush();
          out.push({ kind: 'link', text, href });
          i = close + 1;
          continue;
        }
      }
      buffer += ch;
      i += 1;
      continue;
    }

    buffer += ch;
    i += 1;
  }

  flush();
  return out;
}

function splitRow(line: string): string[] {
  let body = line.trim();
  if (body.startsWith('|')) body = body.slice(1);
  if (body.endsWith('|')) body = body.slice(0, -1);
  return body.split('|').map((cell) => cell.trim());
}

function isTableSeparator(line: string | undefined): boolean {
  if (line === undefined) return false;
  const trimmed = line.trim();
  if (!trimmed || !trimmed.includes('-') || !/^[|\s:-]+$/.test(trimmed)) return false;
  const cells = splitRow(trimmed);
  return cells.length > 0 && cells.every((cell) => /^:?-{1,}:?$/.test(cell));
}

function isHr(trimmed: string): boolean {
  return HR_RE.test(trimmed);
}

function isListStart(trimmed: string): boolean {
  return ITEM_RE.test(trimmed);
}

function isBlockStart(lines: string[], index: number): boolean {
  const trimmed = (lines[index] ?? '').trim();
  if (!trimmed) return true;
  if (FENCE_RE.test(trimmed)) return true;
  if (HEADING_RE.test(trimmed)) return true;
  if (isHr(trimmed)) return true;
  if (QUOTE_RE.test(trimmed)) return true;
  if (isListStart(trimmed)) return true;
  if (trimmed.includes('|') && isTableSeparator(lines[index + 1])) return true;
  return false;
}

function indentOf(line: string): number {
  const match = /^[ \t]*/.exec(line);
  return match ? (match[0] ?? '').replace(/\t/g, '  ').length : 0;
}

/**
 * 解析 markdown 为块列表。对不完整输入返回尽量合理的结果：
 * 未闭合的围栏会输出到文末的代码块，半张表会输出已出现的行。
 */
export function parseMarkdown(src: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  if (!src) return blocks;
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i] ?? '';
    const line = raw.trim();
    if (!line) {
      i += 1;
      continue;
    }

    const fence = FENCE_RE.exec(line);
    if (fence) {
      const marker = fence[1] ?? '```';
      const rest = (fence[2] ?? '').trim();
      const lang = rest.split(/\s+/)[0] ?? '';
      const body: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const current = (lines[j] ?? '').trim();
        if (CLOSE_FENCE_RE.test(current)) {
          j += 1;
          break;
        }
        body.push(lines[j] ?? '');
        j += 1;
      }
      blocks.push({ kind: 'code', lang: lang.replace(/^`+|`+$/g, ''), code: body.join('\n') });
      i = j;
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      const hashes = heading[1] ?? '#';
      const level = Math.min(3, hashes.length) as MdHeadingLevel;
      const text = (heading[2] ?? '').replace(/\s+#+\s*$/, '');
      blocks.push({ kind: 'heading', level, inlines: parseInline(text) });
      i += 1;
      continue;
    }

    if (isHr(line)) {
      blocks.push({ kind: 'hr' });
      i += 1;
      continue;
    }

    if (line.includes('|') && isTableSeparator(lines[i + 1])) {
      const head = splitRow(line).map(parseInline);
      const rows: MdInline[][][] = [];
      let j = i + 2;
      while (j < lines.length) {
        const current = (lines[j] ?? '').trim();
        if (!current || !current.includes('|')) break;
        if (FENCE_RE.test(current) || HEADING_RE.test(current) || isHr(current)) break;
        const cells = splitRow(current);
        const row: MdInline[][] = [];
        for (let c = 0; c < head.length; c += 1) row.push(parseInline(cells[c] ?? ''));
        rows.push(row);
        j += 1;
      }
      blocks.push({ kind: 'table', head, rows });
      i = j;
      continue;
    }

    if (QUOTE_RE.test(line)) {
      const body: string[] = [];
      let j = i;
      while (j < lines.length) {
        const current = (lines[j] ?? '').trim();
        if (!QUOTE_RE.test(current)) break;
        body.push(current.replace(QUOTE_RE, ''));
        j += 1;
      }
      blocks.push({ kind: 'quote', inlines: parseInline(body.join('\n')) });
      i = j;
      continue;
    }

    const item = ITEM_RE.exec(line);
    if (item) {
      const ordered = /^\d/.test(item[1] ?? '');
      const baseIndent = indentOf(raw);
      const items: MdInline[][] = [];
      let j = i;
      while (j < lines.length) {
        const current = lines[j] ?? '';
        const trimmed = current.trim();
        if (!trimmed) break;
        const next = ITEM_RE.exec(trimmed);
        if (next) {
          if (/^\d/.test(next[1] ?? '') !== ordered) break;
          items.push(parseInline(next[2] ?? ''));
          j += 1;
          continue;
        }
        // 更深缩进的续行并入上一项（只展开一层，避免嵌套结构复杂化）
        if (items.length > 0 && indentOf(current) > baseIndent && !isBlockStart(lines, j)) {
          const lastIndex = items.length - 1;
          const last = items[lastIndex] ?? [];
          items[lastIndex] = [...last, { kind: 'text', text: ' ' }, ...parseInline(trimmed)];
          j += 1;
          continue;
        }
        break;
      }
      blocks.push({ kind: 'list', ordered, items });
      i = j;
      continue;
    }

    const body: string[] = [];
    let j = i;
    while (j < lines.length) {
      const current = lines[j] ?? '';
      const trimmed = current.trim();
      if (!trimmed) break;
      if (j > i && isBlockStart(lines, j)) break;
      body.push(trimmed);
      j += 1;
    }
    blocks.push({ kind: 'paragraph', inlines: parseInline(body.join('\n')) });
    i = j;
  }

  return blocks;
}
