/*
  Warnings:

  - You are about to alter the column `value` on the `deals` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.

*/
-- AlterTable
ALTER TABLE "deals" ALTER COLUMN "value" SET DATA TYPE DECIMAL(15,2);

-- CreateIndex
CREATE INDEX "customers_ownerId_deletedAt_idx" ON "customers"("ownerId", "deletedAt");

-- CreateIndex
CREATE INDEX "customers_ownerId_status_idx" ON "customers"("ownerId", "status");

-- CreateIndex
CREATE INDEX "deals_ownerId_deletedAt_idx" ON "deals"("ownerId", "deletedAt");

-- CreateIndex
CREATE INDEX "deals_ownerId_stage_idx" ON "deals"("ownerId", "stage");

-- CreateIndex
CREATE INDEX "email_logs_dealId_idx" ON "email_logs"("dealId");

-- CreateIndex
CREATE INDEX "notes_taskId_idx" ON "notes"("taskId");

-- CreateIndex
CREATE INDEX "tasks_assignedToId_deletedAt_idx" ON "tasks"("assignedToId", "deletedAt");

-- CreateIndex
CREATE INDEX "tasks_assignedToId_status_idx" ON "tasks"("assignedToId", "status");
