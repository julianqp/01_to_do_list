-- Spec 003, D-1: orden guardado dentro de cada columna.
ALTER TABLE "Task" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- E-19: las tareas existentes conservan el orden de 002/RF-002 (la más reciente arriba).
UPDATE "Task" t SET "position" = r.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "userId", status ORDER BY "createdAt" DESC, id DESC) - 1 AS rn
  FROM "Task"
) r
WHERE t.id = r.id;

ALTER TABLE "Task" ALTER COLUMN "position" DROP DEFAULT;

DROP INDEX "Task_userId_createdAt_idx";
CREATE INDEX "Task_userId_status_position_idx" ON "Task"("userId", "status", "position");
