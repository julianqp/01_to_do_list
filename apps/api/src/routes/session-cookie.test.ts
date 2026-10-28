import { describe, expect, it } from 'vitest';
import { readCookie } from './session-cookie';

describe('readCookie', () => {
  it('D-5 encuentra sid entre varias cookies', () => {
    expect(readCookie('theme=dark; sid=AbC-123_xyz; lang=es', 'sid')).toBe('AbC-123_xyz');
  });

  it.each(['theme=dark; lang=es', 'xsid=nope; sidx=nope'])(
    'D-5 devuelve undefined si sid no está (%j)',
    (header) => {
      expect(readCookie(header, 'sid')).toBeUndefined();
    },
  );

  it('D-5 devuelve undefined si no hay cabecera Cookie', () => {
    expect(readCookie(undefined, 'sid')).toBeUndefined();
  });
});
