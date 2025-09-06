-- CreateEnum
CREATE TYPE "public"."Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."images" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "processedPath" TEXT,
    "thumbnailPath" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "width" INTEGER,
    "height" INTEGER,
    "gpsLatitude" DOUBLE PRECISION,
    "gpsLongitude" DOUBLE PRECISION,
    "capturedAt" TIMESTAMP(3),
    "processingStatus" "public"."ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "processingError" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."diseases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scientificName" TEXT,
    "description" TEXT,
    "symptoms" TEXT[],
    "causes" TEXT[],
    "treatment" TEXT,
    "prevention" TEXT,
    "severity" "public"."Severity" NOT NULL DEFAULT 'MEDIUM',
    "crops" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diseases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."predictions" (
    "id" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "isHealthy" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "boundingBox" JSONB,
    "affectedArea" DOUBLE PRECISION,
    "modelVersion" TEXT,
    "processingTime" DOUBLE PRECISION,
    "imageId" TEXT NOT NULL,
    "diseaseId" TEXT,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."disease_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "diseaseId" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "cropType" TEXT,
    "severity" "public"."Severity" NOT NULL,
    "weatherData" JSONB,

    CONSTRAINT "disease_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "images_filename_key" ON "public"."images"("filename");

-- CreateIndex
CREATE UNIQUE INDEX "diseases_name_key" ON "public"."diseases"("name");

-- AddForeignKey
ALTER TABLE "public"."images" ADD CONSTRAINT "images_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."predictions" ADD CONSTRAINT "predictions_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "public"."images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."predictions" ADD CONSTRAINT "predictions_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "public"."diseases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."disease_history" ADD CONSTRAINT "disease_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."disease_history" ADD CONSTRAINT "disease_history_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "public"."diseases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
