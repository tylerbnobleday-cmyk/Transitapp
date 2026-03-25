import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { reportsTable } from "@workspace/db/schema";
import { CreateReportBody, GetReportsResponseItem, GetReportStatsResponse } from "@workspace/api-zod";
import { desc, gte, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const reports = await db
      .select()
      .from(reportsTable)
      .orderBy(desc(reportsTable.createdAt))
      .limit(100);

    const validated = reports.map((r) =>
      GetReportsResponseItem.parse({
        id: r.id,
        reportType: r.reportType,
        transportType: r.transportType,
        lineNumber: r.lineNumber,
        direction: r.direction,
        locationName: r.locationName,
        notes: r.notes,
        username: r.username,
        lat: r.lat,
        lng: r.lng,
        createdAt: r.createdAt.toISOString(),
      })
    );
    res.json(validated);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch reports");
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = CreateReportBody.parse(req.body);

    const [report] = await db
      .insert(reportsTable)
      .values({
        reportType: body.reportType,
        transportType: body.transportType,
        lineNumber: body.lineNumber ?? null,
        direction: body.direction ?? "unknown",
        locationName: body.locationName,
        notes: body.notes ?? null,
        username: body.username,
        lat: body.lat ?? null,
        lng: body.lng ?? null,
      })
      .returning();

    const validated = GetReportsResponseItem.parse({
      id: report.id,
      reportType: report.reportType,
      transportType: report.transportType,
      lineNumber: report.lineNumber,
      direction: report.direction,
      locationName: report.locationName,
      notes: report.notes,
      username: report.username,
      lat: report.lat,
      lng: report.lng,
      createdAt: report.createdAt.toISOString(),
    });

    res.status(201).json(validated);
  } catch (err) {
    req.log.error({ err }, "Failed to create report");
    res.status(400).json({ error: "Failed to create report" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [todayCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reportsTable)
      .where(gte(reportsTable.createdAt, startOfDay));

    const routeCounts = await db
      .select({
        lineNumber: reportsTable.lineNumber,
        transportType: reportsTable.transportType,
        count: sql<number>`count(*)::int`,
      })
      .from(reportsTable)
      .where(gte(reportsTable.createdAt, startOfDay))
      .groupBy(reportsTable.lineNumber, reportsTable.transportType)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    const riskyRoutes = routeCounts
      .filter((r) => r.lineNumber !== null)
      .map((r) => ({
        lineNumber: r.lineNumber!,
        transportType: r.transportType,
        reportCount: r.count,
        riskLevel: r.count >= 5 ? "high" : r.count >= 3 ? "medium" : "low",
      }));

    const stats = GetReportStatsResponse.parse({
      alertsToday: todayCount.count,
      riskyRoutes,
    });

    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
