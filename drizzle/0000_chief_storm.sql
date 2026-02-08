CREATE TYPE "public"."jenis_kredit" AS ENUM('KREDIT_PRODUKTIF', 'MULTIGUNA', 'KPR', 'PENSIUN');--> statement-breakpoint
CREATE TYPE "public"."jaminan" AS ENUM('SERTIFIKAT', 'BPKB', 'SK_PEGAWAI');--> statement-breakpoint
CREATE TYPE "public"."status_kredit" AS ENUM('DIAJUKAN', 'DIPROSES', 'DITERIMA', 'DITOLAK');--> statement-breakpoint
CREATE TYPE "public"."jenis_kelamin" AS ENUM('L', 'P');--> statement-breakpoint
CREATE TYPE "public"."status_akun" AS ENUM('AKTIF', 'NONAKTIF');--> statement-breakpoint
CREATE TABLE "application_sla" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"from_status" "status_kredit" NOT NULL,
	"to_status" "status_kredit" NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"duration_minutes" integer NOT NULL,
	"catatan" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "application_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"status" "status_kredit" NOT NULL,
	"catatan" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"changed_by" varchar(36) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_application" (
	"id" serial PRIMARY KEY NOT NULL,
	"kode_pengajuan" varchar(20) NOT NULL,
	"nik" varchar(20) NOT NULL,
	"nama_lengkap" varchar(150) NOT NULL,
	"alamat" varchar(255) NOT NULL,
	"tanggal_lahir" date NOT NULL,
	"email" varchar(150) NOT NULL,
	"jenis_kredit" "jenis_kredit" NOT NULL,
	"plafond" numeric(15, 2) NOT NULL,
	"jaminan" "jaminan" NOT NULL,
	"tempat_lahir" varchar(100) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "credit_application_kode_pengajuan_unique" UNIQUE("kode_pengajuan")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_role" varchar(50) NOT NULL,
	CONSTRAINT "roles_nama_role_unique" UNIQUE("nama_role")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(150) NOT NULL,
	"password" varchar(255) NOT NULL,
	"no_phone" varchar(25),
	"agent_code" varchar(50),
	"nasabah_code" varchar(50),
	"role_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_agent_code_unique" UNIQUE("agent_code"),
	CONSTRAINT "users_nasabah_code_unique" UNIQUE("nasabah_code")
);
--> statement-breakpoint
ALTER TABLE "application_sla" ADD CONSTRAINT "application_sla_application_id_credit_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."credit_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_status" ADD CONSTRAINT "application_status_application_id_credit_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."credit_application"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_status" ADD CONSTRAINT "application_status_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_application" ADD CONSTRAINT "credit_application_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "application_sla_app_id_idx" ON "application_sla" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "application_status_app_id_idx" ON "application_status" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "application_status_user_id_idx" ON "application_status" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "credit_application_user_id_idx" ON "credit_application" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_role_id_idx" ON "users" USING btree ("role_id");