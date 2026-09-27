import { describe, it, expect } from 'vitest';
import { parseParams, serializeParams, DEFAULTS } from './useDirectoryParams';

describe('parseParams', () => {
  it('returns defaults for an empty query string', () => {
    expect(parseParams(new URLSearchParams(''))).toEqual(DEFAULTS);
  });

  it('parses a fully populated query string', () => {
    const sp = new URLSearchParams(
      'q=an&nationalities=French,German&hobbies=Chess,Reading&sort=age&dir=desc',
    );
    expect(parseParams(sp)).toEqual({
      q: 'an',
      nationalities: ['French', 'German'],
      hobbies: ['Chess', 'Reading'],
      sort: 'age',
      dir: 'desc',
    });
  });

  it('trims surrounding whitespace in q', () => {
    expect(parseParams(new URLSearchParams('q=  smith  ')).q).toBe('smith');
    expect(parseParams(new URLSearchParams('q=   ')).q).toBe('');
  });

  it('falls back to defaults on invalid sort/dir', () => {
    const sp = new URLSearchParams('sort=email&dir=sideways');
    const p = parseParams(sp);
    expect(p.sort).toBe('first_name');
    expect(p.dir).toBe('asc');
  });
});

describe('serializeParams', () => {
  it('omits default values', () => {
    expect(serializeParams(DEFAULTS).toString()).toBe('');
  });

  it('round-trips through parseParams', () => {
    const p = {
      q: 'smith',
      nationalities: ['French'],
      hobbies: ['Chess', 'Reading'],
      sort: 'age' as const,
      dir: 'desc' as const,
    };
    expect(parseParams(serializeParams(p))).toEqual(p);
  });
});
