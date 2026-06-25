"use client";

import { useState, useEffect } from "react";
import { Copy, RefreshCw, Loader2, ArrowLeft, ArrowRight, BookOpen, Layers, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

interface Flashcard {
  front: string;
  back: string;
}

export default function FlashcardsPage() {
  const [notes, setNotes] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!notes.trim()) {
      setError("Please paste some notes first!");
      return;
    }

    setError("");
    setLoading(true);
    setIsFlipped(false);
    setFlashcards([]);

    try {
      const res = await api.post<{ flashcards: Flashcard[] }>("/api/ai/flashcards", { notes });
      if (res.flashcards && res.flashcards.length > 0) {
        setFlashcards(res.flashcards);
        setCurrentIndex(0);
      } else {
        throw new Error("No flashcards returned from AI.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate flashcards");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setNotes("");
    setFlashcards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setError("");
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only execute keyboard shortcut if user is not typing in the textarea
      if (document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "INPUT") {
        return;
      }

      if (flashcards.length === 0) return;

      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flashcards, currentIndex]);

  const currentCard = flashcards[currentIndex];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Layers className="w-6 h-6 text-primary" />
          Flashcard Generator
        </h1>
        <p className="text-muted-foreground mt-1">Paste your lecture notes and AI will create flashcards for you</p>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-[10px] text-sm text-destructive animate-in fade-in duration-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Notes */}
        <div className="bg-white border border-border rounded-[10px] p-5 shadow-sm h-fit">
          <h3 className="font-semibold text-foreground text-base mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Paste Study Material
          </h3>
          <div className="space-y-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-64 px-3 py-2 border border-border rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none font-sans"
              placeholder="Paste your lecture notes, formulas, vocabulary list, or reading text here..."
            />
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
                  "Generate Cards"
                )}
              </button>
              <button
                onClick={handleClear}
                disabled={loading || (!notes && flashcards.length === 0)}
                className="p-2.5 border border-border text-foreground hover:bg-accent rounded-[10px] transition-standard cursor-pointer disabled:opacity-50"
                title="Clear Notes"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Columns: Flashcard Stack */}
        <div className="lg:col-span-2 flex flex-col justify-between bg-white border border-border rounded-[10px] p-6 shadow-sm min-h-[400px]">
          {flashcards.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <Layers className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No flashcards yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Paste your notes into the input section and click "Generate Cards" to start active recall studying.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between gap-6">
              {/* 3D Flipping Card */}
              <div 
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full max-w-md h-64 [perspective:1000px] cursor-pointer mx-auto mt-6"
              >
                <div className={`relative w-full h-full text-center transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                  {/* Front Side */}
                  <div className="absolute inset-0 w-full h-full rounded-[10px] border border-border bg-white p-6 flex flex-col justify-between shadow-md [backface-visibility:hidden]">
                    <div className="text-left">
                      <span className="px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                        Question / Concept
                      </span>
                    </div>
                    <div className="flex-1 flex items-center justify-center py-4">
                      <p className="text-lg font-bold text-foreground leading-relaxed">
                        {currentCard.front}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Click card or press Space to reveal answer
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 w-full h-full rounded-[10px] border border-border bg-muted/20 p-6 flex flex-col justify-between shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <div className="text-left">
                      <span className="px-2 py-0.5 text-xs font-semibold bg-secondary/15 text-secondary rounded-full">
                        Answer / Explanation
                      </span>
                    </div>
                    <div className="flex-1 flex items-center justify-center py-4">
                      <p className="text-base font-semibold text-foreground leading-relaxed whitespace-pre-wrap">
                        {currentCard.back}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Click to show question again
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress and Navigation Bar */}
              <div className="space-y-4">
                {/* Progress bar */}
                <div className="w-full max-w-md mx-auto">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Active Study Progress</span>
                    <span>{currentIndex + 1} / {flashcards.length} cards</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Nav buttons */}
                <div className="flex justify-center items-center gap-3">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-[10px] text-sm font-semibold hover:bg-accent text-foreground disabled:opacity-40 disabled:hover:bg-transparent transition-standard cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Prev
                  </button>
                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="px-6 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary font-semibold rounded-[10px] text-sm transition-standard cursor-pointer"
                  >
                    Flip Card
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === flashcards.length - 1}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-[10px] text-sm font-semibold hover:bg-accent text-foreground disabled:opacity-40 disabled:hover:bg-transparent transition-standard cursor-pointer"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center text-xs text-muted-foreground">
                  Pro-tip: Use your keyboard arrow keys (← / →) to navigate and Spacebar to flip.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
