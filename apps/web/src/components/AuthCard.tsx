import type { ReactNode } from 'react';

// Contrato de plan 004 §4.3: DESIGN.md §11.1.
export type AuthCardProps = { title: string; children: ReactNode; footer: ReactNode };

export function AuthCard(props: AuthCardProps) {
  void props;
  return null;
}
