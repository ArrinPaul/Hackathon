const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function summarizeNotice(text) {
  try {
    const res = await groq.chat.completions.create({
      model: "gemma2-9b-it",
      messages: [
        { role: "system", content: "Summarize college notices in exactly 3 concise bullet points. Be specific about dates." },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });
    return res.choices[0]?.message?.content || "Could not summarize.";
  } catch {
    return "AI summarization unavailable. Please try again later.";
  }
}

async function getStudyTip() {
  const tips = [
    "Take regular breaks using the Pomodoro technique — 25 minutes of focused study, then 5 minutes off.",
    "Review your notes within 24 hours of taking them to improve retention by up to 60%.",
    "Teach what you've learned to someone else — it's the best way to solidify understanding.",
    "Get 7-8 hours of sleep before an exam. Your brain consolidates memories during sleep.",
    "Start with the hardest task when your energy is highest, usually in the morning.",
    "Use active recall instead of re-reading — test yourself on the material.",
    "Break large assignments into smaller tasks with their own mini-deadlines.",
    "Study in different locations to create multiple memory associations.",
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

async function attendanceAlert(subject, total, attended, threshold = 75) {
  if (total === 0) {
    return { percentage: "100.0", message: `${subject}: No classes held yet. You are at 100% attendance.`, isAtRisk: false };
  }
  const pct = ((attended / total) * 100).toFixed(1);
  if (Number(pct) >= threshold) {
    const canSkip = Math.floor(attended * 100 / threshold - total);
    return { percentage: pct, message: `${subject}: ${pct}%. You can skip ${canSkip} more classes.`, isAtRisk: false };
  } else {
    const needed = Math.ceil((threshold * total - 100 * attended) / (100 - threshold));
    return { percentage: pct, message: `${subject}: ⚠️ ${pct}%. Need ${needed} more classes to reach ${threshold}%.`, isAtRisk: true };
  }
}

async function chatResponse(messages) {
  try {
    const res = await groq.chat.completions.create({
      model: "gemma2-9b-it",
      messages: [
        { role: "system", content: "You are a helpful AI study assistant named CampusFlow AI. You assist college students with their homework, study planning, exam preparation, and notices clarification. Keep responses helpful, structured, and friendly." },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 800,
    });
    return res.choices[0]?.message?.content || "No response received.";
  } catch (err) {
    console.error("Groq chat error:", err.message);
    return "AI chat assistant is temporarily unavailable. Please verify your GROQ_API_KEY.";
  }
}

module.exports = { summarizeNotice, getStudyTip, attendanceAlert, chatResponse };
