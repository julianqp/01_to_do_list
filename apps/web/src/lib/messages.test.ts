import { expect, it } from 'vitest';
import { messageFor } from './messages';

it('RF-004 cada aviso del formulario lleva el tono de su alerta', () => {
  expect(messageFor('INVALID_CREDENTIALS').tone).toBe('error');
  expect(messageFor('SESSION_EXPIRED').tone).toBe('info');
  expect(messageFor('NETWORK_ERROR').tone).toBe('offline');
});

it('RF-019 los textos de los avisos son los de la spec 001', () => {
  expect(messageFor('INVALID_CREDENTIALS').text).toBe('Email o contraseña incorrectos');
  expect(messageFor('SESSION_EXPIRED').text).toBe('Tu sesión ha caducado. Vuelve a iniciar sesión');
  expect(messageFor('EMAIL_ALREADY_REGISTERED').text).toBe('Ya existe una cuenta con ese email');
  expect(messageFor('NETWORK_ERROR').text).toBe('No se ha podido conectar. Inténtalo de nuevo');
  expect(messageFor('INTERNAL_ERROR').text).toBe('No se ha podido conectar. Inténtalo de nuevo');
});
