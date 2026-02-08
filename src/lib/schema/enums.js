const { pgEnum } = require("drizzle-orm/pg-core");

exports.jenisKreditEnum = pgEnum("jenis_kredit", [
  "KREDIT_PRODUKTIF",
  "MULTIGUNA",
  "KPR",
  "PENSIUN"
]);

exports.jaminanEnum = pgEnum("jaminan", [
  "SERTIFIKAT",
  "BPKB",
  "SK_PEGAWAI"
]);

exports.statusKreditEnum = pgEnum("status_kredit", [
  "DIAJUKAN",
  "DIPROSES",
  "DITERIMA",
  "DITOLAK"
]);

exports.jenisKelaminEnum = pgEnum("jenis_kelamin", ["L", "P"]);

exports.statusAkunEnum = pgEnum("status_akun", ["AKTIF", "NONAKTIF"]);
