/*
  Warnings:

  - You are about to drop the column `changed_at` on the `application_status` table. All the data in the column will be lost.
  - You are about to drop the column `changed_role` on the `application_status` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `application_status` table. All the data in the column will be lost.
  - You are about to drop the `profile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `changed_by` on the `application_status` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `profile_id` to the `credit_application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `credit_application` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "application_status" DROP CONSTRAINT "application_status_application_id_fkey";

-- DropForeignKey
ALTER TABLE "application_status" DROP CONSTRAINT "application_status_changed_by_fkey";

-- DropForeignKey
ALTER TABLE "profile" DROP CONSTRAINT "profile_user_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_id_role_fkey";

-- DropIndex
DROP INDEX "application_status_application_id_idx";

-- AlterTable
ALTER TABLE "application_status" DROP COLUMN "changed_at",
DROP COLUMN "changed_role",
DROP COLUMN "updated_at",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "changed_by",
ADD COLUMN     "changed_by" UUID NOT NULL;

-- AlterTable
ALTER TABLE "credit_application" ADD COLUMN     "profile_id" UUID NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "profile";

-- DropTable
DROP TABLE "role";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "ChangedRole";

-- CreateTable
CREATE TABLE "roles" (
    "id" INTEGER NOT NULL,
    "nama_role" VARCHAR(50) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" TEXT NOT NULL,
    "no_phone" VARCHAR(25),
    "role_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nama_role_key" ON "roles"("nama_role");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "profiles_role_id_idx" ON "profiles"("role_id");

-- CreateIndex
CREATE INDEX "credit_application_nik_idx" ON "credit_application"("nik");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_application" ADD CONSTRAINT "credit_application_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status" ADD CONSTRAINT "application_status_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "credit_application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status" ADD CONSTRAINT "application_status_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
