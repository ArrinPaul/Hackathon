const express = require("express");
const authMiddleware = require("../middleware/auth");
const {
  getStudyTip,
  attendanceAlert,
  chatResponse,
  generateFlashcards,
  generateQuiz,
  executeSmartTool
} = require("../services/groq");

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

router.post("/flashcards", authMiddleware, async (req, res) => {
  try {
    const { notes } = req.body;
    if (!notes) {
      return res.status(400).json({ message: "Notes content is required" });
    }
    const flashcards = await generateFlashcards(notes);
    res.json({ flashcards });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to generate flashcards" });
  }
});

router.post("/quiz", authMiddleware, async (req, res) => {
  try {
    const { notes, count } = req.body;
    if (!notes) {
      return res.status(400).json({ message: "Notes content is required" });
    }
    const questions = await generateQuiz(notes, count);
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to generate quiz" });
  }
});

router.post("/tool/:toolSlug", authMiddleware, async (req, res) => {
  try {
    const { toolSlug } = req.params;
    const { content, options } = req.body;
    if (!content && toolSlug !== 'study-schedule') {
      return res.status(400).json({ message: "Content input is required" });
    }
    const result = await executeSmartTool(toolSlug, content, options);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to execute smart tool" });
  }
});

module.exports = router;

