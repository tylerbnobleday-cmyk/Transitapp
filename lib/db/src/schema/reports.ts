import { pgTable, text, serial, doublePrecision, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportTypeEnum = pgEnum("report_type", ["inspector", "delay", "incident"]);
export const transportTypeEnum = pgEnum("transport_type", ["tram", "train", "bus", "stop"]);
export const directionEnum = pgEnum("direction", ["city_bound", "outbound", "unknown"]);

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  reportType: reportTypeEnum("report_type").notNull().default("inspector"),
  transportType: transportTypeEnum("transport_type").notNull(),
  lineNumber: text("line_number"),
  direction: directionEnum("direction").default("unknown"),
  locationName: text("location_name").notNull(),
  notes: text("notes"),
  username: text("username").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({ id: true, createdAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
