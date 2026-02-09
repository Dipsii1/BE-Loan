const { mysqlEnum } = require('drizzle-orm/mysql-core');

const jenisKreditEnum = mysqlEnum("jenis_kredit", [
  "KREDIT_PRODUKTIF",
  "MULTIGUNA",
  "KPR",
  "PENSIUN"
]);

const jaminanEnum = mysqlEnum("jaminan", [
  "SERTIFIKAT",
  "BPKB",
  "SK_PEGAWAI"
]);

const statusKreditEnum = mysqlEnum("status_kredit", [
  "DIAJUKAN",
  "DIPROSES",
  "DITERIMA",
  "DITOLAK"
]);

const jenisKelaminEnum = mysqlEnum("jenis_kelamin", ["L", "P"]);

const statusAkunEnum = mysqlEnum("status_akun", ["AKTIF", "NONAKTIF"]);

module.exports = {
  jenisKreditEnum,
  jaminanEnum,
  statusKreditEnum,
  jenisKelaminEnum,
  statusAkunEnum
};