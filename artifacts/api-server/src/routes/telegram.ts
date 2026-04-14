import { Router, type IRouter } from "express";
import { bot } from "../lib/telegram";

const router: IRouter = Router();

router.get("/status", async (req, res) => {
  try {
    if (!bot) {
      return res.json({ connected: false });
    }

    const me = await bot.telegram.getMe();
    res.json({
      connected: true,
      username: me.username,
      firstName: me.first_name,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch bot status");
    res.status(500).json({ connected: false, error: "Failed to fetch bot status" });
  }
});

export default router;
