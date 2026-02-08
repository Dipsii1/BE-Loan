const { pgTable, serial, varchar } = require("drizzle-orm/pg-core");

exports.roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  namaRole: varchar("nama_role", { length: 50 }).notNull().unique()
});
