const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { getClient } = require("../services/supabase");
const { getAuthUrl, getTokensFromCode, getValidAccessToken } = require("../services/google");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

router.get("/url", (req, res) => {
  const { state } = req.query;
  const url = getAuthUrl(state);
  res.json({ url });
});

router.get("/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.redirect(`${FRONTEND_URL}/login?error=no_code`);
  }

  try {
    const tokens = await getTokensFromCode(code);

    const ticket = await require("google-auth-library").OAuth2Client.prototype.verifyIdToken.call(
      new (require("google-auth-library").OAuth2Client)(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      ),
      { idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID }
    );

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    const supabase = getClient();

    let student = null;

    if (state) {
      const { data } = await supabase
        .from("students")
        .select("*")
        .eq("id", state)
        .single();
      student = data;
    }

    if (!student) {
      const { data } = await supabase
        .from("students")
        .select("*")
        .eq("email", email)
        .single();
      student = data;
    }

    if (!student) {
      const password_hash = await bcrypt.hash(googleId, 10);
      const { data: newStudent, error } = await supabase
        .from("students")
        .insert({
          name: name || email.split("@")[0],
          email,
          password_hash,
          branch: "Not Set",
          year: 1,
          telegram_username: "",
          subjects: [],
        })
        .select("id, name, email, branch, year, telegram_username, subjects, created_at")
        .single();

      if (error) throw error;
      student = newStudent;
    } else {
      const { password_hash, ...rest } = student;
      student = rest;
    }

    await supabase.from("preferences").upsert({
      user_id: student.id,
      settings: {
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_calendar_connected: true,
        google_token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
      },
    });

    const appToken = jwt.sign(
      { id: student.id, email: student.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userData = encodeURIComponent(JSON.stringify(student));

    res.redirect(`${FRONTEND_URL}/login?token=${appToken}&user=${userData}`);
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
  }
});

router.post("/calendar/events", authMiddleware, async (req, res) => {
  try {
    const accessToken = await getValidAccessToken(req.student.id);
    if (!accessToken) {
      return res.status(400).json({ message: "Google Calendar not connected" });
    }

    const { createCalendarEvent } = require("../services/google");
    const event = await createCalendarEvent(accessToken, req.body);
    res.json({ event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/calendar/events", authMiddleware, async (req, res) => {
  try {
    const accessToken = await getValidAccessToken(req.student.id);
    if (!accessToken) {
      return res.status(400).json({ message: "Google Calendar not connected" });
    }

    const { getCalendarEvents } = require("../services/google");
    const events = await getCalendarEvents(accessToken);
    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/status", authMiddleware, async (req, res) => {
  try {
    const supabase = getClient();
    const { data: prefs } = await supabase
      .from("preferences")
      .select("settings")
      .eq("user_id", req.student.id)
      .single();

    const isConnected = !!prefs?.settings?.google_refresh_token;
    res.json({ connected: isConnected });
  } catch (error) {
    res.json({ connected: false });
  }
});

module.exports = router;
