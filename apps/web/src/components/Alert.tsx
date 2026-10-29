// Contrato de plan 004 §4.3: DESIGN.md §14 Alert. Solo aspecto: el rol lo pone la zona que la
// contiene (D-14).
// error → --rose-soft + CircleAlert · offline → --amber-soft + TriangleAlert · info → --lilac-soft + Info
export type AlertTone = 'error' | 'offline' | 'info';

export type AlertProps = { tone: AlertTone; children: string };

export function Alert(props: AlertProps) {
  void props;
  return null;
}
