-- CreateTable
CREATE TABLE "shared_files" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "description" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shared_files_teacherId_idx" ON "shared_files"("teacherId");

-- CreateIndex
CREATE INDEX "shared_files_uploadedAt_idx" ON "shared_files"("uploadedAt");

-- AddForeignKey
ALTER TABLE "shared_files" ADD CONSTRAINT "shared_files_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
