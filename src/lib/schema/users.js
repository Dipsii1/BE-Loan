import { mysqlTable, varchar, int, timestamp, index } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { roles } from './roles.js';

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 150 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    noPhone: varchar("no_phone", { length: 25 }),
    agentCode: varchar("agent_code", { length: 50 }).unique(),
    nasabahCode: varchar("nasabah_code", { length: 50 }).unique(),
    
    roleId: int("role_id")
      .notNull()
      .references(() => roles.id),
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
  },
  (table) => ({
    roleIdx: index("users_role_id_idx").on(table.roleId),
    emailIdx: index("users_email_idx").on(table.email)
  })
);

export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id]
  })
}));