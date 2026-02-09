const { mysqlTable, int, varchar } = require('drizzle-orm/mysql-core');

const roles = mysqlTable("roles", {
  id: int("id").primaryKey().autoincrement(),
  namaRole: varchar("nama_role", { length: 50 }).notNull().unique()
});

module.exports = { roles };
