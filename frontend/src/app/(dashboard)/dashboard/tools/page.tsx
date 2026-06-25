"use client";

import { useState } from "react";
import { 
  Sparkles, 
  BarChart, 
  FileText, 
  Calendar, 
  GitFork, 
  Lightbulb, 
  ShieldAlert, 
  Megaphone, 
  X, 
  Loader2, 
  Copy, 
  Check 
} from "lucide-react";
import { api } from "@/lib/api";

interface Tool {
  slug: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  placeholder: string;
  action: string;
  options?: Array<{
    label: string;
    type: string;
    id: string;
    value?: string | number;
  }>;
}

const TOOLS_CONFIG: Tool[] = [
  {
    slug: "summarize-notes",
    title: "Summarize Notes",
    icon: FileText,
    description: "Get a concise, structured bullet-point summary of your lecture notes",
    placeholder: "Paste your detailed lecture notes, transcript, or slides content here...",
    action: "Summarize Notes"
  },
  {
    slug: "study-schedule",
    title: "Study Schedule",
    icon: Calendar,
    description: "Generate a personalized study plan based on subjects, exam dates, and daily hours",
    placeholder: "List your subjects and topics you need to cover (e.g. OS, DBMS, Compiler)...",
    action: "Generate Plan",
    options: [
      { label: "Exam Date / Target Date", type: "date", id: "examDate" },
      { label: "Daily Study Hours", type: "number", id: "studyHours", value: 4 }
    ]
  },
  {
    slug: "concept-map",
    title: "Concept Map",
    icon: GitFork,
    description: "Deconstruct your lecture topic into a hierarchical layout of connected ideas",
    placeholder: "Enter the lecture notes or key concept you want to map out...",
    action: "Map Concepts"
  },
  {
    slug: "explain-concept",
    title: "Explain Concept",
    icon: Lightbulb,
    description: "Explains difficult theories or code snippet simply with analogies and real-world examples",
    placeholder: "Enter the scientific concept, math formula, or coding topic (e.g., Red-Black Tree)...",
    action: "Explain Simply"
  },
  {
    slug: "attendance-risk",
    title: "Attendance Risk Check",
    icon: ShieldAlert,
    description: "Get custom action plans and calculate skip-class limits from subject percentages",
    placeholder: "Type subjects and your current attendance percentage (e.g., 'DBMS: 78, OS: 62, math: 85')...",
    action: "Assess Risk"
  },
  {
    slug: "notice-summarizer",
    title: "Notice Summarizer",
    icon: Megaphone,
    description: "Extract important dates, action items, and instructions from college circulars",
    placeholder: "Paste the raw circular notice text here...",
    action: "Extract Details"
  }
];

export default function SmartToolsPage() {
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Options fields state
  const [examDate, setExamDate] = useState("");
  const [studyHours, setStudyHours] = useState(4);

  const handleOpenTool = (tool: Tool) => {
    setActiveTool(tool);
    setContent("");
    setResult("");
    setError("");
    setExamDate("");
    setStudyHours(4);
    setCopied(false);
  };

  const handleCloseTool = () => {
    setActiveTool(null);
  };

  const handleProcess = async () => {
    if (!activeTool) return;
    
    if (!content.trim() && activeTool.slug !== "study-schedule") {
      setError("Please input some content first!");
      return;
    }

    setError("");
    setLoading(true);
    setResult("");

    try {
      const optionsObj = activeTool.slug === "study-schedule" ? { examDate, studyHours } : {};
      
      const res = await api.post<{ result: string }>(`/api/ai/tool/${activeTool.slug}`, {
        content,
        options: optionsObj
      });

      if (res.result) {
        setResult(res.result);
      } else {
        throw new Error("No output returned from AI.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process tool");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Smart Tools
        </h1>
        <p className="text-muted-foreground mt-1">AI-powered educational utilities to supercharge your college workflow</p>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TOOLS_CONFIG.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.slug}
              className="bg-white border border-border rounded-[10px] p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all h-full"
            >
              <div>
                <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground text-base mb-2">
                  {tool.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  {tool.description}
                </p>
              </div>
              <button
                onClick={() => handleOpenTool(tool)}
                className="w-full py-2 border border-border text-foreground hover:bg-accent font-semibold rounded-[10px] text-sm transition-standard cursor-pointer text-center"
              >
                Launch Tool
              </button>
            </div>
          );
        })}
      </div>

      {/* Slide-over Modal / Modal Overlay */}
      {activeTool && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[12px] border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[8px] bg-primary/10 flex items-center justify-center text-primary">
                  <activeTool.icon className="w-4.5 h-4.5" />
                </div>
                <h2 className="text-lg font-bold text-foreground">{activeTool.title}</h2>
              </div>
              <button 
                onClick={handleCloseTool}
                className="p-1 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-standard cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-[10px] text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Modal Body */}
            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                  Content Input
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-36 px-3 py-2 border border-border rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none font-sans"
                  placeholder={activeTool.placeholder}
                />
              </div>

              {/* Dynamic options fields */}
              {activeTool.slug === "study-schedule" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/40 p-4 border border-border rounded-[10px]">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                      Target Exam Date
                    </label>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                      Daily Study Hours Limit
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={studyHours}
                      onChange={(e) => setStudyHours(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleCloseTool}
                  className="px-4 py-2 border border-border text-foreground font-medium rounded-[10px] hover:bg-accent transition-standard cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleProcess}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-[10px] hover:opacity-90 transition-standard cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {activeTool.action}
                </button>
              </div>

              {/* Result output display */}
              {(result || loading) && (
                <div className="mt-6 border-t border-border pt-6 space-y-3 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Generated Result</span>
                    {result && (
                      <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1.5 px-3 py-1 border border-border hover:bg-accent text-xs font-medium rounded-[8px] transition-standard cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    )}
                  </div>
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                      <p className="text-sm text-muted-foreground">AI is working on your request...</p>
                    </div>
                  ) : (
                    <div className="bg-muted/40 border border-border rounded-[10px] p-4 text-sm text-foreground space-y-2 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto font-sans">
                      {result}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
