const express = require("express");
const { getClient } = require("../services/supabase");
const authMiddleware = require("../middleware/auth");
const fs = require("fs");
const path = require("path");

const router = express.Router();
router.use(authMiddleware);

// Local DB file setup as a robust fallback
const dbPath = path.join(__dirname, "../../whiteboards_db.json");

function readLocalDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ whiteboards: [] }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(dbPath, "utf8"));
  } catch (err) {
    console.error("Failed to parse local whiteboard DB, resetting:", err.message);
    return { whiteboards: [] };
  }
}

function writeLocalDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Failed to write to local whiteboard DB:", err.message);
  }
}

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
  } catch (dbErr) {
    console.warn("Supabase fetch failed, falling back to local storage file:", dbErr.message);
    const db = readLocalDb();
    const userWbs = db.whiteboards
      .filter(w => w.student_id === req.student.id)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    res.json({ whiteboards: userWbs });
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
  } catch (dbErr) {
    console.warn("Supabase fetch single failed, falling back to local storage file:", dbErr.message);
    const db = readLocalDb();
    const wb = db.whiteboards.find(w => w.id === req.params.id && w.student_id === req.student.id);
    if (!wb) {
      return res.status(404).json({ message: "Whiteboard not found" });
    }
    res.json({ whiteboard: wb });
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
  } catch (dbErr) {
    console.warn("Supabase insert failed, falling back to local storage file:", dbErr.message);
    const db = readLocalDb();
    const newWb = {
      id: "wb_" + Date.now() + Math.random().toString(36).slice(2, 7),
      student_id: req.student.id,
      title: req.body.title || "Untitled Whiteboard",
      data: req.body.data || {},
      thumbnail: req.body.thumbnail || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.whiteboards.push(newWb);
    writeLocalDb(db);
    res.json({ whiteboard: newWb });
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
  } catch (dbErr) {
    console.warn("Supabase update failed, falling back to local storage file:", dbErr.message);
    const db = readLocalDb();
    const idx = db.whiteboards.findIndex(w => w.id === req.params.id && w.student_id === req.student.id);
    if (idx === -1) {
      return res.status(404).json({ message: "Whiteboard not found" });
    }
    
    const wb = db.whiteboards[idx];
    if (req.body.title !== undefined) wb.title = req.body.title;
    if (req.body.data !== undefined) wb.data = req.body.data;
    if (req.body.thumbnail !== undefined) wb.thumbnail = req.body.thumbnail;
    wb.updated_at = new Date().toISOString();
    
    writeLocalDb(db);
    res.json({ whiteboard: wb });
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
  } catch (dbErr) {
    console.warn("Supabase delete failed, falling back to local storage file:", dbErr.message);
    const db = readLocalDb();
    const filtered = db.whiteboards.filter(w => !(w.id === req.params.id && w.student_id === req.student.id));
    db.whiteboards = filtered;
    writeLocalDb(db);
    res.json({ message: "Whiteboard deleted successfully" });
  }
});

module.exports = router;
