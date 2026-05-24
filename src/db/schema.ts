import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    notificationEmail: text("notification_email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("organizations_slug_idx").on(table.slug)],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    index("users_organization_id_idx").on(table.organizationId),
  ],
);

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("otp_codes_email_idx").on(table.email),
    index("otp_codes_user_id_idx").on(table.userId),
    index("otp_codes_expires_at_idx").on(table.expiresAt),
  ],
);

export const transfers = pgTable(
  "transfers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromOrganizationId: uuid("from_organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    toOrganizationId: uuid("to_organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    message: text("message").notNull(),
    rowCount: integer("row_count").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("transfers_from_organization_id_idx").on(table.fromOrganizationId),
    index("transfers_to_organization_id_idx").on(table.toOrganizationId),
    index("transfers_created_by_user_id_idx").on(table.createdByUserId),
  ],
);

export const dataRows = pgTable(
  "data_rows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    fieldOne: text("field_one").notNull(),
    fieldTwo: text("field_two").notNull(),
    fieldThree: text("field_three").notNull(),
    sourceTransferId: uuid("source_transfer_id").references(() => transfers.id, {
      onDelete: "set null",
    }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("data_rows_organization_id_idx").on(table.organizationId),
    index("data_rows_source_transfer_id_idx").on(table.sourceTransferId),
    index("data_rows_deleted_at_idx").on(table.deletedAt),
  ],
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    action: text("action").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("rate_limits_key_action_idx").on(table.key, table.action),
    index("rate_limits_created_at_idx").on(table.createdAt),
  ],
);

export const organizationRelations = relations(organizations, ({ many }) => ({
  dataRows: many(dataRows),
  users: many(users),
}));

export const userRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  otpCodes: many(otpCodes),
}));

export const dataRowRelations = relations(dataRows, ({ one }) => ({
  organization: one(organizations, {
    fields: [dataRows.organizationId],
    references: [organizations.id],
  }),
  sourceTransfer: one(transfers, {
    fields: [dataRows.sourceTransferId],
    references: [transfers.id],
  }),
}));

export type DataRow = typeof dataRows.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
