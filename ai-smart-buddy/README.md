# AI Smart Buddy - CampusFlow

An AI-powered study assistant feature for CampusFlow web app.

## Features

### 🤖 AI Chat Assistant
- Ask questions about your studies
- Get study tips and techniques
- Conversational interface

### 🎴 Flashcard Generator
- Paste lecture notes
- AI generates flashcards automatically
- Interactive flip animation
- Navigate through deck

### 📝 MCQ Quiz Generator
- Create quizzes from your notes
- Multiple choice questions
- Instant scoring and feedback
- Adjustable question count

### ✨ Smart Tools
- **Summarize Notes** - Get concise summaries
- **Study Schedule** - AI-generated study plans
- **Concept Map** - Visual concept diagrams
- **Explain Concept** - Simple explanations
- **Attendance Risk** - Check at-risk subjects
- **Notice Summarizer** - Summarize college notices

## Setup

### 1. Get Free Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (free, no credit card required)
3. Create an API key
4. Copy the key (starts with `gsk_`)

### 2. Run the App

Create a `.env` file in the `ai-smart-buddy` folder, then run the local server.

Example `.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
GROQ_BASE_URL=https://api.groq.com/openai/v1/chat/completions
```

Start the app with:

```
node server.js
```

### 3. Configure API Key

1. Set `GROQ_API_KEY` in `.env`
2. Optionally change `GROQ_MODEL`
3. Restart the server after editing `.env`

## Usage

1. **Chat**: Type questions in the chat input
2. **Flashcards**: Paste notes → Click "Generate Flashcards"
3. **Quiz**: Paste notes → Select question count → Click "Generate Quiz"
4. **Smart Tools**: Click any tool card → Enter content → Process

## Tech Stack

- Pure HTML/CSS/JavaScript (no build step)
- Groq API for AI generation
- Notion-inspired design
- `.env`-driven runtime config with localStorage fallback

## Free Tier Limits

Groq API free tier includes:
- 14,400 requests per day
- No credit card required
- Models: Llama 3, Mixtral
