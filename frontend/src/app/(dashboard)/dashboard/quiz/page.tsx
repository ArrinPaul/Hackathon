"use client";

import { useState, useEffect } from "react";
import { 
  HelpCircle, 
  BookOpen, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Award,
  Plus,
  FileText,
  Edit2,
  Check,
  X,
  Info,
  ChevronRight,
  FileSpreadsheet,
  ListOrdered,
  Pin,
  Bookmark,
  Upload
} from "lucide-react";
import { api } from "@/lib/api";

interface Question {
  question: string;
  options?: string[];
  correctIndex?: number;
  modelAnswer?: string;
  explanation: string;
  citation?: string;
}

interface SourceDoc {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface WrittenNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface ShortAnswerGrade {
  score: number;
  feedback: string;
  isCorrect: boolean;
}

export default function QuizPage() {
  // Sidebar Tabs: "sources" | "notes"
  const [sidebarTab, setSidebarTab] = useState<"sources" | "notes">("sources");

  // Sources State
  const [sources, setSources] = useState<SourceDoc[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  
  // Pinned Notes State
  const [notesList, setNotesList] = useState<WrittenNote[]>([]);
  
  // Modal State for Adding/Editing Sources
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [modalSourceId, setModalSourceId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState("");
  const [modalTab, setModalTab] = useState<"text" | "upload">("text");

  // File Upload Status
  const [fileLoading, setFileLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Modal State for Manual Written Note Creation
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [modalNoteId, setModalNoteId] = useState<string | null>(null);
  const [noteModalTitle, setNoteModalTitle] = useState("");
  const [noteModalContent, setNoteModalContent] = useState("");

  // Quiz States
  const [questionCount, setQuestionCount] = useState(5);
  const [quizType, setQuizType] = useState<"mcq" | "tf" | "short_answer">("mcq");
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [shortAnswerInputs, setShortAnswerInputs] = useState<Record<number, string>>({});
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  
  // Short Answer AI Grading
  const [shortAnswerGrades, setShortAnswerGrades] = useState<Record<number, ShortAnswerGrade>>({});
  const [gradingProgress, setGradingProgress] = useState("");
  
  // Workspace Views: "interactive" | "review-sheet"
  const [activeView, setActiveView] = useState<"interactive" | "review-sheet">("interactive");
  
  // Feedbacks
  const [pinnedFeedback, setPinnedFeedback] = useState<number | null>(null);

  // Initialize Sources and Notes from localStorage (shares the exact same lists!)
  useEffect(() => {
    // 1. Load Sources
    const savedSources = localStorage.getItem("campusflow_notebook_sources");
    if (savedSources) {
      try {
        const parsed = JSON.parse(savedSources) as SourceDoc[];
        setSources(parsed);
        setSelectedSourceIds(parsed.map(s => s.id));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Seed with a default source
      const defaultSource: SourceDoc = {
        id: "default-1",
        title: "Active Recall & Spaced Repetition",
        content: "Active recall is a highly effective learning technique that involves testing your memory rather than passively reviewing notes. Instead of reading transcripts, you force your brain to retrieve the concept. Spaced repetition utilizes expanding time intervals (e.g. 1 day, 3 days, 7 days) before reviewing cards again. This leverages the psychological spacing effect, strengthening synapses and encoding information into long-term memory. Combined, these methods optimize cognitive efficiency.",
        createdAt: new Date().toISOString()
      };
      setSources([defaultSource]);
      setSelectedSourceIds([defaultSource.id]);
      localStorage.setItem("campusflow_notebook_sources", JSON.stringify([defaultSource]));
    }

    // 2. Load Notes
    const savedNotes = localStorage.getItem("campusflow_notebook_notes");
    if (savedNotes) {
      try {
        setNotesList(JSON.parse(savedNotes));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // PDF.js dynamic CDN Loader helper
  const loadPdfJs = async () => {
    if (typeof window === "undefined") return null;
    const win = window as any;
    if (win.pdfjsLib) return win.pdfjsLib;
    
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
      script.onload = () => {
        win.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
        resolve(win.pdfjsLib);
      };
      script.onerror = () => reject(new Error("Failed to load PDF parsing library. Check internet connectivity."));
      document.head.appendChild(script);
    });
  };

  // File Upload Document Parser
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileLoading(true);
    setUploadError("");

    try {
      let extractedText = "";

      if (file.name.endsWith(".pdf")) {
        const pdfjsLib = await loadPdfJs();
        if (!pdfjsLib) throw new Error("Could not initialize PDF reader module.");

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += pageText + "\n\n";
        }
        extractedText = fullText;
      } else {
        extractedText = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string || "");
          reader.onerror = () => reject(new Error("Failed to read text document."));
          reader.readAsText(file);
        });
      }

      if (!extractedText.trim()) {
        throw new Error("No readable text content could be extracted from this document.");
      }

      setModalTitle(file.name.replace(/\.[^/.]+$/, ""));
      setModalContent(extractedText);
      setModalTab("text"); // Switch back to text view
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error reading uploaded file.");
    } finally {
      setFileLoading(false);
      e.target.value = "";
    }
  };

  // Save/Edit Source Action
  const handleSaveSource = () => {
    if (!modalTitle.trim() || !modalContent.trim()) {
      alert("Please provide both a title and notes text content.");
      return;
    }

    let updatedSources = [...sources];
    if (modalSourceId) {
      updatedSources = updatedSources.map(s => 
        s.id === modalSourceId 
          ? { ...s, title: modalTitle.trim(), content: modalContent.trim() } 
          : s
      );
    } else {
      const newDoc: SourceDoc = {
        id: Math.random().toString(36).substring(7),
        title: modalTitle.trim(),
        content: modalContent.trim(),
        createdAt: new Date().toISOString()
      };
      updatedSources.push(newDoc);
      setSelectedSourceIds(prev => [...prev, newDoc.id]);
    }

    setSources(updatedSources);
    localStorage.setItem("campusflow_notebook_sources", JSON.stringify(updatedSources));
    
    setIsSourceModalOpen(false);
    setModalTitle("");
    setModalContent("");
    setModalSourceId(null);
  };

  const handleStartEditSource = (doc: SourceDoc) => {
    setModalSourceId(doc.id);
    setModalTitle(doc.title);
    setModalContent(doc.content);
    setModalTab("text");
    setUploadError("");
    setIsSourceModalOpen(true);
  };

  const handleDeleteSource = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this source document?")) return;

    const updated = sources.filter(s => s.id !== id);
    setSources(updated);
    setSelectedSourceIds(prev => prev.filter(selectedId => selectedId !== id));
    localStorage.setItem("campusflow_notebook_sources", JSON.stringify(updated));
  };

  const handleToggleSelectSource = (id: string) => {
    setSelectedSourceIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  // Written Notes Handlers
  const handleSaveNote = () => {
    if (!noteModalTitle.trim() || !noteModalContent.trim()) {
      alert("Please enter a note title and text content.");
      return;
    }

    let updatedNotes = [...notesList];
    if (modalNoteId) {
      updatedNotes = updatedNotes.map(n => 
        n.id === modalNoteId 
          ? { ...n, title: noteModalTitle.trim(), content: noteModalContent.trim() }
          : n
      );
    } else {
      const newNote: WrittenNote = {
        id: Math.random().toString(36).substring(7),
        title: noteModalTitle.trim(),
        content: noteModalContent.trim(),
        createdAt: new Date().toISOString()
      };
      updatedNotes.unshift(newNote);
    }

    setNotesList(updatedNotes);
    localStorage.setItem("campusflow_notebook_notes", JSON.stringify(updatedNotes));

    setIsNoteModalOpen(false);
    setNoteModalTitle("");
    setNoteModalContent("");
    setModalNoteId(null);
  };

  const handleStartEditNote = (note: WrittenNote) => {
    setModalNoteId(note.id);
    setNoteModalTitle(note.title);
    setNoteModalContent(note.content);
    setIsNoteModalOpen(true);
  };

  const handleDeleteNote = (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    const updated = notesList.filter(n => n.id !== id);
    setNotesList(updated);
    localStorage.setItem("campusflow_notebook_notes", JSON.stringify(updated));
  };

  // Pin question review
  const handlePinQuestionToNotes = (q: Question, qidx: number) => {
    let noteContent = `Quiz Question Review (Type: ${quizType.toUpperCase()}):\nQuestion: ${q.question}\n`;
    
    if (quizType === "short_answer") {
      const studentAns = shortAnswerInputs[qidx] || "No answer provided.";
      const grade = shortAnswerGrades[qidx];
      noteContent += `Your Response: "${studentAns}"\nGrade: ${grade?.score || 0}/100\nAI Evaluation: ${grade?.feedback || "Pending"}\nModel Answer: ${q.modelAnswer || ""}`;
    } else {
      const selectedOpt = q.options?.[answers[qidx] ?? -1] || "Unanswered";
      const correctOpt = q.options?.[q.correctIndex ?? 0] || "None";
      noteContent += `Your Selected Option: ${selectedOpt}\nCorrect Option: ${correctOpt}\nExplanation: ${q.explanation}`;
    }

    if (q.citation) {
      noteContent += `\nCitation: "${q.citation}"`;
    }

    const newNote: WrittenNote = {
      id: Math.random().toString(36).substring(7),
      title: `Quiz Result: Q${qidx + 1}`,
      content: noteContent,
      createdAt: new Date().toISOString()
    };

    const updated = [newNote, ...notesList];
    setNotesList(updated);
    localStorage.setItem("campusflow_notebook_notes", JSON.stringify(updated));
    
    setPinnedFeedback(qidx);
    setTimeout(() => setPinnedFeedback(null), 1500);
  };

  // Generate Quiz
  const handleGenerate = async () => {
    const activeSources = sources.filter(s => selectedSourceIds.includes(s.id));
    if (activeSources.length === 0) {
      setError("Please select or add at least one source document first!");
      return;
    }

    const combinedNotes = activeSources.map(s => s.content).join("\n\n");

    setError("");
    setLoading(true);
    setQuestions([]);
    setAnswers({});
    setShortAnswerInputs({});
    setShortAnswerGrades({});
    setSubmitted(false);
    setActiveQuestionIndex(0);
    setActiveView("interactive");

    try {
      const res = await api.post<{ questions: Question[] }>("/api/ai/quiz", {
        notes: combinedNotes,
        count: questionCount,
        type: quizType
      });

      if (res.questions && res.questions.length > 0) {
        setQuestions(res.questions);
      } else {
        throw new Error("AI did not generate any quiz questions. Try pasting longer notes or checking more sources.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [activeQuestionIndex]: optIndex }));
  };

  // Submit Quiz
  const handleSubmitQuiz = async () => {
    const unanswered = questions.length - (
      quizType === "short_answer" 
        ? Object.keys(shortAnswerInputs).length 
        : Object.keys(answers).length
    );

    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. Submit anyway?`)) {
        return;
      }
    }

    if (quizType === "short_answer") {
      setLoading(true);
      setError("");
      
      try {
        const gradesMap: Record<number, ShortAnswerGrade> = {};
        
        const gradingPromises = questions.map(async (q, index) => {
          setGradingProgress(`Grading question ${index + 1} of ${questions.length}...`);
          const userAnswer = shortAnswerInputs[index] || "";
          
          try {
            const result = await api.post<ShortAnswerGrade>("/api/ai/grade-short-answer", {
              question: q.question,
              modelAnswer: q.modelAnswer || "",
              userAnswer: userAnswer.trim()
            });
            return { index, result };
          } catch (e) {
            console.error(e);
            return {
              index,
              result: { score: 0, feedback: "AI evaluation failed for this question.", isCorrect: false }
            };
          }
        });

        const completedGrades = await Promise.all(gradingPromises);
        completedGrades.forEach(g => {
          gradesMap[g.index] = g.result;
        });

        setShortAnswerGrades(gradesMap);
        setSubmitted(true);
        setActiveQuestionIndex(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to grade short answer exam.");
      } finally {
        setLoading(false);
        setGradingProgress("");
      }

    } else {
      setSubmitted(true);
      setActiveQuestionIndex(0);
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setShortAnswerInputs({});
    setShortAnswerGrades({});
    setSubmitted(false);
    setActiveQuestionIndex(0);
    setActiveView("interactive");
  };

  const handleClearQuiz = () => {
    setQuestions([]);
    setAnswers({});
    setShortAnswerInputs({});
    setShortAnswerGrades({});
    setSubmitted(false);
    setActiveQuestionIndex(0);
    setError("");
  };

  // Score metrics
  const calculateScore = () => {
    let scoreCount = 0;
    if (quizType === "short_answer") {
      questions.forEach((_, qi) => {
        if (shortAnswerGrades[qi]?.isCorrect) {
          scoreCount++;
        }
      });
    } else {
      questions.forEach((q, qi) => {
        if (answers[qi] === q.correctIndex) {
          scoreCount++;
        }
      });
    }
    return scoreCount;
  };

  const calculateAverageShortAnswerScore = () => {
    if (questions.length === 0) return 0;
    let sum = 0;
    Object.values(shortAnswerGrades).forEach(g => {
      sum += g.score;
    });
    return Math.round(sum / questions.length);
  };

  const score = calculateScore();
  const avgSAScore = calculateAverageShortAnswerScore();
  const unansweredCount = questions.length - (
    quizType === "short_answer" 
      ? Object.keys(shortAnswerInputs).length 
      : Object.keys(answers).length
  );
  
  const totalCharacters = sources
    .filter(s => selectedSourceIds.includes(s.id))
    .reduce((sum, s) => sum + s.content.length, 0);

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-[#2d3a34] p-6 space-y-6 max-w-6xl mx-auto rounded-[16px]">
      
      {/* Header */}
      <div className="border-b border-[#e4e2db] pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#3d645a] font-semibold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Interactive Assessment
          </div>
          <h1 className="text-3xl font-serif text-[#1b2b24] mt-1 font-bold">
            Notebook Quizzes
          </h1>
          <p className="text-sm text-[#627267] mt-1 italic font-serif">
            Generate customized practice exams from uploaded PDF/text documents, with source citations, like NotebookLM.
          </p>
        </div>

        {/* Global actions */}
        {questions.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearQuiz}
              className="px-3.5 py-2 border border-[#d3c09e] hover:bg-[#fbf8f2] text-xs font-semibold rounded-[10px] text-[#967c47] transition-standard cursor-pointer"
            >
              Clear Quiz
            </button>
            <button
              onClick={handleRestart}
              className="px-3.5 py-2 bg-[#ebeae4] hover:bg-[#e0dfd8] text-xs font-semibold rounded-[10px] text-[#2d3a34] transition-standard cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              Retake Quiz
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-[10px] text-sm text-red-700 animate-in fade-in duration-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600 block flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#f5f4f0] border border-[#e4e2db] rounded-[12px] p-5 space-y-4 shadow-xs">
            
            {/* Sidebar Tabs */}
            <div className="flex gap-1 border-b border-[#e4e2db] pb-2">
              <button
                onClick={() => setSidebarTab("sources")}
                className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-[8px] transition-standard cursor-pointer ${
                  sidebarTab === "sources" ? "bg-[#3d645a] text-white shadow-xs" : "text-[#627267] hover:text-[#2d3a34] hover:bg-[#ebeae4]/50"
                }`}
              >
                Sources ({sources.length})
              </button>
              <button
                onClick={() => setSidebarTab("notes")}
                className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-[8px] transition-standard cursor-pointer ${
                  sidebarTab === "notes" ? "bg-[#3d645a] text-white shadow-xs" : "text-[#627267] hover:text-[#2d3a34] hover:bg-[#ebeae4]/50"
                }`}
              >
                Saved Notes ({notesList.length})
              </button>
            </div>

            {/* TAB 1: Sources */}
            {sidebarTab === "sources" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-[#2d4a43] text-xs uppercase tracking-wider font-mono">
                    Notebook Documents
                  </h4>
                  <button 
                    onClick={() => {
                      setModalSourceId(null);
                      setModalTitle("");
                      setModalContent("");
                      setModalTab("text");
                      setUploadError("");
                      setIsSourceModalOpen(true);
                    }}
                    className="text-[10px] font-semibold text-[#3d645a] hover:text-[#2d4a43] flex items-center gap-1 transition-standard cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Add Source
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {sources.length === 0 ? (
                    <div className="border border-dashed border-[#d2d9d1] rounded-[10px] p-6 text-center text-xs text-[#8c9c91] font-serif italic">
                      No source documents found. Add reference notes.
                    </div>
                  ) : (
                    sources.map((doc) => {
                      const isChecked = selectedSourceIds.includes(doc.id);
                      return (
                        <div 
                          key={doc.id}
                          onClick={() => handleToggleSelectSource(doc.id)}
                          className={`group border rounded-[10px] p-3 transition-standard cursor-pointer flex items-start gap-2.5 relative ${
                            isChecked ? "bg-white border-[#3d645a]/40 shadow-xs" : "bg-transparent border-[#e4e2db] hover:bg-[#ebeae4]/45"
                          }`}
                        >
                          <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectSource(doc.id)}
                              className="w-3.5 h-3.5 accent-[#3d645a] rounded-sm cursor-pointer"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isChecked ? "text-[#3d645a]" : "text-[#8c9c91]"}`} />
                              <h4 className="font-semibold text-xs text-[#2d3a34] truncate pr-12">
                                {doc.title}
                              </h4>
                            </div>
                            <p className="text-[10px] text-[#627267] mt-1 font-mono">
                              {doc.content.split(/\s+/).filter(Boolean).length} words
                            </p>
                          </div>

                          {/* Hover Actions */}
                          <div className="absolute right-2 top-2 flex items-center gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-standard" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleStartEditSource(doc)}
                              className="p-1 text-[#8c9c91] hover:text-[#3d645a] hover:bg-[#ebeae4] rounded-md transition-standard cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteSource(doc.id, e)}
                              className="p-1 text-[#8c9c91] hover:text-red-600 hover:bg-red-50 rounded-md transition-standard cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {sources.length > 0 && (
                  <div className="pt-2 border-t border-[#e4e2db] space-y-3.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#627267] mb-1 uppercase tracking-wider font-mono">
                          Format:
                        </label>
                        <select
                          value={quizType}
                          onChange={(e) => setQuizType(e.target.value as any)}
                          className="w-full px-2 py-1.5 bg-white border border-[#d2d9d1] rounded-[10px] text-[11px] focus:outline-none focus:ring-2 focus:ring-[#3d645a] text-[#2d3a34]"
                        >
                          <option value="mcq">MCQ (4 choices)</option>
                          <option value="tf">True / False</option>
                          <option value="short_answer">Short Essay</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#627267] mb-1 uppercase tracking-wider font-mono">
                          Quantity:
                        </label>
                        <select
                          value={questionCount}
                          onChange={(e) => setQuestionCount(Number(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-[#d2d9d1] rounded-[10px] text-[11px] focus:outline-none focus:ring-2 focus:ring-[#3d645a] text-[#2d3a34]"
                        >
                          <option value={3}>3 Items</option>
                          <option value={5}>5 Items</option>
                          <option value={10}>10 Items</option>
                          <option value={15}>15 Items</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-[#627267] font-mono">
                      <span>Chars Selected:</span>
                      <span className="font-bold text-[#2d3a34]">{totalCharacters.toLocaleString()}</span>
                    </div>
                    
                    <button
                      onClick={handleGenerate}
                      disabled={loading || selectedSourceIds.length === 0}
                      className="w-full py-2.5 bg-[#3d645a] hover:bg-[#2d4a43] disabled:opacity-50 text-white font-semibold rounded-[10px] text-xs transition-standard cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Formulating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Generate Quiz
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Notes */}
            {sidebarTab === "notes" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-[#2d4a43] text-xs uppercase tracking-wider font-mono">
                    Notebook Notes
                  </h4>
                  <button 
                    onClick={() => {
                      setModalNoteId(null);
                      setNoteModalTitle("");
                      setNoteModalContent("");
                      setIsNoteModalOpen(true);
                    }}
                    className="text-[10px] font-semibold text-[#3d645a] hover:text-[#2d4a43] flex items-center gap-1 transition-standard cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Create Note
                  </button>
                </div>

                <div className="space-y-3 max-h-[390px] overflow-y-auto pr-1">
                  {notesList.length === 0 ? (
                    <div className="border border-dashed border-[#d2d9d1] rounded-[10px] p-6 text-center text-xs text-[#8c9c91] font-serif italic">
                      No written notes saved. Pinned quiz items will show here.
                    </div>
                  ) : (
                    notesList.map((note) => (
                      <div 
                        key={note.id}
                        className="bg-white border border-[#e4e2db] rounded-[10px] p-3 shadow-2xs space-y-2 relative group hover:border-[#3d645a]/30 transition-standard"
                      >
                        <div className="flex items-start justify-between gap-6">
                          <h5 className="font-bold text-xs text-[#2d3a34] line-clamp-1 pr-6 font-serif">
                            {note.title}
                          </h5>
                          
                          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-standard">
                            <button
                              onClick={() => handleStartEditNote(note)}
                              className="p-1 text-[#8c9c91] hover:text-[#3d645a] hover:bg-[#ebeae4] rounded-md transition-standard cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 text-[#8c9c91] hover:text-red-600 hover:bg-red-50 rounded-md transition-standard cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-[#627267] font-serif leading-relaxed line-clamp-4 whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Workspace */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Empty State */}
          {questions.length === 0 && !loading && (
            <div className="h-[460px] border border-dashed border-[#e4e2db] rounded-[12px] flex flex-col items-center justify-center text-center p-8 bg-[#fdfdfd] shadow-xs">
              <div className="w-14 h-14 rounded-full bg-[#f5f4f0] flex items-center justify-center mb-4 text-[#3d645a] border border-[#e4e2db]">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1b2b24] font-serif">Assessment Center</h3>
              <p className="text-sm text-[#627267] max-w-sm font-serif italic mt-2">
                Check study notes or upload files on the left, then click <strong className="text-[#3d645a]">"Generate Quiz"</strong> to study.
              </p>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setSidebarTab("sources");
                    setModalSourceId(null);
                    setModalTitle("");
                    setModalContent("");
                    setModalTab("upload"); // Open on upload tab
                    setUploadError("");
                    setIsSourceModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-[#3d645a] hover:bg-[#2d4a43] text-white font-semibold rounded-[10px] text-xs transition-standard cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  Upload Document (PDF/Text)
                </button>
                
                {selectedSourceIds.length > 0 && (
                  <button
                    onClick={handleGenerate}
                    className="px-5 py-2.5 bg-[#ebeae4] hover:bg-[#e0dfd8] text-[#2d3a34] font-semibold rounded-[10px] text-xs transition-standard cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Quiz ({questionCount} Qs)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="h-[460px] border border-[#e4e2db] rounded-[12px] bg-white flex flex-col items-center justify-center text-center p-8 shadow-xs">
              <Loader2 className="w-10 h-10 text-[#3d645a] animate-spin mb-4" />
              <h3 className="text-lg font-bold text-[#1b2b24] font-serif">
                {gradingProgress ? "AI Assessment Grader" : "Drafting Questions"}
              </h3>
              <p className="text-sm text-[#627267] max-w-xs font-serif italic mt-1.5 leading-relaxed">
                {gradingProgress || "Reading active documents and preparing testing keys..."}
              </p>
            </div>
          )}

          {/* Active Quiz */}
          {questions.length > 0 && !loading && (
            <div className="space-y-5">
              
              {/* Tabs */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-b border-[#e4e2db] pb-2 gap-3">
                <div className="flex items-center gap-1.5 bg-[#ebeae4]/60 p-1 rounded-[10px]">
                  <button
                    onClick={() => setActiveView("interactive")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[8px] transition-standard cursor-pointer ${
                      activeView === "interactive" ? "bg-[#3d645a] text-white shadow-xs" : "text-[#627267] hover:text-[#2d3a34]"
                    }`}
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    Interactive Workspace
                  </button>
                  
                  {submitted && (
                    <button
                      onClick={() => setActiveView("review-sheet")}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[8px] transition-standard cursor-pointer ${
                        activeView === "review-sheet" ? "bg-[#3d645a] text-white shadow-xs" : "text-[#627267] hover:text-[#2d3a34]"
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Detailed Review Sheet
                    </button>
                  )}
                </div>

                <div className="text-xs font-semibold">
                  {submitted ? (
                    <span className="text-[#3d645a] bg-green-50 border border-green-150 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                      {quizType === "short_answer" ? `OVERALL: ${avgSAScore}% Avg` : `SCORE: ${score} / ${questions.length}`}
                    </span>
                  ) : (
                    <span className="text-[#627267]">
                      Progress: {quizType === "short_answer" ? Object.keys(shortAnswerInputs).length : Object.keys(answers).length} / {questions.length} answered
                    </span>
                  )}
                </div>
              </div>

              {/* View Rendering */}
              {!submitted || activeView === "interactive" ? (
                /* INTERACTIVE VIEW */
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  
                  <div className="md:col-span-8 bg-white border border-[#e4e2db] rounded-[12px] p-6 shadow-xs space-y-6">
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#3d645a] tracking-wider uppercase font-mono">
                          QUESTION {activeQuestionIndex + 1} OF {questions.length} · {quizType.toUpperCase()}
                        </span>
                        
                        {submitted && (
                          quizType === "short_answer" ? (
                            shortAnswerGrades[activeQuestionIndex]?.isCorrect ? (
                              <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full">Passed ({shortAnswerGrades[activeQuestionIndex]?.score}%)</span>
                            ) : (
                              <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full">Refine ({shortAnswerGrades[activeQuestionIndex]?.score}%)</span>
                            )
                          ) : (
                            answers[activeQuestionIndex] === questions[activeQuestionIndex].correctIndex ? (
                              <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full">✓ Correct</span>
                            ) : (
                              <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full">✗ Incorrect</span>
                            )
                          )
                        )}
                      </div>
                      
                      <h3 className="text-lg font-bold text-[#1b2b24] font-serif leading-relaxed">
                        {questions[activeQuestionIndex].question}
                      </h3>
                    </div>

                    {/* Options (MCQ/TF) */}
                    {quizType !== "short_answer" && (
                      <div className="grid grid-cols-1 gap-3">
                        {questions[activeQuestionIndex].options?.map((option, optIdx) => {
                          const isSelected = answers[activeQuestionIndex] === optIdx;
                          const isCorrect = questions[activeQuestionIndex].correctIndex === optIdx;
                          const optionLetter = String.fromCharCode(65 + optIdx);
                          
                          let cardStyle = "flex items-center gap-3.5 p-4 border border-[#e4e2db] rounded-[10px] text-sm cursor-pointer transition-standard hover:bg-[#fcfbfa] hover:border-[#3d645a]/50 text-[#2d3a34]";
                          let letterBadgeStyle = "w-7 h-7 rounded-full bg-[#ebeae4] text-[#627267] font-semibold text-xs flex items-center justify-center flex-shrink-0 transition-standard";
                          
                          if (submitted) {
                            if (isCorrect) {
                              cardStyle = "flex items-center gap-3.5 p-4 border border-green-200 bg-[#f2f6f3] text-green-800 rounded-[10px] text-sm font-medium";
                              letterBadgeStyle = "w-7 h-7 rounded-full bg-green-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0";
                            } else if (isSelected) {
                              cardStyle = "flex items-center gap-3.5 p-4 border border-red-200 bg-red-50 text-red-800 rounded-[10px] text-sm font-medium";
                              letterBadgeStyle = "w-7 h-7 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0";
                            } else {
                              cardStyle = "flex items-center gap-3.5 p-4 border border-[#e4e2db] rounded-[10px] text-sm opacity-55 pointer-events-none";
                            }
                          } else if (isSelected) {
                            cardStyle = "flex items-center gap-3.5 p-4 border border-[#3d645a] bg-[#f4f6f3] text-[#2d4a43] rounded-[10px] text-sm font-semibold shadow-xs";
                            letterBadgeStyle = "w-7 h-7 rounded-full bg-[#3d645a] text-white font-bold text-xs flex items-center justify-center flex-shrink-0";
                          }

                          return (
                            <div key={optIdx} onClick={() => handleSelectOption(optIdx)} className={cardStyle}>
                              <span className={letterBadgeStyle}>{optionLetter}</span>
                              <span className="font-serif">{option}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Short Answer Input */}
                    {quizType === "short_answer" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#627267] mb-1.5 uppercase tracking-wider font-mono">
                            Your Response:
                          </label>
                          <textarea
                            value={shortAnswerInputs[activeQuestionIndex] || ""}
                            onChange={(e) => setShortAnswerInputs(prev => ({ ...prev, [activeQuestionIndex]: e.target.value }))}
                            disabled={submitted}
                            className="w-full h-32 px-3.5 py-2.5 bg-[#fcfbfa] border border-[#d2d9d1] focus:bg-white rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-[#3d645a] resize-none text-[#2d3a34] font-serif leading-relaxed placeholder-[#a6b2a9]"
                            placeholder="Synthesize your response..."
                          />
                        </div>

                        {submitted && (
                          <div className="space-y-4 border-t border-[#f5f4f0] pt-4">
                            {shortAnswerGrades[activeQuestionIndex] && (
                              <div className={`p-4 rounded-[10px] border ${
                                shortAnswerGrades[activeQuestionIndex].isCorrect ? "bg-[#f2f6f3] border-green-200 text-green-900" : "bg-red-50 border-red-200 text-red-900"
                              }`}>
                                <div className="flex justify-between items-center mb-1.5">
                                  <h5 className="font-bold text-xs uppercase tracking-wider font-mono">AI Evaluation Result</h5>
                                  <span className="text-xs font-bold font-mono">Score: {shortAnswerGrades[activeQuestionIndex].score} / 100</span>
                                </div>
                                <p className="text-xs font-serif leading-relaxed">{shortAnswerGrades[activeQuestionIndex].feedback}</p>
                              </div>
                            )}

                            {questions[activeQuestionIndex].modelAnswer && (
                              <div className="bg-[#f5f4f0] border border-[#e4e2db] rounded-[10px] p-4 text-xs text-[#627267] font-serif">
                                <strong className="text-[#3d645a] font-sans block mb-1 uppercase tracking-wider text-[10px]">Model Answer Guide:</strong>
                                "{questions[activeQuestionIndex].modelAnswer}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {submitted && (
                      <div className="space-y-3.5 border-t border-[#f5f4f0] pt-4">
                        {questions[activeQuestionIndex].explanation && (
                          <div className="bg-[#f9faf8] border border-[#e4e2db] rounded-[10px] p-4 text-xs text-[#627267] font-serif leading-relaxed">
                            <strong className="text-[#3d645a] font-sans block mb-1 uppercase tracking-wider text-[10px]">Explanation Key:</strong>
                            {questions[activeQuestionIndex].explanation}
                          </div>
                        )}

                        {questions[activeQuestionIndex].citation && (
                          <div className="bg-[#f4f3ef] border-l-2 border-[#3d645a] p-3 text-xs text-[#627267] font-serif italic rounded-r-[4px]">
                            <strong className="text-[10px] font-bold text-[#3d645a] font-sans block not-italic uppercase mb-0.5">Reference Source Quote:</strong>
                            "{questions[activeQuestionIndex].citation}"
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-[#f5f4f0] pt-4 mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
                          disabled={activeQuestionIndex === 0}
                          className="inline-flex items-center gap-1 px-3.5 py-2 border border-[#d2d9d1] hover:bg-[#f1f3f0] text-xs font-semibold rounded-[10px] transition-standard"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Previous
                        </button>
                        
                        {submitted && (
                          <button
                            onClick={() => handlePinQuestionToNotes(questions[activeQuestionIndex], activeQuestionIndex)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#627267] hover:text-[#3d645a] hover:bg-[#f5f4f0] rounded-[8px] transition-standard cursor-pointer"
                          >
                            {pinnedFeedback === activeQuestionIndex ? <Check className="w-3.5 h-3.5 text-green-700 animate-bounce" /> : <Pin className="w-3.5 h-3.5" />}
                            <span>{pinnedFeedback === activeQuestionIndex ? "Pinned!" : "Pin Review"}</span>
                          </button>
                        )}
                      </div>
                      
                      {activeQuestionIndex < questions.length - 1 ? (
                        <button
                          onClick={() => setActiveQuestionIndex((prev) => prev + 1)}
                          className="inline-flex items-center gap-1 px-3.5 py-2 bg-[#3d645a] hover:bg-[#2d4a43] text-white text-xs font-semibold rounded-[10px] transition-standard"
                        >
                          Next <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        !submitted && (
                          <button
                            onClick={handleSubmitQuiz}
                            className="px-5 py-2 bg-[#3d645a] hover:bg-[#2d4a43] text-white text-xs font-bold rounded-[10px] transition-standard shadow-xs"
                          >
                            {quizType === "short_answer" ? "Grade & Submit" : "Submit Exam"}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Question Grid */}
                  <div className="md:col-span-4 bg-[#f5f4f0] border border-[#e4e2db] rounded-[12px] p-5 space-y-4 shadow-xs">
                    <h4 className="font-semibold text-xs text-[#2d4a43] uppercase tracking-wider font-mono">Question Tracker</h4>

                    <div className="grid grid-cols-5 gap-2">
                      {questions.map((_, idx) => {
                        const isCurrent = activeQuestionIndex === idx;
                        const isAnswered = quizType === "short_answer" 
                          ? shortAnswerInputs[idx] && shortAnswerInputs[idx].trim().length > 0
                          : answers[idx] !== undefined;
                        
                        const correct = quizType === "short_answer" ? shortAnswerGrades[idx]?.isCorrect : answers[idx] === questions[idx].correctIndex;
                        
                        let dotStyle = "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold font-sans cursor-pointer transition-standard border ";
                        
                        if (submitted) {
                          dotStyle += correct ? "bg-[#f2f6f3] border-green-500 text-green-700" : "bg-red-50 border-red-500 text-red-700";
                        } else if (isCurrent) {
                          dotStyle += "bg-[#3d645a] border-[#3d645a] text-white shadow-xs";
                        } else if (isAnswered) {
                          dotStyle += "bg-[#e5ece9] border-[#3d645a]/30 text-[#2d4a43]";
                        } else {
                          dotStyle += "bg-white border-[#e4e2db] text-[#627267]";
                        }

                        return (
                          <button key={idx} onClick={() => setActiveQuestionIndex(idx)} className={dotStyle}>
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>

                    {!submitted && unansweredCount > 0 && (
                      <div className="p-3 bg-[#fdf9f2] border border-[#eedebb] text-[#967c47] rounded-[10px] text-[10px] font-serif leading-normal">
                        ⚠️ <strong>{unansweredCount} item{unansweredCount > 1 ? "s" : ""} left.</strong> Complete all responses.
                      </div>
                    )}
                    
                    {!submitted && unansweredCount === 0 && (
                      <button onClick={handleSubmitQuiz} className="w-full py-2 bg-[#3d645a] hover:bg-[#2d4a43] text-white text-xs font-semibold rounded-[10px] transition-standard shadow-xs">
                        Submit Responses
                      </button>
                    )}
                  </div>

                </div>
              ) : (
                /* REPORT SHEET */
                <div className="space-y-6">
                  <div className="bg-white border border-[#e4e2db] rounded-[12px] p-8 shadow-xs text-center space-y-6">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="w-14 h-14 rounded-full bg-[#f2f6f3] border border-[#d2edd7] text-[#3d645a] flex items-center justify-center mx-auto mb-2">
                        <Award className="w-7 h-7" />
                      </div>
                      <h2 className="text-2xl font-bold text-[#1b2b24] font-serif">Assessment Summary</h2>
                      <p className="text-sm text-[#627267] font-serif italic">Results based on reference notes:</p>
                    </div>

                    <div className="max-w-xs mx-auto bg-[#fcfbfa] border border-[#e4e2db] rounded-[12px] p-5 text-center space-y-1 shadow-xs">
                      <div className="text-4xl font-extrabold text-[#3d645a]">
                        {quizType === "short_answer" ? `${avgSAScore}%` : `${score} / ${questions.length}`}
                      </div>
                      <div className="text-xs font-semibold text-[#627267] uppercase tracking-wider font-mono">
                        {quizType === "short_answer" ? "Average AI Grade" : "Passed Items"}
                      </div>
                      <div className="w-full bg-[#ebeae4] h-2 rounded-full overflow-hidden mt-3.5">
                        <div 
                          className="h-full bg-[#3d645a] transition-all duration-500"
                          style={{ width: `${quizType === "short_answer" ? avgSAScore : (score / questions.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-center gap-3 pt-4 border-t border-[#f5f4f0] max-w-md mx-auto">
                      <button onClick={handleRestart} className="px-4 py-2 border border-[#3d645a] hover:bg-[#f1f3f0] text-[#3d645a] font-semibold rounded-[10px] text-xs transition-standard flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" /> Retake Quiz
                      </button>
                      <button onClick={() => setActiveView("interactive")} className="px-4 py-2 bg-[#3d645a] hover:bg-[#2d4a43] text-white font-semibold rounded-[10px] text-xs transition-standard shadow-xs">
                        Inspect Citations
                      </button>
                      <button onClick={handleClearQuiz} className="px-4 py-2 bg-[#ebeae4] hover:bg-[#e0dfd8] text-[#2d3a34] font-semibold rounded-[10px] text-xs transition-standard">
                        Change Sources
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e4e2db] rounded-[12px] overflow-hidden divide-y divide-[#e4e2db] shadow-xs">
                    {questions.map((q, qidx) => {
                      const passed = quizType === "short_answer" ? shortAnswerGrades[qidx]?.isCorrect : answers[qidx] === q.correctIndex;
                      return (
                        <div key={qidx} className="p-6 space-y-4 hover:bg-[#fcfbfa] relative group">
                          <button onClick={() => handlePinQuestionToNotes(q, qidx)} className="absolute right-4 top-4 p-2 text-[#8c9c91] hover:text-[#3d645a] hover:bg-[#f5f4f0] rounded-md opacity-0 group-hover:opacity-100 transition-standard">
                            {pinnedFeedback === qidx ? <Check className="w-4.5 h-4.5 text-green-700" /> : <Pin className="w-4.5 h-4.5" />}
                          </button>

                          <div className="flex items-center justify-between">
                            <span className="bg-[#ebeae4] text-[#2d3a34] text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">QUESTION {qidx + 1}</span>
                            <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${passed ? "text-green-700 bg-green-50 border border-green-150" : "text-red-700 bg-red-50 border border-red-150"}`}>
                              {quizType === "short_answer" ? `Score (${shortAnswerGrades[qidx]?.score}%)` : passed ? "✓ Correct" : "✗ Incorrect"}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-[#1b2b24] font-serif pr-16">{q.question}</h3>

                          {quizType !== "short_answer" && q.options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                              {q.options.map((opt, oidx) => {
                                const selectedByUs = answers[qidx] === oidx;
                                const correctOne = q.correctIndex === oidx;
                                let style = "text-xs p-2.5 border rounded-[8px] flex items-center gap-2 font-serif ";
                                if (correctOne) style += "border-green-300 bg-green-50/65 text-green-800 font-semibold";
                                else if (selectedByUs) style += "border-red-300 bg-red-50/65 text-red-800 font-semibold";
                                else style += "border-[#e4e2db] text-[#627267] opacity-60";

                                return (
                                  <div key={oidx} className={style}>
                                    <span className="font-semibold">{String.fromCharCode(65 + oidx)}.</span>
                                    <span>{opt}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {quizType === "short_answer" && (
                            <div className="space-y-3.5 pl-3 border-l-2 border-[#d2d9d1]">
                              <div className="text-xs text-[#2d3a34] font-serif">
                                <strong className="text-[10px] font-bold text-[#627267] uppercase block font-sans mb-0.5">Your Response:</strong>
                                "{shortAnswerInputs[qidx] || "Unanswered"}"
                              </div>
                              {shortAnswerGrades[qidx] && (
                                <div className="text-xs text-[#627267] font-serif">
                                  <strong className="text-[10px] font-bold text-[#3d645a] uppercase block font-sans mb-0.5 font-bold">Feedback ({shortAnswerGrades[qidx].score}/100):</strong>
                                  {shortAnswerGrades[qidx].feedback}
                                </div>
                              )}
                              {q.modelAnswer && (
                                <div className="text-xs text-[#627267] font-serif bg-[#f5f4f0] p-3 rounded-[8px]">
                                  <strong className="text-[10px] font-bold text-[#627267] uppercase block font-sans mb-0.5">Model Answer Guide:</strong>
                                  "{q.modelAnswer}"
                                </div>
                              )}
                            </div>
                          )}

                          <div className="space-y-2.5">
                            {q.explanation && (
                              <div className="bg-[#f9faf8] border border-[#e4e2db] rounded-[10px] p-4 text-xs text-[#627267] font-serif leading-relaxed">
                                <strong className="text-[#3d645a] font-sans block mb-1 uppercase tracking-wider text-[10px]">Concept Explanation:</strong>
                                {q.explanation}
                              </div>
                            )}
                            {q.citation && (
                              <div className="bg-[#f4f3ef] border-l-2 border-[#3d645a] p-3.5 text-xs text-[#627267] font-serif italic rounded-r-[4px]">
                                <strong className="text-[10px] font-bold text-[#3d645a] font-sans block not-italic uppercase mb-0.5">Supporting Citation:</strong>
                                "{q.citation}"
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Sources CRUD Modal */}
      {isSourceModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#fcfbfa] border border-[#e4e2db] rounded-[12px] p-6 max-w-lg w-full shadow-lg space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#e4e2db] pb-3">
              <h3 className="text-lg font-bold text-[#1b2b24] font-serif flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#3d645a]" />
                {modalSourceId ? "Edit Source Document" : "Add Source Document"}
              </h3>
              <button
                onClick={() => {
                  setIsSourceModalOpen(false);
                  setModalTitle("");
                  setModalContent("");
                  setModalSourceId(null);
                }}
                className="text-xs text-[#8c9c91] hover:text-[#2d3a34] font-semibold"
              >
                Close
              </button>
            </div>

            {!modalSourceId && (
              <div className="flex gap-1 bg-[#ebeae4]/60 p-1 rounded-[10px]">
                <button
                  onClick={() => setModalTab("text")}
                  className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-[8px] transition-standard ${
                    modalTab === "text" ? "bg-[#3d645a] text-white shadow-xs" : "text-[#627267] hover:text-[#2d3a34]"
                  }`}
                >
                  Write / Paste Text
                </button>
                <button
                  onClick={() => setModalTab("upload")}
                  className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-[8px] transition-standard ${
                    modalTab === "upload" ? "bg-[#3d645a] text-white shadow-xs" : "text-[#627267] hover:text-[#2d3a34]"
                  }`}
                >
                  Upload File
                </button>
              </div>
            )}

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[10px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {modalTab === "text" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#627267] mb-1.5 uppercase tracking-wider">Document Title *</label>
                  <input
                    type="text"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#d2d9d1] rounded-[10px] text-xs focus:outline-none focus:ring-2 focus:ring-[#3d645a] text-[#2d3a34]"
                    placeholder="e.g. Photosynthesis Notes"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#627267] mb-1.5 uppercase tracking-wider">Document Content *</label>
                  <textarea
                    value={modalContent}
                    onChange={(e) => setModalContent(e.target.value)}
                    className="w-full h-44 px-3 py-2 bg-white border border-[#d2d9d1] rounded-[10px] text-xs focus:outline-none focus:ring-2 focus:ring-[#3d645a] resize-none text-[#2d3a34] font-serif leading-relaxed"
                    placeholder="Paste details or notes..."
                  />
                </div>
              </div>
            )}

            {modalTab === "upload" && (
              <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-[#d2d9d1] rounded-[12px] bg-white transition-standard hover:bg-[#fcfbfa]/50 text-center p-6 relative">
                {fileLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#3d645a] animate-spin" />
                    <p className="text-xs font-serif text-[#627267] italic animate-pulse">Parsing document text...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-[#8c9c91] mb-2" />
                    <p className="text-xs font-bold text-[#2d3a34]">Select study document</p>
                    <p className="text-[10px] text-[#627267] mt-1 font-serif max-w-xs leading-normal">
                      Drag and drop your file here, or click to browse. Supports <strong className="text-[#3d645a]">PDF, TXT, and Markdown (.md)</strong>.
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.txt,.md"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e4e2db]">
              <button
                onClick={() => {
                  setIsSourceModalOpen(false);
                  setModalTitle("");
                  setModalContent("");
                  setModalSourceId(null);
                }}
                className="px-4 py-2 border border-[#d2d9d1] hover:bg-[#f1f3f0] text-[#2d3a34] font-semibold rounded-[10px] text-xs transition-standard"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSaveSource}
                disabled={modalTab !== "text" || !modalTitle.trim() || !modalContent.trim()}
                className="px-4 py-2 bg-[#3d645a] hover:bg-[#2d4a43] disabled:opacity-50 text-white font-semibold rounded-[10px] text-xs transition-standard shadow-xs"
              >
                {modalSourceId ? "Save Changes" : "Add to Notebook"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Written Note CRUD Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#fcfbfa] border border-[#e4e2db] rounded-[12px] p-6 max-w-lg w-full shadow-lg space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#e4e2db] pb-3">
              <h3 className="text-lg font-bold text-[#1b2b24] font-serif flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#3d645a]" />
                {modalNoteId ? "Edit Study Note" : "Write Custom Note"}
              </h3>
              <button
                onClick={() => {
                  setIsNoteModalOpen(false);
                  setNoteModalTitle("");
                  setNoteModalContent("");
                  setModalNoteId(null);
                }}
                className="text-xs text-[#8c9c91] hover:text-[#2d3a34] font-semibold"
              >
                Close
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#627267] mb-1.5 uppercase tracking-wider">Note Title *</label>
                <input
                  type="text"
                  value={noteModalTitle}
                  onChange={(e) => setNoteModalTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#d2d9d1] rounded-[10px] text-xs focus:outline-none focus:ring-2 focus:ring-[#3d645a] text-[#2d3a34]"
                  placeholder="Summary points"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#627267] mb-1.5 uppercase tracking-wider">Note Content *</label>
                <textarea
                  value={noteModalContent}
                  onChange={(e) => setNoteModalContent(e.target.value)}
                  className="w-full h-44 px-3 py-2 bg-white border border-[#d2d9d1] rounded-[10px] text-xs focus:outline-none focus:ring-2 focus:ring-[#3d645a] resize-none text-[#2d3a34] font-serif leading-relaxed"
                  placeholder="Write note details..."
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e4e2db]">
              <button
                onClick={() => {
                  setIsNoteModalOpen(false);
                  setNoteModalTitle("");
                  setNoteModalContent("");
                  setModalNoteId(null);
                }}
                className="px-4 py-2 border border-[#d2d9d1] hover:bg-[#f1f3f0] text-[#2d3a34] font-semibold rounded-[10px] text-xs transition-standard"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 bg-[#3d645a] hover:bg-[#2d4a43] text-white font-semibold rounded-[10px] text-xs transition-standard shadow-xs"
              >
                {modalNoteId ? "Save Note" : "Create Note"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
