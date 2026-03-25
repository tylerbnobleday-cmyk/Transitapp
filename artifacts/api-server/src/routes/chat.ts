import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable } from "@workspace/db/schema";
import { SendChatMessageBody, GetChatMessagesResponseItem } from "@workspace/api-zod";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const messages = await db
      .select()
      .from(chatMessagesTable)
      .orderBy(desc(chatMessagesTable.createdAt))
      .limit(100);

    const validated = messages.reverse().map((m) =>
      GetChatMessagesResponseItem.parse({
        id: m.id,
        username: m.username,
        message: m.message,
        createdAt: m.createdAt,
      })
    );
    res.json(validated);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch chat messages");
    res.status(500).json({ error: "Failed to fetch chat messages" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = SendChatMessageBody.parse(req.body);

    const [message] = await db
      .insert(chatMessagesTable)
      .values({
        username: body.username,
        message: body.message,
      })
      .returning();

    const validated = GetChatMessagesResponseItem.parse({
      id: message.id,
      username: message.username,
      message: message.message,
      createdAt: message.createdAt,
    });

    res.status(201).json(validated);
  } catch (err) {
    req.log.error({ err }, "Failed to send chat message");
    res.status(400).json({ error: "Failed to send chat message" });
  }
});

export default router;
