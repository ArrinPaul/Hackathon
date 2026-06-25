"use client";

import { useState, useEffect } from "react";
import { 
  Layers, 
  BookOpen, 
  Trash2, 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  CheckCircle, 
  XCircle, 
  Bookmark, 
  HelpCircle,
  Sparkles,
  RefreshCw,
  Plus,
  FileText,
  Edit2,
  Copy,
  Check,
  Grid,
  List,
  ChevronRight,
  Info,
  Pin,
  Save,
  CheckSquare,
  Upload,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";

interface Flashcard {
  id: number;
  front: string;
  back: string;
  citation?: string;
  status?: "mastered" | "review" | "unseen";
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

export default function FlashcardsPage() {
  // Sidebar Tabs: "sources" | "notes"
  const [sidebarTab, setSidebarTab] = useState<"sources" | "notes">("sources");

  // Sources State
  const [sources, setSources] = useState<SourceDoc[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  
  // Pinned/Written Notes State
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

  // Flashcards state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  
  // Workspace Views: "carousel" | "grid" | "list"
  const [activeView, setActiveView] = useState<"carousel" | "grid" | "list">("carousel");
  
  // Flashcard Grid Individual Flip States
  const [gridFlippedState, setGridFlippedState] = useState<Record<number, boolean>>({});

  // Inline Flashcard Editing States
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [editCardFront, setEditCardFront] = useState("");
  const [editCardBack, setEditCardBack] = useState("");
  const [editCardCitation, setEditCardCitation] = useState("");

  // Manual Card Addition Inputs
  const [showAddCardInline, setShowAddCardInline] = useState(false);
  const [newCardFront, setNewCardFront] = useState("");
  const [newCardBack, setNewCardBack] = useState("");
  const [newCardCitation, setNewCardCitation] = useState("");

  // Copy Feedback State
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [pinnedFeedback, setPinnedFeedback] = useState<number | null>(null);

  // Initialize Data from localStorage
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

    // 2. Load Pinned Notes
    const savedNotes = localStorage.getItem("campusflow_notebook_notes");
    if (savedNotes) {
      try {
        setNotesList(JSON.parse(savedNotes));
      } catch (e) {
        console.error(e);
      }
    } else {
      const defaultNote: WrittenNote = {
        id: "note-1",
        title: "My Study Strategy",
        content: "Draft flashcards for lecture topics immediately after classes. Review reviews on spaced interval schedules. Focus on active self-testing.",
        createdAt: new Date().toISOString()
      };
      setNotesList([defaultNote]);
      localStorage.setItem("campusflow_notebook_notes", JSON.stringify([defaultNote]));
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

  // Document Upload File Handler
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
        // Text / Markdown files
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

      // Populate form and switch tab
      setModalTitle(file.name.replace(/\.[^/.]+$/, ""));
      setModalContent(extractedText);
      setModalTab("text"); // Switch back to text view to review/edit
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error reading uploaded file.");
    } finally {
      setFileLoading(false);
      // Clear file input value to allow uploading same file again if edited
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

  // Trigger Edit Source
  const handleStartEditSource = (doc: SourceDoc) => {
    setModalSourceId(doc.id);
    setModalTitle(doc.title);
    setModalContent(doc.content);
    setModalTab("text");
    setUploadError("");
    setIsSourceModalOpen(true);
  };

  // Delete Source Document
  const handleDeleteSource = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this source document?")) return;

    const updated = sources.filter(s => s.id !== id);
    setSources(updated);
    setSelectedSourceIds(prev => prev.filter(selectedId => selectedId !== id));
    localStorage.setItem("campusflow_notebook_sources", JSON.stringify(updated));
  };

  // Toggle Source selection
  const handleToggleSelectSource = (id: string) => {
    setSelectedSourceIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  // Pinned/Written Note Save
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

  // Pin a Flashcard to Pinned Notes
  const handlePinCardToNotes = (card: Flashcard, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newNote: WrittenNote = {
      id: Math.random().toString(36).substring(7),
      title: `Saved Concept: ${card.front.substring(0, 30)}...`,
      content: `Flashcard Concept Detail:\nPrompt: ${card.front}\nAnswer: ${card.back}${card.citation ? `\nCitation: "${card.citation}"` : ""}`,
      createdAt: new Date().toISOString()
    };
    
    const updated = [newNote, ...notesList];
    setNotesList(updated);
    localStorage.setItem("campusflow_notebook_notes", JSON.stringify(updated));
    
    setPinnedFeedback(index);
    setTimeout(() => setPinnedFeedback(null), 1500);
  };

  // Generate Flashcards
  const handleGenerate = async () => {
    const activeSources = sources.filter(s => selectedSourceIds.includes(s.id));
    if (activeSources.length === 0) {
      setError("Please select or add at least one source document first!");
      return;
    }

    const combinedNotes = activeSources.map(s => s.content).join("\n\n");
    
    setError("");
    setLoading(true);
    setIsFlipped(false);
    setShowSummary(false);
    setFlashcards([]);
    setGridFlippedState({});
    setEditingCardId(null);

    try {
      const res = await api.post<{ flashcards: Flashcard[] }>("/api/ai/flashcards", { 
        notes: combinedNotes 
      });
      
      if (res.flashcards && res.flashcards.length > 0) {
        const mappedCards = res.flashcards.map((c, index) => ({
          id: index,
          front: c.front,
          back: c.back,
          citation: c.citation || "Derived from source reference.",
          status: "unseen" as const
        }));
        setFlashcards(mappedCards);
        setCurrentIndex(0);
      } else {
        throw new Error("AI did not generate any flashcards. Try pasting longer text or adding more sources.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate flashcards");
    } finally {
      setLoading(false);
    }
  };

  // Add custom manual card
  const handleAddManualCard = () => {
    if (!newCardFront.trim() || !newCardBack.trim()) {
      alert("Please provide both front and back values.");
      return;
    }

    const newCard: Flashcard = {
      id: flashcards.length,
      front: newCardFront.trim(),
      back: newCardBack.trim(),
      citation: newCardCitation.trim() || "Manually added concept.",
      status: "unseen" as const
    };

    setFlashcards(prev => [...prev, newCard]);
    setNewCardFront("");
    setNewCardBack("");
    setNewCardCitation("");
    setShowAddCardInline(false);
    
    setCurrentIndex(flashcards.length);
    setIsFlipped(false);
  };

  // Edit card inline
  const handleStartEditCard = (card: Flashcard, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCardId(card.id);
    setEditCardFront(card.front);
    setEditCardBack(card.back);
    setEditCardCitation(card.citation || "");
  };

  const handleSaveCardEdit = () => {
    if (!editCardFront.trim() || !editCardBack.trim()) {
      alert("Question prompt and answer content cannot be empty.");
      return;
    }

    setFlashcards(prev => 
      prev.map(c => 
        c.id === editingCardId 
          ? { ...c, front: editCardFront.trim(), back: editCardBack.trim(), citation: editCardCitation.trim() } 
          : c
      )
    );
    setEditingCardId(null);
  };

  // Delete specific card
  const handleDeleteCard = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this flashcard?")) return;
    
    const updated = flashcards.filter(c => c.id !== id).map((c, index) => ({
      ...c,
      id: index
    }));
    setFlashcards(updated);
    
    if (currentIndex >= updated.length && updated.length > 0) {
      setCurrentIndex(updated.length - 1);
    }
    setIsFlipped(false);
  };

  // Mark mastery status
  const handleSetStatus = (status: "mastered" | "review") => {
    if (flashcards.length === 0) return;
    
    setFlashcards((prev) => 
      prev.map((c, index) => index === currentIndex ? { ...c, status } : c)
    );

    if (currentIndex < flashcards.length - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      }, 250);
    } else {
      setTimeout(() => {
        setShowSummary(true);
      }, 400);
    }
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

  const handleRestart = () => {
    setFlashcards((prev) => prev.map(c => ({ ...c, status: "unseen" })));
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowSummary(false);
  };

  const handleRestudyReviews = () => {
    const reviewsOnly = flashcards.filter(c => c.status === "review").map((c, index) => ({
      ...c,
      id: index,
      status: "unseen" as const
    }));
    setFlashcards(reviewsOnly);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowSummary(false);
  };

  const handleClearDeck = () => {
    setFlashcards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowSummary(false);
    setError("");
  };

  const handleCopyCard = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const card = flashcards[index];
    navigator.clipboard.writeText(`Q: ${card.front}\nA: ${card.back}`);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleCopyAll = () => {
    const text = flashcards.map((c, idx) => `Card ${idx + 1}\nQuestion: ${c.front}\nAnswer: ${c.back}\n`).join("\n---\n\n");
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Keyboard navigation for Study Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "INPUT") {
        return;
      }

      if (flashcards.length === 0 || showSummary || activeView !== "carousel" || editingCardId !== null) return;

      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "1") {
        handleSetStatus("review");
      } else if (e.key === "2") {
        handleSetStatus("mastered");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flashcards, currentIndex, showSummary, activeView, editingCardId]);

  // Compute Metrics
  const masteredCount = flashcards.filter((c) => c.status === "mastered").length;
  const reviewCount = flashcards.filter((c) => c.status === "review").length;
  const unseenCount = flashcards.filter((c) => c.status === "unseen").length;
  const totalCharacters = sources
    .filter(s => selectedSourceIds.includes(s.id))
    .reduce((sum, s) => sum + s.content.length, 0);

  return (
    <div className="min-h-screen bg-[#fdfaff] text-[#2d3a34] p-6 space-y-6 max-w-6xl mx-auto rounded-[16px]">
      
      {/* Header */}
      <div className="border-b border-[#e0d4f0] pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#5b21b6] font-semibold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Interactive Study Guide
          </div>
          <h1 className="text-3xl font-serif text-[#2d1055] mt-1 font-bold">
            Notebook Flashcards
          </h1>
          <p className="text-sm text-[#6b5a80] mt-1 italic font-serif">
            Upload text or PDF files, write notes, and rate cards with direct source citations, matching NotebookLM.
          </p>
        </div>

        {/* Global actions */}
        {flashcards.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddCardInline(!showAddCardInline)}
              className="px-3.5 py-2 border border-[#5b21b6] hover:bg-[#e8e0f2]/40 text-xs font-semibold rounded-[10px] text-[#5b21b6] transition-standard cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Custom Card
            </button>
            <button
              onClick={handleClearDeck}
              className="px-3.5 py-2 border border-[#c4a8f0] hover:bg-[#fbf8f2] text-xs font-semibold rounded-[10px] text-[#7c3aed] transition-standard cursor-pointer"
            >
              Clear Deck
            </button>
            <button
              onClick={handleCopyAll}
              className="px-3.5 py-2 bg-[#e8e0f2] hover:bg-[#e0daf0] text-xs font-semibold rounded-[10px] text-[#2d3a34] transition-standard cursor-pointer flex items-center gap-1.5"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-purple-700" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedAll ? "Copied All!" : "Copy Deck"}
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
          <div className="bg-[#f3eff8] border border-[#e0d4f0] rounded-[12px] p-5 space-y-4 shadow-xs">
            
            {/* Sidebar Tabs */}
            <div className="flex gap-1 border-b border-[#e0d4f0] pb-2">
              <button
                onClick={() => setSidebarTab("sources")}
                className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-[8px] transition-standard cursor-pointer ${
                  sidebarTab === "sources"
                    ? "bg-[#5b21b6] text-white shadow-xs"
                    : "text-[#6b5a80] hover:text-[#2d3a34] hover:bg-[#e8e0f2]/50"
                }`}
              >
                Sources ({sources.length})
              </button>
              <button
                onClick={() => setSidebarTab("notes")}
                className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-[8px] transition-standard cursor-pointer ${
                  sidebarTab === "notes"
                    ? "bg-[#5b21b6] text-white shadow-xs"
                    : "text-[#6b5a80] hover:text-[#2d3a34] hover:bg-[#e8e0f2]/50"
                }`}
              >
                Saved Notes ({notesList.length})
              </button>
            </div>

            {/* TAB 1: Sources */}
            {sidebarTab === "sources" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-[#4c1d95] text-xs uppercase tracking-wider font-mono">
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
                    className="text-[10px] font-semibold text-[#5b21b6] hover:text-[#4c1d95] flex items-center gap-1 transition-standard cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Add Source
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {sources.length === 0 ? (
                    <div className="border border-dashed border-[#cfc0e0] rounded-[10px] p-6 text-center text-xs text-[#8b7a9e] font-serif italic">
                      No source documents found. Add your reference notes.
                    </div>
                  ) : (
                    sources.map((doc) => {
                      const isChecked = selectedSourceIds.includes(doc.id);
                      return (
                        <div 
                          key={doc.id}
                          onClick={() => handleToggleSelectSource(doc.id)}
                          className={`group border rounded-[10px] p-3 transition-standard cursor-pointer flex items-start gap-2.5 relative ${
                            isChecked 
                              ? "bg-white border-[#5b21b6]/40 shadow-xs" 
                              : "bg-transparent border-[#e0d4f0] hover:bg-[#e8e0f2]/45"
                          }`}
                        >
                          <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectSource(doc.id)}
                              className="w-3.5 h-3.5 accent-[#5b21b6] rounded-sm cursor-pointer"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isChecked ? "text-[#5b21b6]" : "text-[#8b7a9e]"}`} />
                              <h4 className="font-semibold text-xs text-[#2d3a34] truncate pr-12">
                                {doc.title}
                              </h4>
                            </div>
                            <p className="text-[10px] text-[#6b5a80] mt-1 font-mono">
                              {doc.content.split(/\s+/).filter(Boolean).length} words
                            </p>
                          </div>

                          {/* Hover Actions */}
                          <div className="absolute right-2 top-2 flex items-center gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-standard" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleStartEditSource(doc)}
                              className="p-1 text-[#8b7a9e] hover:text-[#5b21b6] hover:bg-[#e8e0f2] rounded-md transition-standard cursor-pointer"
                              title="Edit Source"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteSource(doc.id, e)}
                              className="p-1 text-[#8b7a9e] hover:text-red-600 hover:bg-red-50 rounded-md transition-standard cursor-pointer"
                              title="Delete Source"
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
                  <div className="pt-2 border-t border-[#e0d4f0] space-y-3">
                    <button
                      onClick={handleGenerate}
                      disabled={loading || selectedSourceIds.length === 0}
                      className="w-full py-2.5 bg-[#5b21b6] hover:bg-[#4c1d95] disabled:opacity-50 text-white font-semibold rounded-[10px] text-xs transition-standard cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Formulating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Generate Flashcards
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
                  <h4 className="font-semibold text-[#4c1d95] text-xs uppercase tracking-wider font-mono">
                    Notebook Notes
                  </h4>
                  <button 
                    onClick={() => {
                      setModalNoteId(null);
                      setNoteModalTitle("");
                      setNoteModalContent("");
                      setIsNoteModalOpen(true);
                    }}
                    className="text-[10px] font-semibold text-[#5b21b6] hover:text-[#4c1d95] flex items-center gap-1 transition-standard cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Create Note
                  </button>
                </div>

                <div className="space-y-3 max-h-[390px] overflow-y-auto pr-1">
                  {notesList.length === 0 ? (
                    <div className="border border-dashed border-[#cfc0e0] rounded-[10px] p-6 text-center text-xs text-[#8b7a9e] font-serif italic">
                      No written notes saved. Pinned items will appear here.
                    </div>
                  ) : (
                    notesList.map((note) => (
                      <div 
                        key={note.id}
                        className="bg-white border border-[#e0d4f0] rounded-[10px] p-3 shadow-2xs space-y-2 relative group hover:border-[#5b21b6]/30 transition-standard"
                      >
                        <div className="flex items-start justify-between gap-6">
                          <h5 className="font-bold text-xs text-[#2d3a34] line-clamp-1 pr-6 font-serif">
                            {note.title}
                          </h5>
                          
                          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-standard">
                            <button
                              onClick={() => handleStartEditNote(note)}
                              className="p-1 text-[#8b7a9e] hover:text-[#5b21b6] hover:bg-[#e8e0f2] rounded-md transition-standard cursor-pointer"
                              title="Edit Note"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 text-[#8b7a9e] hover:text-red-600 hover:bg-red-50 rounded-md transition-standard cursor-pointer"
                              title="Delete Note"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-[#6b5a80] font-serif leading-relaxed line-clamp-4 whitespace-pre-wrap">
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

        {/* Right Side Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Inline Add Card */}
          {showAddCardInline && (
            <div className="bg-[#fdfaff] border border-[#cfc0e0] rounded-[12px] p-5 space-y-3.5 shadow-xs">
              <div className="flex justify-between items-center border-b border-[#e0d4f0] pb-2">
                <h4 className="font-bold text-xs text-[#2d1055] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <Plus className="w-4 h-4 text-[#5b21b6]" />
                  Create Manual Flashcard
                </h4>
                <button
                  onClick={() => setShowAddCardInline(false)}
                  className="text-xs text-[#8b7a9e] hover:text-[#2d3a34] font-bold cursor-pointer"
                >
                  <XCircle className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#6b5a80] uppercase mb-1">
                    Front / Prompt *
                  </label>
                  <input
                    type="text"
                    value={newCardFront}
                    onChange={(e) => setNewCardFront(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#cfc0e0] rounded-[10px] text-xs focus:outline-none focus:ring-2 focus:ring-[#5b21b6] text-[#2d3a34] font-sans"
                    placeholder="e.g. What is Active Recall?"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6b5a80] uppercase mb-1">
                    Back / Answer Explanation *
                  </label>
                  <textarea
                    value={newCardBack}
                    onChange={(e) => setNewCardBack(e.target.value)}
                    className="w-full h-16 px-3 py-2 bg-white border border-[#cfc0e0] rounded-[10px] text-xs focus:outline-none focus:ring-2 focus:ring-[#5b21b6] text-[#2d3a34] resize-none font-serif"
                    placeholder="e.g. Active retrieval testing."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6b5a80] uppercase mb-1">
                  Source Reference Citation
                </label>
                <input
                  type="text"
                  value={newCardCitation}
                  onChange={(e) => setNewCardCitation(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cfc0e0] rounded-[10px] text-xs focus:outline-none focus:ring-2 focus:ring-[#5b21b6] text-[#2d3a34] font-serif"
                  placeholder="e.g. Page 45"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddCardInline(false)}
                  className="px-4 py-1.5 border border-[#cfc0e0] hover:bg-[#f1ecf8] text-xs font-semibold rounded-[10px] transition-standard cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddManualCard}
                  className="px-4 py-1.5 bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-xs font-semibold rounded-[10px] transition-standard cursor-pointer shadow-xs"
                >
                  Create Card
                </button>
              </div>
            </div>
          )}

          {/* Empty Desk */}
          {flashcards.length === 0 && !loading && (
            <div className="h-[460px] border border-dashed border-[#e0d4f0] rounded-[12px] flex flex-col items-center justify-center text-center p-8 bg-[#fdfcff] shadow-xs">
              <div className="w-14 h-14 rounded-full bg-[#f3eff8] flex items-center justify-center mb-4 text-[#5b21b6] border border-[#e0d4f0]">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#2d1055] font-serif">Notebook Study Guide</h3>
              <p className="text-sm text-[#6b5a80] max-w-sm font-serif italic mt-2">
                Check study documents on the left, then click <strong className="text-[#5b21b6]">"Generate Flashcards"</strong> or add files/notes to review.
              </p>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setSidebarTab("sources");
                    setModalSourceId(null);
                    setModalTitle("");
                    setModalContent("");
                    setModalTab("upload"); // Open on Upload tab
                    setUploadError("");
                    setIsSourceModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-[#5b21b6] hover:bg-[#4c1d95] text-white font-semibold rounded-[10px] text-xs transition-standard cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  Upload Document (PDF/Text)
                </button>
                
                {selectedSourceIds.length > 0 && (
                  <button
                    onClick={handleGenerate}
                    className="px-5 py-2.5 bg-[#e8e0f2] hover:bg-[#e0daf0] text-[#2d3a34] font-semibold rounded-[10px] text-xs transition-standard cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate ({selectedSourceIds.length} active)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="h-[460px] border border-[#e0d4f0] rounded-[12px] bg-white flex flex-col items-center justify-center text-center p-8 shadow-xs">
              <Loader2 className="w-10 h-10 text-[#5b21b6] animate-spin mb-4" />
              <h3 className="text-lg font-bold text-[#2d1055] font-serif">Deconstructing Materials</h3>
              <p className="text-sm text-[#6b5a80] max-w-xs font-serif italic mt-1.5 leading-relaxed">
                Reading documents, extracting concepts, and mapping citations...
              </p>
            </div>
          )}

          {/* Active Workspace */}
          {flashcards.length > 0 && !loading && (
            <div className="space-y-5">
              
              {/* Tab toggles */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-b border-[#e0d4f0] pb-2 gap-3">
                <div className="flex items-center gap-1.5 bg-[#e8e0f2]/60 p-1 rounded-[10px]">
                  <button
                    onClick={() => setActiveView("carousel")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[8px] transition-standard cursor-pointer ${
                      activeView === "carousel" ? "bg-[#5b21b6] text-white shadow-xs" : "text-[#6b5a80] hover:text-[#2d3a34]"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Study Carousel
                  </button>
                  <button
                    onClick={() => setActiveView("grid")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[8px] transition-standard cursor-pointer ${
                      activeView === "grid" ? "bg-[#5b21b6] text-white shadow-xs" : "text-[#6b5a80] hover:text-[#2d3a34]"
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    Browse Grid ({flashcards.length})
                  </button>
                  <button
                    onClick={() => setActiveView("list")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[8px] transition-standard cursor-pointer ${
                      activeView === "list" ? "bg-[#5b21b6] text-white shadow-xs" : "text-[#6b5a80] hover:text-[#2d3a34]"
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    Reference Sheet
                  </button>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-3 text-xs font-medium text-[#6b5a80]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-600" /> {masteredCount} Got It</span>
                  <span className="h-3 w-px bg-[#e0d4f0]" />
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> {reviewCount} Reviews</span>
                  <span className="h-3 w-px bg-[#e0d4f0]" />
                  <span className="font-semibold text-[#2d3a34]">{Math.round(((masteredCount + reviewCount) / flashcards.length) * 100)}% Complete</span>
                </div>
              </div>

              {!showSummary ? (
                <>
                  {/* CAROUSEL */}
                  {activeView === "carousel" && (
                    <div className="space-y-6">
                      <div className="relative group">
                        {editingCardId === flashcards[currentIndex].id ? (
                          <div className="w-full h-80 rounded-[12px] border border-[#5b21b6] bg-white p-6 space-y-4 shadow-sm">
                            <h4 className="text-xs font-bold text-[#5b21b6] uppercase font-mono border-b border-[#f3eff8] pb-2">
                              Edit Flashcard #{currentIndex + 1}
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-[#6b5a80] uppercase mb-1">
                                  Front Prompt
                                </label>
                                <input
                                  type="text"
                                  value={editCardFront}
                                  onChange={(e) => setEditCardFront(e.target.value)}
                                  className="w-full px-3 py-2 bg-[#fdfaff] border border-[#cfc0e0] rounded-[10px] text-xs focus:outline-none focus:ring-2 focus:ring-[#5b21b6] text-[#2d3a34] font-sans"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-[#6b5a80] uppercase mb-1">
                                  Back Answer
                                </label>
                                <textarea
                                  value={editCardBack}
                                  onChange={(e) => setEditCardBack(e.target.value)}
                                  className="w-full h-16 px-3 py-2 bg-[#fdfaff] border border-[#cfc0e0] rounded-[10px] text-xs focus:outline-none focus:ring-2 focus:ring-[#5b21b6] text-[#2d3a34] resize-none font-serif leading-relaxed"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-[#6b5a80] uppercase mb-1">
                                Citation
                              </label>
                              <input
                                type="text"
                                value={editCardCitation}
                                onChange={(e) => setEditCardCitation(e.target.value)}
                                className="w-full px-3 py-1.5 bg-[#fdfaff] border border-[#cfc0e0] rounded-[10px] text-xs focus:outline-none focus:ring-2 focus:ring-[#5b21b6] text-[#2d3a34] font-serif"
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-1 border-t border-[#f3eff8]">
                              <button
                                onClick={() => setEditingCardId(null)}
                                className="px-3.5 py-1.5 border border-[#cfc0e0] text-[#2d3a34] rounded-[10px] text-xs font-semibold hover:bg-[#f3eff8] transition-standard"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveCardEdit}
                                className="px-3.5 py-1.5 bg-[#5b21b6] text-white rounded-[10px] text-xs font-semibold hover:bg-[#4c1d95] transition-standard shadow-xs"
                              >
                                Save Card
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={() => setIsFlipped(!isFlipped)}
                            className="w-full h-80 [perspective:1000px] cursor-pointer relative"
                          >
                            <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
                              isFlipped ? '[transform:rotateY(180deg)]' : ''
                            }`}>
                              
                              <div className="absolute inset-0 w-full h-full rounded-[12px] border border-[#e0d4f0] bg-white p-8 flex flex-col justify-between shadow-xs [backface-visibility:hidden]">
                                <div className="flex items-center justify-between border-b border-[#f3eff8] pb-3">
                                  <span className="text-[10px] font-bold text-[#5b21b6] tracking-wider uppercase flex items-center gap-1">
                                    <Bookmark className="w-3.5 h-3.5 text-[#5b21b6]" />
                                    Concept Prompt
                                  </span>
                                  
                                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={(e) => handleStartEditCard(flashcards[currentIndex], e)}
                                      className="p-1 text-[#8b7a9e] hover:text-[#5b21b6] hover:bg-[#f3eff8] rounded-md transition-standard cursor-pointer"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => handleDeleteCard(flashcards[currentIndex].id, e)}
                                      className="p-1 text-[#8b7a9e] hover:text-red-600 hover:bg-red-50 rounded-md transition-standard cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="text-xs text-[#8b7a9e] font-mono ml-2">
                                      CARD {currentIndex + 1} OF {flashcards.length}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex-grow flex items-center justify-center py-4">
                                  <h2 className="text-xl md:text-2xl font-serif font-bold text-[#2d1055] text-center leading-relaxed max-w-xl">
                                    {flashcards[currentIndex].front}
                                  </h2>
                                </div>
                                
                                <div className="text-center text-xs text-[#8b7a9e] font-serif italic border-t border-[#f3eff8] pt-3 flex items-center justify-center gap-1.5">
                                  <RotateCw className="w-3.5 h-3.5 text-[#5b21b6]" /> Click to reveal answer
                                </div>
                              </div>

                              <div className="absolute inset-0 w-full h-full rounded-[12px] border border-[#5b21b6]/30 bg-[#f5f0fa] p-8 flex flex-col justify-between shadow-xs [backface-visibility:hidden] [transform:rotateY(180deg)]">
                                <div className="flex items-center justify-between border-b border-[#e0daf0] pb-3">
                                  <span className="text-[10px] font-bold text-[#5b21b6] tracking-wider uppercase flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5 text-[#5b21b6]" />
                                    AI Answer Verification
                                  </span>
                                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full uppercase">
                                    Revealed
                                  </span>
                                </div>
                                
                                <div className="flex-grow flex flex-col justify-center py-4 space-y-3.5 overflow-y-auto max-h-48 scrollbar-thin">
                                  <p className="text-base text-[#2d3a34] text-center font-serif leading-relaxed max-w-xl whitespace-pre-wrap mx-auto">
                                    {flashcards[currentIndex].back}
                                  </p>
                                  
                                  {flashcards[currentIndex].citation && (
                                    <div className="text-left bg-[#f0e8fa] border-l-2 border-[#5b21b6] px-3.5 py-2 text-xs text-[#6b5a80] font-serif italic max-w-lg mx-auto rounded-[4px]">
                                      <strong className="text-[10px] font-bold text-[#5b21b6] font-sans block not-italic uppercase mb-0.5">
                                        Source Citation Document:
                                      </strong>
                                      "{flashcards[currentIndex].citation}"
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-between border-t border-[#e0daf0] pt-3">
                                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={(e) => handleCopyCard(currentIndex, e)}
                                      className="text-xs text-[#8b7a9e] hover:text-[#5b21b6] flex items-center gap-1.5 transition-standard cursor-pointer"
                                    >
                                      {copiedIndex === currentIndex ? <Check className="w-3.5 h-3.5 text-purple-700" /> : <Copy className="w-3.5 h-3.5" />}
                                      <span>{copiedIndex === currentIndex ? "Copied!" : "Copy"}</span>
                                    </button>

                                    <button
                                      onClick={(e) => handlePinCardToNotes(flashcards[currentIndex], currentIndex, e)}
                                      className="text-xs text-[#8b7a9e] hover:text-[#5b21b6] flex items-center gap-1.5 transition-standard cursor-pointer"
                                    >
                                      {pinnedFeedback === currentIndex ? <Check className="w-3.5 h-3.5 text-purple-700 animate-bounce" /> : <Pin className="w-3.5 h-3.5" />}
                                      <span>{pinnedFeedback === currentIndex ? "Pinned!" : "Pin Note"}</span>
                                    </button>
                                  </div>
                                  
                                  <span className="text-[11px] text-[#6b5a80] italic font-serif">
                                    Click card to flip back
                                  </span>
                                </div>
                              </div>

                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className="p-2.5 border border-[#cfc0e0] rounded-[10px] text-[#5b21b6] hover:bg-[#f1ecf8] disabled:opacity-40 disabled:hover:bg-transparent transition-standard"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </button>
                          
                          <button
                            onClick={() => setIsFlipped(!isFlipped)}
                            className="px-5 py-2.5 border border-[#5b21b6] hover:bg-[#f1ecf8] text-[#5b21b6] font-semibold rounded-[10px] text-xs transition-standard"
                          >
                            Flip Card (Space)
                          </button>

                          <button
                            onClick={handleNext}
                            disabled={currentIndex === flashcards.length - 1}
                            className="p-2.5 border border-[#cfc0e0] rounded-[10px] text-[#5b21b6] hover:bg-[#f1ecf8] disabled:opacity-40 disabled:hover:bg-transparent transition-standard"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleSetStatus("review")}
                            className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#eedebb] bg-[#fdf9f2] hover:bg-[#f5ebd7] text-[#7c3aed] font-semibold rounded-[10px] text-xs transition-standard cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                            Still Learning (1)
                          </button>
                          
                          <button
                            onClick={() => handleSetStatus("mastered")}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5b21b6] hover:bg-[#4c1d95] text-white font-semibold rounded-[10px] text-xs transition-standard cursor-pointer shadow-xs"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Got It! (2)
                          </button>
                        </div>
                      </div>

                      <div className="bg-[#f3eff8] border border-[#e0d4f0] rounded-[10px] px-4 py-2.5 flex items-center justify-between text-[11px] text-[#6b5a80] font-serif">
                        <div className="flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-[#5b21b6]" />
                          <span>Keyboard controls active.</span>
                        </div>
                        <div className="flex items-center gap-4 font-sans text-[10px] tracking-wider uppercase font-semibold">
                          <span>Space: Flip</span>
                          <span>← / →: Navigate</span>
                          <span>1: Learn</span>
                          <span>2: Got It</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GRID */}
                  {activeView === "grid" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {flashcards.map((card, idx) => {
                        const isCardFlipped = gridFlippedState[idx] || false;
                        const cardStatus = card.status || "unseen";
                        
                        let statusColor = "bg-[#e8e0f2] text-[#6b5a80]";
                        if (cardStatus === "mastered") statusColor = "bg-purple-100 text-purple-800";
                        if (cardStatus === "review") statusColor = "bg-amber-100 text-amber-800";

                        return (
                          <div 
                            key={idx}
                            onClick={() => setGridFlippedState(prev => ({ ...prev, [idx]: !isCardFlipped }))}
                            className="h-48 [perspective:1000px] cursor-pointer relative"
                          >
                            <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
                              isCardFlipped ? '[transform:rotateY(180deg)]' : ''
                            }`}>
                              
                              <div className="absolute inset-0 w-full h-full rounded-[10px] border border-[#e0d4f0] bg-white p-5 flex flex-col justify-between shadow-xs [backface-visibility:hidden]">
                                <div className="flex justify-between items-center border-b border-[#f3eff8] pb-2" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-[10px] font-mono text-[#8b7a9e]">
                                    CARD {idx + 1}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) => handleStartEditCard(card, e)}
                                      className="p-1 text-[#8b7a9e] hover:text-[#5b21b6] hover:bg-[#f3eff8] rounded"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={(e) => handleDeleteCard(card.id, e)}
                                      className="p-1 text-[#8b7a9e] hover:text-red-600 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex-grow flex items-center justify-center py-2">
                                  <h4 className="text-sm font-bold text-[#2d1055] text-center font-serif leading-snug line-clamp-3">
                                    {card.front}
                                  </h4>
                                </div>
                                <div className="flex items-center justify-between pt-1.5 border-t border-[#f3eff8]">
                                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${statusColor}`}>
                                    {cardStatus}
                                  </span>
                                  <span className="text-[10px] text-[#8b7a9e] italic font-serif flex items-center gap-1">
                                    <RotateCw className="w-3 h-3 text-[#5b21b6]" /> Flip
                                  </span>
                                </div>
                              </div>

                              <div className="absolute inset-0 w-full h-full rounded-[10px] border border-[#5b21b6]/20 bg-[#fbfbfa] p-5 flex flex-col justify-between shadow-xs [backface-visibility:hidden] [transform:rotateY(180deg)]">
                                <div className="flex justify-between items-center border-b border-[#e0daf0] pb-2" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-[10px] font-bold text-[#5b21b6] uppercase">
                                    Answer Description
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) => handleCopyCard(idx, e)}
                                      className="p-1 text-[#8b7a9e] hover:text-[#5b21b6] rounded"
                                    >
                                      {copiedIndex === idx ? <Check className="w-3 h-3 text-purple-700" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                    <button
                                      onClick={(e) => handlePinCardToNotes(card, idx, e)}
                                      className="p-1 text-[#8b7a9e] hover:text-[#5b21b6] rounded"
                                    >
                                      {pinnedFeedback === idx ? <Check className="w-3 h-3 text-purple-700" /> : <Pin className="w-3 h-3" />}
                                    </button>
                                  </div>
                                </div>
                                <div className="flex-grow flex items-center justify-center py-2 overflow-y-auto max-h-24 scrollbar-thin">
                                  <p className="text-xs text-[#2d3a34] font-serif leading-relaxed text-center">
                                    {card.back}
                                  </p>
                                </div>
                                <div className="text-center text-[10px] text-[#8b7a9e] italic font-serif pt-1.5 border-t border-[#e0daf0]">
                                  Click to flip back
                                </div>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* LIST */}
                  {activeView === "list" && (
                    <div className="bg-white border border-[#e0d4f0] rounded-[12px] overflow-hidden divide-y divide-[#e0d4f0] shadow-xs">
                      {flashcards.map((card, idx) => (
                        <div key={idx} className="p-5 hover:bg-[#fdfaff] transition-standard space-y-2.5 relative group">
                          <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-standard">
                            <button
                              onClick={(e) => handleStartEditCard(card, e)}
                              className="p-1.5 text-[#8b7a9e] hover:text-[#5b21b6] hover:bg-[#f3eff8] rounded-md transition-standard cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleCopyCard(idx, e)}
                              className="p-1.5 text-[#8b7a9e] hover:text-[#5b21b6] hover:bg-[#f3eff8] rounded-md transition-standard cursor-pointer"
                            >
                              {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-purple-700" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={(e) => handlePinCardToNotes(card, idx, e)}
                              className="p-1.5 text-[#8b7a9e] hover:text-[#5b21b6] hover:bg-[#f3eff8] rounded-md transition-standard cursor-pointer"
                            >
                              {pinnedFeedback === idx ? <Check className="w-3.5 h-3.5 text-purple-700" /> : <Pin className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={(e) => handleDeleteCard(card.id, e)}
                              className="p-1.5 text-[#8b7a9e] hover:text-red-600 hover:bg-red-50 rounded-md transition-standard cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="bg-[#e8e0f2] text-[#2d3a34] text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                              CONCEPT {idx + 1}
                            </span>
                            {card.status && card.status !== "unseen" && (
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                card.status === "mastered" ? "bg-purple-50 text-purple-700" : "bg-amber-50 text-amber-700"
                              }`}>
                                {card.status}
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-1.5">
                            <h4 className="text-sm font-bold text-[#2d1055] font-serif leading-snug pr-24">
                              Q: {card.front}
                            </h4>
                            <p className="text-xs text-[#2d3a34] font-serif leading-relaxed pl-4 border-l border-[#cfc0e0]">
                              A: {card.back}
                            </p>
                            {card.citation && (
                              <p className="text-[10.5px] text-[#6b5a80] font-serif leading-relaxed pl-4 italic opacity-85">
                                Citation: "{card.citation}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setShowSummary(true)}
                      className="px-5 py-2.5 bg-[#e8e0f2] hover:bg-[#e0daf0] text-[#2d3a34] font-semibold rounded-[10px] text-xs transition-standard flex items-center gap-1.5 shadow-xs"
                    >
                      Finish Session & See Report
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                /* SUMMARY */
                <div className="bg-white border border-[#e0d4f0] rounded-[12px] p-8 shadow-xs text-center space-y-6">
                  <div className="max-w-md mx-auto space-y-2">
                    <div className="w-14 h-14 rounded-full bg-[#f3edfa] border border-[#d2c0f0] text-[#5b21b6] flex items-center justify-center mx-auto text-xl font-bold">
                      ✓
                    </div>
                    <h2 className="text-2xl font-bold text-[#2d1055] font-serif">Study Session Completed!</h2>
                    <p className="text-sm text-[#6b5a80] font-serif italic">
                      Here is your learning progress breakdown:
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-2">
                    <div className="bg-[#f3edfa] border border-[#d2c0f0] rounded-[10px] p-4 text-center">
                      <div className="text-3xl font-extrabold text-[#5b21b6]">{masteredCount}</div>
                      <div className="text-[10px] font-bold text-[#6b5a80] uppercase tracking-wider mt-1">Mastered</div>
                    </div>
                    <div className="bg-[#fdf9f2] border border-[#eedebb] rounded-[10px] p-4 text-center">
                      <div className="text-3xl font-extrabold text-[#7c3aed]">{reviewCount}</div>
                      <div className="text-[10px] font-bold text-[#6b5a80] uppercase tracking-wider mt-1">Review Needed</div>
                    </div>
                    <div className="bg-[#fdfaff] border border-[#e0d4f0] rounded-[10px] p-4 text-center">
                      <div className="text-3xl font-extrabold text-[#8b7a9e]">{unseenCount}</div>
                      <div className="text-[10px] font-bold text-[#6b5a80] uppercase tracking-wider mt-1">Unseen</div>
                    </div>
                  </div>

                  <div className="max-w-sm mx-auto space-y-2 pt-2">
                    <div className="flex justify-between items-center text-xs font-semibold text-[#6b5a80]">
                      <span>Mastery Progress</span>
                      <span>{Math.round((masteredCount / flashcards.length) * 100)}% Mastered</span>
                    </div>
                    <div className="w-full bg-[#e8e0f2] h-2.5 rounded-full overflow-hidden flex">
                      <div className="h-full bg-[#5b21b6]" style={{ width: `${(masteredCount / flashcards.length) * 100}%` }} />
                      <div className="h-full bg-[#c4a8f0]" style={{ width: `${(reviewCount / flashcards.length) * 100}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-center gap-3 pt-6 border-t border-[#f3eff8] mt-6">
                    <button
                      onClick={handleRestart}
                      className="px-5 py-2.5 border border-[#5b21b6] hover:bg-[#f1ecf8] text-[#5b21b6] font-semibold rounded-[10px] text-xs transition-standard cursor-pointer"
                    >
                      Study Deck Again
                    </button>
                    {reviewCount > 0 && (
                      <button
                        onClick={handleRestudyReviews}
                        className="px-5 py-2.5 bg-[#5b21b6] hover:bg-[#4c1d95] text-white font-semibold rounded-[10px] text-xs transition-standard shadow-xs"
                      >
                        Study Review Cards ({reviewCount})
                      </button>
                    )}
                    <button
                      onClick={handleClearDeck}
                      className="px-5 py-2.5 bg-[#e8e0f2] hover:bg-[#e0daf0] text-[#2d3a34] font-semibold rounded-[10px] text-xs transition-standard cursor-pointer"
                    >
                      Select New Sources
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Add/Edit Source Modal */}
      {isSourceModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#fdfaff] border border-[#e0d4f0] rounded-[12px] p-6 max-w-lg w-full shadow-lg space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#e0d4f0] pb-3">
              <h3 className="text-lg font-bold text-[#2d1055] font-serif flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#5b21b6]" />
                {modalSourceId ? "Edit Source Document" : "Add Source Document"}
              </h3>
              <button
                onClick={() => {
                  setIsSourceModalOpen(false);
                  setModalTitle("");
                  setModalContent("");
                  setModalSourceId(null);
                }}
                className="text-xs text-[#8b7a9e] hover:text-[#2d3a34] font-semibold"
              >
                Close
              </button>
            </div>

            {/* Modal Tabs for Manual Input vs Upload File */}
            {!modalSourceId && (
              <div className="flex gap-1 bg-[#e8e0f2]/60 p-1 rounded-[10px]">
                <button
                  onClick={() => setModalTab("text")}
                  className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-[8px] transition-standard ${
                    modalTab === "text" ? "bg-[#5b21b6] text-white shadow-xs" : "text-[#6b5a80] hover:text-[#2d3a34]"
                  }`}
                >
                  Write / Paste Text
                </button>
                <button
                  onClick={() => setModalTab("upload")}
                  className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-[8px] transition-standard ${
                    modalTab === "upload" ? "bg-[#5b21b6] text-white shadow-xs" : "text-[#6b5a80] hover:text-[#2d3a34]"
                  }`}
                >
                  Upload File
                </button>
              </div>
            )}

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[10px] flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* TAB A: Text editor */}
            {modalTab === "text" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6b5a80] mb-1.5 uppercase tracking-wider">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#cfc0e0] rounded-[10px] text-xs focus:outline-none focus:ring-2 focus:ring-[#5b21b6] text-[#2d3a34]"
                    placeholder="e.g. Photosynthesis Notes"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6b5a80] mb-1.5 uppercase tracking-wider">
                    Document Content *
                  </label>
                  <textarea
                    value={modalContent}
                    onChange={(e) => setModalContent(e.target.value)}
                    className="w-full h-44 px-3 py-2 bg-white border border-[#cfc0e0] rounded-[10px] text-xs focus:outline-none focus:ring-2 focus:ring-[#5b21b6] resize-none text-[#2d3a34] font-serif leading-relaxed"
                    placeholder="Paste details or notes..."
                  />
                </div>
              </div>
            )}

            {/* TAB B: File Upload */}
            {modalTab === "upload" && (
              <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-[#cfc0e0] rounded-[12px] bg-white transition-standard hover:bg-[#fdfaff]/50 text-center p-6 relative">
                {fileLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#5b21b6] animate-spin" />
                    <p className="text-xs font-serif text-[#6b5a80] italic animate-pulse">
                      Parsing document text...
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-[#8b7a9e] mb-2" />
                    <p className="text-xs font-bold text-[#2d3a34]">
                      Select study document
                    </p>
                    <p className="text-[10px] text-[#6b5a80] mt-1 font-serif max-w-xs leading-normal">
                      Drag and drop your file here, or click to browse. Supports <strong className="text-[#5b21b6]">PDF, TXT, and Markdown (.md)</strong>.
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

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e0d4f0]">
              <button
                onClick={() => {
                  setIsSourceModalOpen(false);
                  setModalTitle("");
                  setModalContent("");
                  setModalSourceId(null);
                }}
                className="px-4 py-2 border border-[#cfc0e0] hover:bg-[#f1ecf8] text-[#2d3a34] font-semibold rounded-[10px] text-xs transition-standard"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSaveSource}
                disabled={modalTab !== "text" || !modalTitle.trim() || !modalContent.trim()}
                className="px-4 py-2 bg-[#5b21b6] hover:bg-[#4c1d95] disabled:opacity-50 text-white font-semibold rounded-[10px] text-xs transition-standard shadow-xs"
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
          <div className="bg-[#fdfaff] border border-[#e0d4f0] rounded-[12px] p-6 max-w-lg w-full shadow-lg space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#e0d4f0] pb-3">
              <h3 className="text-lg font-bold text-[#2d1055] font-serif flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#5b21b6]" />
                {modalNoteId ? "Edit Study Note" : "Write Custom Note"}
              </h3>
              <button
                onClick={() => {
                  setIsNoteModalOpen(false);
                  setNoteModalTitle("");
                  setNoteModalContent("");
                  setModalNoteId(null);
                }}
                className="text-xs text-[#8b7a9e] hover:text-[#2d3a34] font-semibold"
              >
                Close
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6b5a80] mb-1.5 uppercase tracking-wider">
                  Note Title *
                </label>
                <input
                  type="text"
                  value={noteModalTitle}
                  onChange={(e) => setNoteModalTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cfc0e0] rounded-[10px] text-xs focus:outline-none focus:ring-2 focus:ring-[#5b21b6] text-[#2d3a34]"
                  placeholder="e.g. Summary points"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6b5a80] mb-1.5 uppercase tracking-wider">
                  Note Content *
                </label>
                <textarea
                  value={noteModalContent}
                  onChange={(e) => setNoteModalContent(e.target.value)}
                  className="w-full h-44 px-3 py-2 bg-white border border-[#cfc0e0] rounded-[10px] text-xs focus:outline-none focus:ring-2 focus:ring-[#5b21b6] resize-none text-[#2d3a34] font-serif leading-relaxed"
                  placeholder="Write note details..."
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e0d4f0]">
              <button
                onClick={() => {
                  setIsNoteModalOpen(false);
                  setNoteModalTitle("");
                  setNoteModalContent("");
                  setModalNoteId(null);
                }}
                className="px-4 py-2 border border-[#cfc0e0] hover:bg-[#f1ecf8] text-[#2d3a34] font-semibold rounded-[10px] text-xs transition-standard"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 bg-[#5b21b6] hover:bg-[#4c1d95] text-white font-semibold rounded-[10px] text-xs transition-standard shadow-xs"
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
