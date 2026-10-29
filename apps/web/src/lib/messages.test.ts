import { expect, it } from 'vitest';
import { messageFor } from './messages';

it('RF-004 cada aviso del formulario lleva el tono de su alerta', () => {
  expect(messageFor('INVALID_CREDENTIALS').tone).toBe('error');
  expect(messageFor('SESSION_EXPIRED').tone).toBe('info');
  expect(messageFor('NETWORK_ERROR').tone).toBe('offline');
});
