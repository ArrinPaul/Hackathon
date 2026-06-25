const express = require("express");
const authMiddleware = require("../middleware/auth");
const { getStudyTip, attendanceAlert, chatResponse } = require("../services/groq");

const router = express.Router();

router.get("/tip", async (req, res) => {
  try {
    const tip = await getStudyTip();
    res.json({ tip });
  } catch (error) {
    res.json({ tip: "Take regular breaks while studying!" });
  }
});

router.post("/attendance-alert", authMiddleware, async (req, res) => {
  try {
    const { subject, total, attended, threshold } = req.body;

    if (!subject || total === undefined || attended === undefined) {
      return res.status(400).json({ message: "Subject, total, and attended are required" });
    }

    const result = await attendanceAlert(subject, total, attended, threshold);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/chat", authMiddleware, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Messages array is required" });
    }
    const reply = await chatResponse(messages);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
