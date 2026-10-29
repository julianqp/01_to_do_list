import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal, flushSync } from 'react-dom';
import type { LogoutHandler } from './AppHeader';
import { Spinner } from './Icon';

// RF-020–RF-023, E-10–E-12, E-14: botón de cuenta con el patrón Menu Button de APG (D-10). Un solo
// uso (AppHeader, por debajo de 768 px).
export type AccountMenuProps = { email: string; loggingOut: boolean; onLogout: LogoutHandler };

const menuItems = (panel: HTMLElement | null) => [
  ...(panel?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []),
];

export function AccountMenu({ email, loggingOut, onLogout }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const panelId = `${id}-panel`;
  const emailId = `${id}-email`;
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // RF-023, E-11: el primer carácter (no la primera unidad UTF-16), en mayúscula si es una letra.
  const initial = ([...email][0] ?? '').toLocaleUpperCase('es-ES');

  // RF-021: un pointerdown fuera del botón y del panel cierra el menú. El panel no está dentro de
  // rootRef (D-21), así que se comprueban los dos.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // E-10: al pasar a 768 px o más, la cabecera muestra el email y «Cerrar sesión» y el menú se
  // cierra. 768px = --breakpoint-md (las media queries no aceptan var()).
  useEffect(() => {
    if (!open) return;
    const desktop = matchMedia('(min-width: 768px)');
    const onChange = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener('change', onChange);
    return () => desktop.removeEventListener('change', onChange);
  }, [open]);

  // CA-2.6: al abrir (clic, Enter o Espacio), el foco pasa a la primera opción. flushSync pinta el
  // panel antes de enfocarla.
  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    flushSync(() => setOpen(true));
    menuItems(panelRef.current)[0]?.focus();
  }

  function close() {
    flushSync(() => setOpen(false));
    buttonRef.current?.focus();
  }

  // RF-013, E-12: mientras se cierra la sesión el menú sigue abierto y no acepta otra pulsación; si
  // falla, se cierra y el foco vuelve al botón (no se pierde en <body>, WCAG 2.4.3).
  function chooseLogout() {
    if (loggingOut) return;
    onLogout({ onError: close });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = menuItems(panelRef.current);
    const current = items.indexOf(document.activeElement as HTMLElement);
    switch (event.key) {
      // RF-022: las flechas recorren las opciones en bucle.
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        items[(current + step + items.length) % items.length]?.focus();
        break;
      }
      case 'Escape':
        event.preventDefault();
        close();
        break;
      // E-14: el foco vuelve al botón antes de que el navegador lo mueva, así que el Tab sigue desde
      // ahí y no cae en <body>. Sin preventDefault.
      case 'Tab':
        close();
        break;
    }
  }

  return (
    <div ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Cuenta de ${email}`}
        onClick={toggle}
        className="grid size-11 place-items-center rounded-pill border border-contrast bg-glass text-body text-1 shadow-(--shadow-pill) backdrop-glass transition duration-(--dur-fast) ease-out hover:bg-raised"
      >
        <span aria-hidden="true">{initial}</span>
      </button>
      {/* D-21: el panel va en <body>, fuera de la cabecera. Un backdrop-filter dentro de otro solo
          desenfoca lo que hay en su padre, y el título de la página se vería nítido detrás (B-1).
          Posición fija bajo el botón: la cabecera mide 69 px (py-3 + h-11 + el borde de D-22), más 8
          de separación, y por debajo de 768 px el botón está a 16 px del borde (px-4). */}
      {createPortal(
        <div
          ref={panelRef}
          id={panelId}
          hidden={!open}
          onKeyDown={handleKeyDown}
          className="fixed end-4 top-19.25 z-(--z-popover) w-72 rounded-md border border-contrast bg-raised p-1.5 shadow-(--shadow-float) backdrop-glass"
        >
          {/* El contenido solo existe abierto: el email no se repite en la página (spec 001 RF-015). */}
          {open && (
            <>
              {/* R-6: el email va fuera del role="menu" (solo admite opciones) y le da nombre. */}
              <p id={emailId} className="px-4 py-2.5 text-sm text-1 wrap-anywhere">
                {email}
              </p>
              <ul role="menu" aria-labelledby={emailId}>
                <li role="none">
                  <button
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    aria-disabled={loggingOut || undefined}
                    onClick={chooseLogout}
                    className="flex h-11 w-full items-center gap-2 rounded-pill px-4 text-body text-1 transition duration-(--dur-fast) ease-out hover:bg-raised-hover focus:bg-raised-hover"
                  >
                    {loggingOut ? (
                      <>
                        <Spinner />
                        Cerrando sesión…
                      </>
                    ) : (
                      'Cerrar sesión'
                    )}
                  </button>
                </li>
              </ul>
            </>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
