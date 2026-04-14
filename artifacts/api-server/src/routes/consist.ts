import { Router, type IRouter } from "express";
import { fetchConsistData } from "../lib/consist";

const router: IRouter = Router();

router.get("/:consist", async (req, res) => {
  try {
    const consist = req.params.consist;
    const data = await fetchConsistData(consist);
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch consist status");
    res.status(500).json({ error: "Failed to fetch consist status" });
  }
});

router.get("/:consist/stops", async (req, res) => {
  try {
    const consist = req.params.consist;
    const data = await fetchConsistData(consist);
    res.json(data.currentTrip?.stops || []);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch consist stops");
    res.status(500).json({ error: "Failed to fetch consist stops" });
  }
});

export default router;
