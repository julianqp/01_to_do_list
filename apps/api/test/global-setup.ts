import { execFileSync } from 'node:child_process';
import { connect } from 'node:net';
import type { TestProject } from 'vitest/node';

function canConnect(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ host, port, timeout: 2000 });
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
    socket.once('timeout', () => done(false));
  });
}

export default async function setup(project: TestProject) {
  const databaseUrl = project.config.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('Falta DATABASE_URL en la configuración de Vitest');

  const { hostname, port } = new URL(databaseUrl);
  if (!(await canConnect(hostname, Number(port || 5432)))) {
    const message = `Postgres no responde en ${hostname}:${port || 5432}. Ejecuta \`pnpm db:up\``;
    // Vitest 5.0.5 pierde el mensaje de los errores de globalSetup al formatear la traza; se escribe antes.
    console.error(`\n${message}\n`);
    throw new Error(message);
  }

  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    cwd: project.config.root,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });
}
