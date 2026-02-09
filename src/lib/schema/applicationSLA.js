import {
  mysqlTable,
  int,
  timestamp,
  varchar,
  index
} from 'drizzle-orm/mysql-core';

import { creditApplication } from './creditApplication.js';
import { statusKreditEnum } from './enums.js';

export const applicationSla = mysqlTable(
  "application_sla",
  {
    id: int("id").primaryKey().autoincrement(),
    applicationId: int("application_id")
      .notNull()
      .references(() => creditApplication.id, { onDelete: "cascade" }),
    fromStatus: statusKreditEnum.notNull(),
    toStatus: statusKreditEnum.notNull(),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    durationMinutes: int("duration_minutes").notNull(),
    catatan: varchar("catatan", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow()
  },
  (table) => ({
    appIdx: index("application_sla_app_id_idx").on(table.applicationId)
  })
);