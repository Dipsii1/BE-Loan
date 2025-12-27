-- CreateEnum
CREATE TYPE "JenisKredit" AS ENUM ('KREDIT_PRODUKTIF', 'MULTIGUNA', 'KPR', 'PENSIUN');

-- CreateEnum
CREATE TYPE "Jaminan" AS ENUM ('SERTIFIKAT', 'BPKB', 'SK_PEGAWAI');

-- CreateEnum
CREATE TYPE "StatusKredit" AS ENUM ('DIAJUKAN', 'DIPROSES', 'DITERIMA', 'DITOLAK');

-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('L', 'P');

-- CreateEnum
CREATE TYPE "StatusAkun" AS ENUM ('AKTIF', 'NONAKTIF');

-- CreateEnum
CREATE TYPE "ChangedRole" AS ENUM ('ADMIN');

-- CreateTable
CREATE TABLE "role" (
    "id" SERIAL NOT NULL,
    "nama_role" VARCHAR(50) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "no_phone" VARCHAR(25) NOT NULL,
    "id_role" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_application" (
    "id" SERIAL NOT NULL,
    "kode_pengajuan" VARCHAR(20) NOT NULL,
    "nik" VARCHAR(20) NOT NULL,
    "nama_lengkap" VARCHAR(150) NOT NULL,
    "alamat" TEXT NOT NULL,
    "tanggal_lahir" DATE NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "jenis_kredit" "JenisKredit" NOT NULL,
    "plafond" DECIMAL(15,2) NOT NULL,
    "jaminan" "Jaminan" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "status" "StatusKredit" NOT NULL,
    "changed_by" INTEGER NOT NULL,
    "changed_role" "ChangedRole" NOT NULL,
    "catatan" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "nik" VARCHAR(20),
    "nama_lengkap" VARCHAR(150) NOT NULL,
    "tempat_lahir" VARCHAR(100),
    "tanggal_lahir" DATE,
    "jenis_kelamin" "JenisKelamin",
    "alamat" TEXT,
    "kota" VARCHAR(100),
    "provinsi" VARCHAR(100),
    "kode_pos" VARCHAR(10),
    "foto_profil" VARCHAR(255),
    "status_akun" "StatusAkun" NOT NULL DEFAULT 'AKTIF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "credit_application_kode_pengajuan_key" ON "credit_application"("kode_pengajuan");

-- CreateIndex
CREATE INDEX "credit_application_kode_pengajuan_idx" ON "credit_application"("kode_pengajuan");

-- CreateIndex
CREATE INDEX "application_status_application_id_idx" ON "application_status"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_user_id_key" ON "profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_nik_key" ON "profile"("nik");

-- CreateIndex
CREATE INDEX "profile_user_id_idx" ON "profile"("user_id");

-- CreateIndex
CREATE INDEX "profile_nik_idx" ON "profile"("nik");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status" ADD CONSTRAINT "application_status_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "credit_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status" ADD CONSTRAINT "application_status_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
