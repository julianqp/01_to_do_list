// Contrato de plan 004 §4.3: DESIGN.md §3.2. Un solo uso (PrivateArea).
export type LogoutHandler = (callbacks?: { onError?: () => void }) => void;

export type AppHeaderProps = { email: string; loggingOut: boolean; onLogout: LogoutHandler };

export function AppHeader(props: AppHeaderProps) {
  void props;
  return null;
}
