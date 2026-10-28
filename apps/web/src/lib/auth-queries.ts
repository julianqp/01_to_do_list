import type { LoginInput, PublicUser, SignupInput } from '@todo/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch } from './api';

type UserResponse = { user: PublicUser };

// Todas las navegaciones con location.replace: no dejan entradas en el historial (plan §4.1).
const goToPrivateArea = () => location.replace('/');
const goToLogin = () => location.replace('/login');

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<UserResponse>('/api/auth/me').then(({ user }) => user),
  });
}

// RF-002: al crear la cuenta ya hay sesión.
export function useSignup() {
  return useMutation({
    mutationFn: (input: SignupInput) =>
      apiFetch<UserResponse>('/api/auth/signup', { method: 'POST', body: input }),
    onSuccess: goToPrivateArea,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiFetch<UserResponse>('/api/auth/login', { method: 'POST', body: input }),
    onSuccess: goToPrivateArea,
  });
}

// RF-011. Si falla, la zona privada se queda donde está (D-11).
export function useLogout() {
  return useMutation({
    mutationFn: () => apiFetch<void>('/api/auth/logout', { method: 'POST' }),
    onSuccess: goToLogin,
  });
}
