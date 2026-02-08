const {
  pgTable,
  serial,
  integer,
  timestamp,
  varchar,
  index
} = require("drizzle-orm/pg-core");

const { creditApplication } = require("./creditApplication");
const { statusKreditEnum } = require("./enums");

exports.applicationSla = pgTable(
  "application_sla",
  {
    id: serial("id").primaryKey(),
    applicationId: integer("application_id")
      .notNull()
      .references(() => creditApplication.id, { onDelete: "cascade" }),
    fromStatus: statusKreditEnum("from_status").notNull(),
    toStatus: statusKreditEnum("to_status").notNull(),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    catatan: varchar("catatan", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow()
  },
  (table) => ({
    appIdx: index("application_sla_app_id_idx").on(table.applicationId)
  })
);
