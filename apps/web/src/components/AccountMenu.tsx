import type { LogoutHandler } from './AppHeader';

// Contrato de plan 004 §4.3: RF-020–RF-023, E-10–E-12, E-14. Un solo uso (AppHeader).
export type AccountMenuProps = { email: string; loggingOut: boolean; onLogout: LogoutHandler };

export function AccountMenu(props: AccountMenuProps) {
  void props;
  return null;
}
