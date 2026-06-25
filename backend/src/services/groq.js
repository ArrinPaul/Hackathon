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

async function generateFlashcards(notes) {
  try {
    const res = await groq.chat.completions.create({
      model: "gemma2-9b-it",
      messages: [
        {
          role: "system",
          content: `You are a flashcard generator for students. Convert the given notes into flashcards.
Return ONLY a JSON array of objects with "front" (question/concept) and "back" (answer/explanation).
Create 8-12 flashcards covering the key concepts.
Do not include any markdown format, backticks, or text outside the JSON array.
Format: [{"front": "question", "back": "answer"}, ...]`
        },
        { role: "user", content: `Create flashcards from these notes:\n\n${notes}` }
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });
    const text = res.choices[0]?.message?.content || "";
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Flashcards generation error:", err);
    throw new Error(err.message || "Failed to generate flashcards");
  }
}

async function generateQuiz(notes, count = 10) {
  try {
    const res = await groq.chat.completions.create({
      model: "gemma2-9b-it",
      messages: [
        {
          role: "system",
          content: `You are a quiz generator for students. Create multiple choice questions from the given notes.
Return ONLY a JSON array of objects with:
- "question": the question text
- "options": array of exactly 4 answer options
- "correctIndex": index of correct answer (0, 1, 2, or 3)

Create exactly ${count} questions.
Do not include any markdown format, backticks, or text outside the JSON array.
Format: [{"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0}, ...]`
        },
        { role: "user", content: `Create a quiz from these notes:\n\n${notes}` }
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });
    const text = res.choices[0]?.message?.content || "";
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Quiz generation error:", err);
    throw new Error(err.message || "Failed to generate quiz");
  }
}

async function executeSmartTool(tool, content, options = {}) {
  let systemPrompt = "";
  let userPrompt = "";

  switch (tool) {
    case 'summarize-notes':
      systemPrompt = 'You are a note summarizer. Create a concise summary with key points in bullet format. Keep it under 200 words.';
      userPrompt = `Summarize these notes:\n\n${content}`;
      break;

    case 'study-schedule': {
      const examDate = options.examDate || 'next week';
      const studyHours = options.studyHours || 4;
      systemPrompt = `You are a study schedule planner. Create a detailed daily study plan.
Available study hours per day: ${studyHours}.
Exam date: ${examDate}.
Include subjects, topics, break times, and revision slots.
Format as a clear daily schedule.`;
      userPrompt = content
        ? `Create a study schedule for these subjects/topics:\n\n${content}`
        : 'Create a study schedule using the provided exam date and daily study hours.';
      break;
    }

    case 'concept-map':
      systemPrompt = `You are a concept mapper. Convert the given content into a structured concept map.
Use this format:
LEVEL 1: Main Topic
  LEVEL 2: Sub-topic
    - Key point 1
    - Key point 2
Show relationships between concepts clearly.`;
      userPrompt = `Create a concept map for:\n\n${content}`;
      break;

    case 'explain-concept':
      systemPrompt = `You are a friendly teacher. Explain the concept in simple terms:
1. Start with a simple analogy
2. Give a clear definition
3. Provide 2-3 real-world examples
4. Mention common misconceptions
Keep it conversational and easy to understand.`;
      userPrompt = `Explain this concept simply:\n\n${content}`;
      break;

    case 'attendance-risk':
      systemPrompt = `You are an attendance risk analyzer. Analyze the attendance percentages and:
1. Flag subjects at risk (below 75%)
2. Calculate how many more classes can be missed
3. Provide action plan for each at-risk subject
4. Give overall risk assessment
Use clear formatting with emojis for status indicators.`;
      userPrompt = `Analyze these attendance records:\n\n${content}`;
      break;

    case 'notice-summarizer':
      systemPrompt = `You are a notice summarizer. Extract key information from college notices:
1. What is the notice about?
2. Key dates and deadlines
3. Who needs to take action
4. Any important instructions
Format as clear bullet points.`;
      userPrompt = `Summarize this notice:\n\n${content}`;
      break;
    
    default:
      throw new Error("Invalid tool selected");
  }

  try {
    const res = await groq.chat.completions.create({
      model: "gemma2-9b-it",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });
    return res.choices[0]?.message?.content || "No response received from AI.";
  } catch (err) {
    console.error(`Smart tool ${tool} error:`, err);
    throw new Error(err.message || "Failed to execute smart tool");
  }
}

module.exports = {
  summarizeNotice,
  getStudyTip,
  attendanceAlert,
  chatResponse,
  generateFlashcards,
  generateQuiz,
  executeSmartTool
};

