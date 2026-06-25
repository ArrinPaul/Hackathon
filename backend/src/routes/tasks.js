const express = require("express");
const { getClient } = require("../services/supabase");
const authMiddleware = require("../middleware/auth");
const { triggerN8nDeadline } = require("../services/n8n");
const { getValidAccessToken, createCalendarEvent } = require("../services/google");

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const { data: tasks, error } = await getClient()
      .from("tasks")
      .select("*")
      .eq("student_id", req.student.id)
      .order("deadline", { ascending: true });

    if (error) throw error;
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/today", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: tasks, error } = await getClient()
      .from("tasks")
      .select("*")
      .eq("student_id", req.student.id)
      .gte("deadline", today.toISOString())
      .lt("deadline", tomorrow.toISOString())
      .order("deadline", { ascending: true });

    if (error) throw error;
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/upcoming", async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data: tasks, error } = await getClient()
      .from("tasks")
      .select("*")
      .eq("student_id", req.student.id)
      .gte("deadline", now.toISOString())
      .lte("deadline", nextWeek.toISOString())
      .order("deadline", { ascending: true });

    if (error) throw error;
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, subject, description, deadline, reminder_time, add_to_calendar } = req.body;

    if (!title || !subject || !deadline) {
      return res.status(400).json({ message: "Title, subject, and deadline are required" });
    }

    const reminder = reminder_time || new Date(new Date(deadline).getTime() - 86400000).toISOString();

    const { data: task, error } = await getClient()
      .from("tasks")
      .insert({
        student_id: req.student.id,
        title,
        subject,
        description,
        deadline,
        reminder_time: reminder,
        add_to_calendar: add_to_calendar !== false,
      })
      .select()
      .single();

    if (error) throw error;

    const { data: student } = await getClient()
      .from("students")
      .select("name, telegram_username")
      .eq("id", req.student.id)
      .single();

    if (add_to_calendar !== false) {
      const accessToken = await getValidAccessToken(req.student.id);
      if (accessToken) {
        try {
          const deadlineDate = new Date(deadline);
          await createCalendarEvent(accessToken, {
            summary: `[CampusFlow] ${title}`,
            description: `Subject: ${subject}${description ? `\n${description}` : ""}`,
            start: { dateTime: deadlineDate.toISOString() },
            end: { dateTime: new Date(deadlineDate.getTime() + 3600000).toISOString() },
            reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 60 }] },
          });
        } catch (calErr) {
          console.error("Failed to create calendar event:", calErr.message);
        }
      }

      await triggerN8nDeadline({
        studentName: student?.name,
        telegramUsername: student?.telegram_username,
        subject,
        deadline,
        taskTitle: title,
      });

      await getClient().from("automation_logs").insert({
        student_id: req.student.id,
        workflow_type: "deadline_reminder",
        status: "triggered",
        details: { task_id: task.id, title },
      });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { title, subject, description, deadline, status } = req.body;

    const { data: task, error } = await getClient()
      .from("tasks")
      .update({ title, subject, description, deadline, status })
      .eq("id", req.params.id)
      .eq("student_id", req.student.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { error } = await getClient()
      .from("tasks")
      .delete()
      .eq("id", req.params.id)
      .eq("student_id", req.student.id);

    if (error) throw error;
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
