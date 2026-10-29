import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// Plan 004 D-3, ADR-0003 (RNF-006 a, RF-014, RNF-005): fuera de tokens.css no hay valores sueltos.
// Las pantallas solo usan los tokens del catálogo.

const SRC = import.meta.dirname;

const files = [
  ...readdirSync(SRC, { recursive: true, encoding: 'utf8' }).filter(
    (file) => /\.(tsx|astro)$/.test(file) && !/\.test\./.test(file),
  ),
  join('styles', 'global.css'),
];

const defined = new Set(
  [...readFileSync(join(SRC, 'styles', 'tokens.css'), 'utf8').matchAll(/(--[\w-]+)\s*:/g)].map(
    ([, name]) => name!,
  ),
);

type Rule = { name: string; find: (line: string) => string[] };

const matches = (pattern: RegExp) => (line: string) =>
  [...line.matchAll(pattern)].map(([match]) => match);

const RULES: Rule[] = [
  { name: 'color literal', find: matches(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/gi) },
  { name: 'valor entre corchetes', find: matches(/-\[/g) },
  { name: 'estilo en línea', find: matches(/\bstyle=/g) },
  { name: 'capa o tiempo con número', find: matches(/\b(?:z|duration|delay)-\d+/g) },
  {
    name: 'transformación sin motion-safe:',
    find: (line) =>
      matches(/[\w:-]*\b(?:scale|translate|rotate)-[\w./()-]+/g)(line).filter(
        (match) => !match.includes('motion-safe:'),
      ),
  },
  {
    name: 'token que no existe en tokens.css',
    find: (line) =>
      [...line.matchAll(/\((?:[\w-]+:)?(--[\w-]+)\)/g)]
        .map(([, name]) => name!)
        .filter((name) => !defined.has(name)),
  },
];

function violationsIn(path: string, source: string) {
  return source
    .split('\n')
    .flatMap((line, index) =>
      RULES.flatMap(({ name, find }) =>
        find(line).map((match) => `${path}:${index + 1} ${name}: ${match}`),
      ),
    );
}

describe('reglas del catálogo', () => {
  it('RNF-006 D-3 revisa los componentes, las páginas, el layout y global.css', () => {
    expect(files).toEqual(
      expect.arrayContaining([
        join('components', 'Button.tsx'),
        join('layouts', 'Layout.astro'),
        join('pages', 'index.astro'),
        join('styles', 'global.css'),
      ]),
    );
    expect(files.some((file) => file.includes('.test.'))).toBe(false);
  });

  it('RNF-006 RF-014 RNF-005 D-3 ningún valor fuera del catálogo', () => {
    const violations = files.flatMap((file) =>
      violationsIn(relative(SRC, join(SRC, file)), readFileSync(join(SRC, file), 'utf8')),
    );
    expect(violations).toEqual([]);
  });
});
