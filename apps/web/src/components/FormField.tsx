import type { ReactNode } from 'react';

export type FormFieldProps = {
  id: string;
  label: string;
  type: 'email' | 'password';
  // D-12.
  autoComplete: 'email' | 'new-password' | 'current-password';
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export const FormField: (props: FormFieldProps) => ReactNode = () => null;
