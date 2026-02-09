import {
  mysqlTable,
  int,
  varchar,
  decimal,
  date,
  timestamp,
  index
} from 'drizzle-orm/mysql-core';

import { users } from './users.js';
import { jenisKreditEnum, jaminanEnum } from './enums.js';

export const creditApplication = mysqlTable(
  "credit_application",
  {
    id: int("id").primaryKey().autoincrement(),
    kodePengajuan: varchar("kode_pengajuan", { length: 20 }).notNull().unique(),
    nik: varchar("nik", { length: 20 }).notNull(),
    namaLengkap: varchar("nama_lengkap", { length: 150 }).notNull(),
    alamat: varchar("alamat", { length: 255 }).notNull(),
    tanggalLahir: date("tanggal_lahir").notNull(),
    email: varchar("email", { length: 150 }).notNull(),
    jenisKredit: jenisKreditEnum.notNull(),
    plafond: decimal("plafond", { precision: 15, scale: 2 }).notNull(),
    jaminan: jaminanEnum.notNull(),
    tempatLahir: varchar("tempat_lahir", { length: 100 }).notNull(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
  },
  (table) => ({
    userIdx: index("credit_application_user_id_idx").on(table.userId)
  })
);