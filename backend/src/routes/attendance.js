const express = require("express");
const { getClient } = require("../services/supabase");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const { data: attendance, error } = await getClient()
      .from("attendance")
      .select("*")
      .eq("student_id", req.student.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    res.json({ attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { subject, total_classes, attended_classes, threshold } = req.body;

    if (!subject || total_classes === undefined || attended_classes === undefined) {
      return res.status(400).json({ message: "Subject, total classes, and attended classes are required" });
    }

    const { data: existing } = await getClient()
      .from("attendance")
      .select("id")
      .eq("student_id", req.student.id)
      .eq("subject", subject)
      .single();

    let record;

    if (existing) {
      const { data, error } = await getClient()
        .from("attendance")
        .update({ total_classes, attended_classes, threshold: threshold || 75, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      record = data;
    } else {
      const { data, error } = await getClient()
        .from("attendance")
        .insert({
          student_id: req.student.id,
          subject,
          total_classes,
          attended_classes,
          threshold: threshold || 75,
        })
        .select()
        .single();

      if (error) throw error;
      record = data;
    }

    res.json({ attendance: record });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { error } = await getClient()
      .from("attendance")
      .delete()
      .eq("id", req.params.id)
      .eq("student_id", req.student.id);

    if (error) throw error;
    res.json({ message: "Attendance record deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
