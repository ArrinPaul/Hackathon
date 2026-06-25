const express = require("express");
const { getClient } = require("../services/supabase");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

// Get all whiteboards for the current student
router.get("/", async (req, res) => {
  try {
    const { data: whiteboards, error } = await getClient()
      .from("whiteboards")
      .select("*")
      .eq("student_id", req.student.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    res.json({ whiteboards });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single whiteboard
router.get("/:id", async (req, res) => {
  try {
    const { data: whiteboard, error } = await getClient()
      .from("whiteboards")
      .select("*")
      .eq("id", req.params.id)
      .eq("student_id", req.student.id)
      .single();

    if (error) throw error;
    if (!whiteboard) {
      return res.status(404).json({ message: "Whiteboard not found" });
    }
    res.json({ whiteboard });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new whiteboard
router.post("/", async (req, res) => {
  try {
    const { title, data, thumbnail } = req.body;
    const { data: whiteboard, error } = await getClient()
      .from("whiteboards")
      .insert({
        student_id: req.student.id,
        title: title || "Untitled Whiteboard",
        data: data || {},
        thumbnail: thumbnail || null,
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ whiteboard });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a whiteboard (save data, rename title, etc.)
router.put("/:id", async (req, res) => {
  try {
    const { title, data, thumbnail } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (data !== undefined) updateData.data = data;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    updateData.updated_at = new Date().toISOString();

    const { data: whiteboard, error } = await getClient()
      .from("whiteboards")
      .update(updateData)
      .eq("id", req.params.id)
      .eq("student_id", req.student.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ whiteboard });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a whiteboard
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await getClient()
      .from("whiteboards")
      .delete()
      .eq("id", req.params.id)
      .eq("student_id", req.student.id);

    if (error) throw error;
    res.json({ message: "Whiteboard deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
