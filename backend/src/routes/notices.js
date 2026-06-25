const express = require("express");
const { getClient } = require("../services/supabase");
const authMiddleware = require("../middleware/auth");
const { summarizeNotice } = require("../services/groq");
const { triggerN8nNotice } = require("../services/n8n");

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const { data: notices, error } = await getClient()
      .from("notices")
      .select("*")
      .eq("student_id", req.student.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ notices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { notice_text, event_title, event_date } = req.body;

    if (!notice_text) {
      return res.status(400).json({ message: "Notice text is required" });
    }

    const ai_summary = await summarizeNotice(notice_text);

    const { data: notice, error } = await getClient()
      .from("notices")
      .insert({
        student_id: req.student.id,
        notice_text,
        ai_summary,
        event_title,
        event_date,
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ notice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/broadcast", async (req, res) => {
  try {
    const { notice_id } = req.body;

    const { data: notice, error: noticeError } = await getClient()
      .from("notices")
      .select("*")
      .eq("id", notice_id)
      .eq("student_id", req.student.id)
      .single();

    if (noticeError || !notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    const { data: student } = await getClient()
      .from("students")
      .select("name, telegram_username")
      .eq("id", req.student.id)
      .single();

    const result = await triggerN8nNotice({
      studentName: student?.name,
      telegramUsername: student?.telegram_username,
      aiSummary: notice.ai_summary,
      eventTitle: notice.event_title,
      eventDate: notice.event_date,
    });

    await getClient()
      .from("notices")
      .update({ broadcast_status: result.success ? "sent" : "failed" })
      .eq("id", notice_id);

    await getClient().from("automation_logs").insert({
      student_id: req.student.id,
      workflow_type: "notice_broadcast",
      status: result.success ? "success" : "failed",
      details: { notice_id },
    });

    res.json({ success: result.success });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
