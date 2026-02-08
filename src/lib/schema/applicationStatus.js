const {
  pgTable,
  serial,
  integer,
  timestamp,
  index,
  varchar
} = require("drizzle-orm/pg-core");

const { creditApplication } = require("./creditApplication");
const { users } = require("./users");
const { statusKreditEnum } = require("./enums");

exports.applicationStatus = pgTable(
  "application_status",
  {
    id: serial("id").primaryKey(),

    applicationId: integer("application_id")
      .notNull()
      .references(() => creditApplication.id),

    status: statusKreditEnum("status").notNull(),

    catatan: varchar("catatan", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow(),

    changedBy: varchar("changed_by", { length: 36 })
      .notNull()
      .references(() => users.id)
  },
  (table) => ({
    appIdx: index("application_status_app_id_idx").on(table.applicationId),
    userIdx: index("application_status_user_id_idx").on(table.changedBy)
  })
);
