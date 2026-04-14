import { Router, type IRouter } from "express";
import healthRouter from "./health";
import reportsRouter from "./reports";
import chatRouter from "./chat";
import telegramRouter from "./telegram";
import consistRouter from "./consist";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/reports", reportsRouter);
router.use("/chat", chatRouter);
router.use("/telegram", telegramRouter);
router.use("/consist", consistRouter);

export default router;
