import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const telegramSubscribersTable = pgTable("telegram_subscribers", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  username: text("username"),
  subscribed: boolean("subscribed").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trackedConsistsTable = pgTable("tracked_consists", {
  id: serial("id").primaryKey(),
  consist: text("consist").notNull().unique(),
  lastSeenTripId: text("last_seen_trip_id"),
  lastSeenStatus: text("last_seen_status"),
  lastSeenAt: timestamp("last_seen_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
