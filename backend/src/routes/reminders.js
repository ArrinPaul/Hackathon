const express = require("express");
const { getClient } = require("../services/supabase");

const router = express.Router();

// GET /api/reminders/due — called by n8n reminders workflow every 30 minutes
// Returns all unsent reminders where the reminder should fire today or earlier
router.get("/due", async (req, res) => {
  try {
    const supabase = getClient();
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // A reminder is due when: event_date - days_left <= today AND not yet sent
    // In SQL terms: event_date - days_left <= CURRENT_DATE
    // We use RPC or raw filter. Since Supabase JS doesn't support computed column filters,
    // we fetch unsent reminders and filter in JS.
    const { data: reminders, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("sent", false)
      .order("event_date", { ascending: true });

    if (error) throw error;

    // Filter: reminder is due if (event_date - days_left) <= today
    const dueReminders = (reminders || []).filter((r) => {
      const eventDate = new Date(r.event_date);
      const reminderDate = new Date(eventDate);
      reminderDate.setDate(reminderDate.getDate() - r.days_left);
      const todayDate = new Date(today);
      return reminderDate <= todayDate;
    });

    res.json(dueReminders);
  } catch (error) {
    console.error("Fetch due reminders error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/reminders/:id/mark-sent — called by n8n reminders workflow after sending Telegram message
// Marks a single reminder as sent
router.patch("/:id/mark-sent", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: reminder, error } = await getClient()
      .from("reminders")
      .update({ sent: true })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    res.json({ message: "Reminder marked as sent", reminder });
  } catch (error) {
    console.error("Mark reminder sent error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
