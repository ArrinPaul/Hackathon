const express = require("express");
const { getClient } = require("../services/supabase");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const { data: logs, error } = await getClient()
      .from("automation_logs")
      .select("*")
      .eq("student_id", req.student.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
