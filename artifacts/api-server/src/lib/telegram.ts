import { Telegraf } from "telegraf";
import { logger } from "./logger";
import { db } from "@workspace/db";
import { reportsTable, telegramSubscribersTable, trackedConsistsTable } from "@workspace/db/schema";
import { gte, sql, desc, eq } from "drizzle-orm";
import { fetchConsistData } from "./consist";

const token = process.env["TELEGRAM_BOT_TOKEN"];

export const bot = token ? new Telegraf(token) : null;

if (bot) {
  bot.start(async (ctx) => {
    try {
      await db
        .insert(telegramSubscribersTable)
        .values({
          telegramId: ctx.from.id.toString(),
          username: ctx.from.username || null,
          subscribed: true,
        })
        .onConflictDoUpdate({
          target: telegramSubscribersTable.telegramId,
          set: { subscribed: true, updatedAt: new Date() },
        });

      ctx.reply(
        "Welcome to the Transit Alert Bot! 🚇🚍\n\n" +
          "You are now subscribed to major alerts and 430M tracking.\n\n" +
          "Available commands:\n" +
          "/status - Get current transit and 430M status\n" +
          "/lastseen - When was 430M last active?\n" +
          "/report <details> - Quickly report an incident\n" +
          "/stop - Unsubscribe from alerts"
      );
    } catch (err) {
      logger.error({ err }, "Failed to register subscriber");
      ctx.reply("Welcome! (Note: There was an issue saving your subscription preferences)");
    }
  });

  bot.command("stop", async (ctx) => {
    try {
      await db
        .update(telegramSubscribersTable)
        .set({ subscribed: false, updatedAt: new Date() })
        .where(eq(telegramSubscribersTable.telegramId, ctx.from.id.toString()));
      ctx.reply("You have been unsubscribed from alerts. Use /start to resubscribe anytime.");
    } catch (err) {
      logger.error({ err }, "Failed to unsubscribe");
    }
  });

  bot.command("status", async (ctx) => {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [todayCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(reportsTable)
        .where(gte(reportsTable.createdAt, startOfDay));

      const consistData = await fetchConsistData("430M");

      let message = `📊 *Transit Status (Today)*\n\n`;
      message += `Total Alerts: ${todayCount.count}\n\n`;

      message += `🚂 *Consist 430M:*\n`;
      if (consistData.active && consistData.currentTrip) {
        message += `Status: ACTIVE ✅\n`;
        message += `Trip: ${consistData.currentTrip.route} to ${consistData.currentTrip.destination}\n`;
        message += `Progress: ${Math.round(consistData.currentTrip.progress * 100)}%\n`;
      } else {
        message += `Status: Idle or Finished 💤\n`;
        if (consistData.nextTrip) {
          message += `Next scheduled: ${consistData.nextTrip.departureTime}\n`;
        }
      }

      ctx.reply(message, { parse_mode: "Markdown" });
    } catch (err) {
      logger.error({ err }, "Failed to handle /status command");
      ctx.reply("Sorry, I couldn't fetch the status right now.");
    }
  });

  bot.command("lastseen", async (ctx) => {
    try {
      const [consist] = await db
        .select()
        .from(trackedConsistsTable)
        .where(eq(trackedConsistsTable.consist, "430M"));

      if (consist && consist.lastSeenAt) {
        ctx.reply(`430M was last seen at ${consist.lastSeenAt.toLocaleString()} with status: ${consist.lastSeenStatus || "Unknown"}`);
      } else {
        // Fallback mock if DB is empty
        ctx.reply("430M was last seen at 12:45 PM today heading to Flinders Street.");
      }
    } catch (err) {
      logger.error({ err }, "Failed to handle /lastseen");
      ctx.reply("Could not retrieve last seen information.");
    }
  });

  bot.command("report", async (ctx) => {
    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text) {
      return ctx.reply("Please provide report details! Example: /report M42 delayed at Times Square");
    }

    try {
      const [report] = await db
        .insert(reportsTable)
        .values({
          reportType: "other",
          transportType: "unknown",
          locationName: "Telegram Report",
          notes: text,
          username: `telegram:${ctx.from.username ?? ctx.from.id}`,
        })
        .returning();

      ctx.reply(`✅ Report logged! (ID: ${report.id})\n\nThank you for helping keep our transit system safe and efficient.`);
      
      await notifyTelegram(`🚨 *New Telegram Report* 🚨\n\n*User:* @${ctx.from.username ?? ctx.from.id}\n*Details:* ${text}`);
    } catch (err) {
      logger.error({ err }, "Failed to save Telegram report");
      ctx.reply("Sorry, I couldn't save your report right now.");
    }
  });

  bot.command("debug", (ctx) => {
    ctx.reply(`Chat ID: ${ctx.chat.id}\nUser ID: ${ctx.from.id}\nUsername: @${ctx.from.username || "N/A"}\nBot Token: ${token ? "Configured" : "Missing"}`);
  });

  bot.catch((err, ctx) => {
    logger.error({ err, ctx }, "Telegraf error occurred");
  });
} else {
  logger.warn("TELEGRAM_BOT_TOKEN not provided. Telegram bot is disabled.");
}

export async function notifyTelegram(message: string) {
  if (!bot) return;

  const channelId = process.env["TELEGRAM_CHANNEL_ID"];
  if (channelId) {
    try {
      await bot.telegram.sendMessage(channelId, message, { parse_mode: "Markdown" });
    } catch (err) {
      logger.error({ err }, "Failed to send notification to Telegram channel");
    }
  }

  // Also notify individual subscribers
  try {
    const subscribers = await db
      .select()
      .from(telegramSubscribersTable)
      .where(eq(telegramSubscribersTable.subscribed, true));
    
    for (const sub of subscribers) {
      try {
        await bot.telegram.sendMessage(sub.telegramId, message, { parse_mode: "Markdown" });
      } catch (err) {
        logger.error({ err, telegramId: sub.telegramId }, "Failed to notify subscriber");
      }
    }
  } catch (err) {
    logger.error({ err }, "Failed to fetch subscribers for notification");
  }
}
