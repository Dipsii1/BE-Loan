CREATE TABLE `application_sla` (
	`id` int AUTO_INCREMENT NOT NULL,
	`application_id` int NOT NULL,
	`status_kredit` enum('DIAJUKAN','DIPROSES','DITERIMA','DITOLAK') NOT NULL,
	`start_time` timestamp NOT NULL,
	`end_time` timestamp NOT NULL,
	`duration_minutes` int NOT NULL,
	`catatan` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `application_sla_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `application_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`application_id` int NOT NULL,
	`status_kredit` enum('DIAJUKAN','DIPROSES','DITERIMA','DITOLAK') NOT NULL,
	`catatan` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`changed_by` varchar(36) NOT NULL,
	CONSTRAINT `application_status_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_application` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kode_pengajuan` varchar(20) NOT NULL,
	`nik` varchar(20) NOT NULL,
	`nama_lengkap` varchar(150) NOT NULL,
	`alamat` varchar(255) NOT NULL,
	`tanggal_lahir` date NOT NULL,
	`email` varchar(150) NOT NULL,
	`jenis_kredit` enum('KREDIT_PRODUKTIF','MULTIGUNA','KPR','PENSIUN') NOT NULL,
	`plafond` decimal(15,2) NOT NULL,
	`jaminan` enum('SERTIFIKAT','BPKB','SK_PEGAWAI') NOT NULL,
	`tempat_lahir` varchar(100) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `credit_application_id` PRIMARY KEY(`id`),
	CONSTRAINT `credit_application_kode_pengajuan_unique` UNIQUE(`kode_pengajuan`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nama_role` varchar(50) NOT NULL,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_nama_role_unique` UNIQUE(`nama_role`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(150) NOT NULL,
	`password` varchar(255) NOT NULL,
	`no_phone` varchar(25),
	`agent_code` varchar(50),
	`nasabah_code` varchar(50),
	`role_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_agent_code_unique` UNIQUE(`agent_code`),
	CONSTRAINT `users_nasabah_code_unique` UNIQUE(`nasabah_code`)
);
--> statement-breakpoint
ALTER TABLE `application_sla` ADD CONSTRAINT `application_sla_application_id_credit_application_id_fk` FOREIGN KEY (`application_id`) REFERENCES `credit_application`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `application_status` ADD CONSTRAINT `application_status_application_id_credit_application_id_fk` FOREIGN KEY (`application_id`) REFERENCES `credit_application`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `application_status` ADD CONSTRAINT `application_status_changed_by_users_id_fk` FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `credit_application` ADD CONSTRAINT `credit_application_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `application_sla_app_id_idx` ON `application_sla` (`application_id`);--> statement-breakpoint
CREATE INDEX `application_status_app_id_idx` ON `application_status` (`application_id`);--> statement-breakpoint
CREATE INDEX `application_status_user_id_idx` ON `application_status` (`changed_by`);--> statement-breakpoint
CREATE INDEX `credit_application_user_id_idx` ON `credit_application` (`user_id`);--> statement-breakpoint
CREATE INDEX `users_role_id_idx` ON `users` (`role_id`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);