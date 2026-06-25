"use client";

import { useState } from "react";
import { HelpCircle, RefreshCw, Loader2, BookOpen, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

export default function QuizPage() {
  const [notes, setNotes] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!notes.trim()) {
      setError("Please paste some notes first!");
      return;
    }

    setError("");
    setLoading(true);
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);

    try {
      const res = await api.post<{ questions: Question[] }>("/api/ai/quiz", {
        notes,
        count: questionCount,
      });

      if (res.questions && res.questions.length > 0) {
        // Sanitize indices to make sure they are within bounds
        const sanitized = res.questions.map((q) => ({
          ...q,
          correctIndex: Math.min(Math.max(0, Number(q.correctIndex) || 0), q.options.length - 1),
        }));
        setQuestions(sanitized);
      } else {
        throw new Error("No questions returned from AI.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (qIndex: number, optIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [qIndex]: optIndex,
    }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const handleClear = () => {
    setNotes("");
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setError("");
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, qi) => {
      if (answers[qi] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  const score = calculateScore();
  const unansweredCount = questions.length - Object.keys(answers).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" />
          MCQ Quiz Generator
        </h1>
        <p className="text-muted-foreground mt-1">Test your knowledge with AI-generated quizzes from study material</p>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-[10px] text-sm text-destructive animate-in fade-in duration-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configuration Form */}
        <div className="bg-white border border-border rounded-[10px] p-5 shadow-sm h-fit">
          <h3 className="font-semibold text-foreground text-base mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Quiz Setup
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                Paste Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-48 px-3 py-2 border border-border rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none font-sans"
                placeholder="Paste the notes or articles you want to be quizzed on..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                Number of Questions
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 py-2.5 bg-primary text-primary-foreground font-semibold rounded-[10px] hover:opacity-90 transition-standard cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Quiz"
                )}
              </button>
              <button
                onClick={handleClear}
                disabled={loading || (!notes && questions.length === 0)}
                className="p-2.5 border border-border text-foreground hover:bg-accent rounded-[10px] transition-standard cursor-pointer disabled:opacity-50"
                title="Reset Workspace"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Quiz questions */}
        <div className="lg:col-span-2 bg-white border border-border rounded-[10px] p-6 shadow-sm min-h-[400px]">
          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-10 h-full">
              <HelpCircle className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No quiz generated yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Set up your quiz on the left and click "Generate Quiz" to test yourself.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score summary */}
              {submitted && (
                <div className="p-4 bg-muted/30 border border-border rounded-[10px] flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Quiz Completed!</h3>
                    <p className="text-sm text-muted-foreground">
                      You scored <strong className="text-primary">{score}</strong> out of{" "}
                      <strong>{questions.length}</strong> ({Math.round((score / questions.length) * 100)}%)
                    </p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-[10px] text-sm hover:opacity-90 transition-standard cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retake Quiz
                  </button>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-6 divide-y divide-border">
                {questions.map((q, qi) => {
                  const isAnswered = answers[qi] !== undefined;

                  return (
                    <div key={qi} className={`space-y-3 ${qi > 0 ? "pt-6" : ""}`}>
                      <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                        <span>QUESTION {qi + 1} OF {questions.length}</span>
                        {submitted && (
                          answers[qi] === q.correctIndex ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-destructive">
                              <AlertCircle className="w-3.5 h-3.5" /> Incorrect
                            </span>
                          )
                        )}
                      </div>
                      <h4 className="font-semibold text-foreground text-base">
                        {q.question}
                      </h4>

                      <div className="grid grid-cols-1 gap-2.5">
                        {q.options.map((opt, oi) => {
                          const isSelected = answers[qi] === oi;
                          const isCorrect = q.correctIndex === oi;

                          let optionClass = "flex items-center gap-3 p-3 border border-border rounded-[10px] text-sm cursor-pointer transition-standard hover:bg-accent/40";
                          
                          if (submitted) {
                            if (isCorrect) {
                              optionClass = "flex items-center gap-3 p-3 border border-green-200 bg-green-500/10 text-green-700 rounded-[10px] text-sm font-medium";
                            } else if (isSelected) {
                              optionClass = "flex items-center gap-3 p-3 border border-destructive/20 bg-destructive/10 text-destructive rounded-[10px] text-sm font-medium";
                            } else {
                              optionClass = "flex items-center gap-3 p-3 border border-border rounded-[10px] text-sm opacity-60";
                            }
                          } else if (isSelected) {
                            optionClass = "flex items-center gap-3 p-3 border border-primary bg-primary/5 text-primary rounded-[10px] text-sm font-medium";
                          }

                          return (
                            <div
                              key={oi}
                              onClick={() => handleSelectAnswer(qi, oi)}
                              className={optionClass}
                            >
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                  submitted && isCorrect
                                    ? "bg-green-500 border-green-500 text-white"
                                    : submitted && isSelected
                                    ? "bg-destructive border-destructive text-white"
                                    : isSelected
                                    ? "bg-primary border-primary"
                                    : "border-muted-foreground"
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                              </div>
                              <span>{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit panel */}
              {!submitted && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border pt-6 mt-6">
                  <p className="text-xs text-muted-foreground">
                    {unansweredCount > 0
                      ? `${unansweredCount} question${unansweredCount > 1 ? "s" : ""} left to answer.`
                      : "All questions answered! Click submit below."}
                  </p>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-[10px] hover:opacity-90 transition-standard cursor-pointer flex items-center justify-center"
                  >
                    Submit Quiz
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
