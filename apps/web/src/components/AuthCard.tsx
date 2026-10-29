import type { ReactNode } from 'react';

// DESIGN.md §11.1: tarjeta glass centrada sobre el lienzo, de 420 px como máximo. Por debajo de
// 452 px mide el ancho menos 16 px por lado, sin media query (RF-002). El título es su primer hijo.
export type AuthCardProps = { title: string; children: ReactNode; footer: ReactNode };

export function AuthCard({ title, children, footer }: AuthCardProps) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="flex w-full max-w-105 flex-col gap-6 rounded-xl border border-contrast bg-glass p-7 shadow-(--shadow-glass) backdrop-glass max-md:p-5">
        <h1 className="text-h1 text-balance">{title}</h1>
        {children}
        <p className="text-2">{footer}</p>
      </div>
    </main>
  );
}
