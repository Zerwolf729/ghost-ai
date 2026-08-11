-- CreateTable
CREATE TABLE "TaskRun" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSpec" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectSpec_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskRun_runId_key" ON "TaskRun"("runId");

-- CreateIndex
CREATE INDEX "TaskRun_runId_idx" ON "TaskRun"("runId");

-- CreateIndex
CREATE INDEX "TaskRun_userId_projectId_idx" ON "TaskRun"("userId", "projectId");

-- CreateIndex
CREATE INDEX "ProjectSpec_projectId_idx" ON "ProjectSpec"("projectId");

-- AddForeignKey
ALTER TABLE "TaskRun" ADD CONSTRAINT "TaskRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSpec" ADD CONSTRAINT "ProjectSpec_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
