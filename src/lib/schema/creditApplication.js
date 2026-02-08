const {
  pgTable,
  serial,
  varchar,
  decimal,
  date,
  timestamp,
  index
} = require("drizzle-orm/pg-core");

const { users } = require("./users");
const {
  jenisKreditEnum,
  jaminanEnum
} = require("./enums");

exports.creditApplication = pgTable(
  "credit_application",
  {
    id: serial("id").primaryKey(),
    kodePengajuan: varchar("kode_pengajuan", { length: 20 }).notNull().unique(),
    nik: varchar("nik", { length: 20 }).notNull(),
    namaLengkap: varchar("nama_lengkap", { length: 150 }).notNull(),
    alamat: varchar("alamat", { length: 255 }).notNull(),
    tanggalLahir: date("tanggal_lahir").notNull(),
    email: varchar("email", { length: 150 }).notNull(),
    jenisKredit: jenisKreditEnum("jenis_kredit").notNull(),
    plafond: decimal("plafond", { precision: 15, scale: 2 }).notNull(),
    jaminan: jaminanEnum("jaminan").notNull(),
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
