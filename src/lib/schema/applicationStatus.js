import {
  mysqlTable,
  int,
  timestamp,
  index,
  varchar
} from 'drizzle-orm/mysql-core';

import { creditApplication } from './creditApplication.js';
import { users } from './users.js';
import { statusKreditEnum } from './enums.js';

export const applicationStatus = mysqlTable(
  "application_status",
  {
    id: int("id").primaryKey().autoincrement(),

    applicationId: int("application_id")
      .notNull()
      .references(() => creditApplication.id),

    status: statusKreditEnum.notNull(),

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