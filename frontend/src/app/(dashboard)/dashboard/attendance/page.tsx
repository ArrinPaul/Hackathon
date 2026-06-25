"use client";

import { useEffect, useState } from "react";
import { BarChart3, Plus, Trash2, ShieldAlert, CheckCircle, RefreshCw, Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { Attendance } from "@/features/types";

interface AIAlert {
  percentage: string;
  message: string;
  isAtRisk: boolean;
}

export default function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form input states
  const [subject, setSubject] = useState("");
  const [totalClasses, setTotalClasses] = useState<number | "">("");
  const [attendedClasses, setAttendedClasses] = useState<number | "">("");
  const [threshold, setThreshold] = useState<number>(75);

  // AI Alerts state mapped by record ID or subject
  const [aiAlerts, setAiAlerts] = useState<Record<string, AIAlert>>({});
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchAttendance = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get<{ attendance: Attendance[] }>("/api/attendance");
      setRecords(res.attendance || []);
      
      // Auto analyze risk for all loaded records
      res.attendance?.forEach((record) => {
        analyzeRisk(record);
      });
    } catch (err) {
      console.error("Failed to fetch attendance", err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeRisk = async (record: Attendance) => {
    try {
      const alertData = await api.post<AIAlert>("/api/ai/attendance-alert", {
        subject: record.subject,
        total: record.total_classes,
        attended: record.attended_classes,
        threshold: record.threshold
      });
      setAiAlerts((prev) => ({ ...prev, [record.id]: alertData }));
    } catch (err) {
      console.error(`Failed to assess risk for ${record.subject}`, err);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");

    if (!subject.trim() || totalClasses === "" || attendedClasses === "") {
      setFormError("Subject, total classes and attended classes are required");
      return;
    }

    if (Number(attendedClasses) > Number(totalClasses)) {
      setFormError("Attended classes cannot exceed total classes");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post<{ attendance: Attendance }>("/api/attendance", {
        subject: subject.trim(),
        total_classes: Number(totalClasses),
        attended_classes: Number(attendedClasses),
        threshold: Number(threshold)
      });
      
      // Reset form
      setSubject("");
      setTotalClasses("");
      setAttendedClasses("");
      setThreshold(75);
      setSuccessMsg("Attendance record saved!");
      
      // Reload and auto-analyze
      fetchAttendance(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save attendance record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await api.delete(`/api/attendance/${id}`);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setAiAlerts((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      console.error("Failed to delete record", err);
    }
  };

  const handleRefreshAlert = async (record: Attendance) => {
    setAnalyzingId(record.id);
    await analyzeRisk(record);
    setAnalyzingId(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance Tracker</h1>
          <p className="text-muted-foreground mt-1">Track attendance and get AI-powered risk alerts</p>
        </div>
        <button 
          onClick={() => fetchAttendance(false)}
          className="p-2 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {formError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-[10px] text-sm text-destructive animate-in fade-in duration-200">
          {formError}
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-[10px] text-sm text-green-600 animate-in fade-in duration-200">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Form */}
        <div className="bg-white border border-border rounded-[10px] p-5 shadow-sm h-fit">
          <h3 className="font-semibold text-foreground text-base mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Add / Update Subject
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                Subject Name *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., OS, DBMS, Networks"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                  Total Classes *
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalClasses}
                  onChange={(e) => setTotalClasses(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                  Attended *
                </label>
                <input
                  type="number"
                  min="0"
                  value={attendedClasses}
                  onChange={(e) => setAttendedClasses(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                Required Attendance Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="75"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-primary text-primary-foreground font-semibold rounded-[10px] hover:opacity-90 transition-standard cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Attendance
            </button>
          </form>
        </div>

        {/* Attendance Records List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-border rounded-[10px]">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Loading attendance...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="bg-white border border-border rounded-[10px] p-12 text-center shadow-sm">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No attendance records</h3>
              <p className="text-sm text-muted-foreground">
                Add your classes to assess your current percentages and skip-class budgets!
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {records.map((record) => {
                const percentage = record.total_classes > 0 
                  ? ((record.attended_classes / record.total_classes) * 100).toFixed(1)
                  : "100.0";
                const isUnderThreshold = Number(percentage) < record.threshold;
                const aiAlert = aiAlerts[record.id];

                return (
                  <div
                    key={record.id}
                    className={`bg-white border rounded-[10px] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-md ${
                      isUnderThreshold ? "border-destructive/30" : "border-border"
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-foreground text-lg">{record.subject}</h4>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          isUnderThreshold 
                            ? "bg-destructive/15 text-destructive" 
                            : "bg-green-500/15 text-green-600"
                        }`}>
                          {percentage}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Goal: {record.threshold}%
                        </span>
                      </div>

                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            isUnderThreshold ? "bg-destructive" : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(Number(percentage), 100)}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>
                          Attended: <strong>{record.attended_classes}</strong> / <strong>{record.total_classes}</strong> classes
                        </span>
                      </div>

                      {/* AI Risk Alerter Message box */}
                      {aiAlert ? (
                        <div className={`mt-3 p-3 text-xs rounded-[8px] flex items-start gap-2 border leading-relaxed ${
                          aiAlert.isAtRisk 
                            ? "bg-destructive/5 border-destructive/10 text-destructive" 
                            : "bg-green-500/5 border-green-500/10 text-green-600"
                        }`}>
                          {aiAlert.isAtRisk ? (
                            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-semibold block mb-0.5 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-current animate-pulse" />
                              AI Risk Assessment
                            </span>
                            {aiAlert.message}
                          </div>
                        </div>
                      ) : (
                        <div className="h-10 bg-muted/40 animate-pulse rounded-[8px] mt-3" />
                      )}
                    </div>

                    <div className="flex md:flex-col items-center justify-end gap-2 flex-shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-dashed border-border">
                      <button
                        onClick={() => handleRefreshAlert(record)}
                        disabled={analyzingId === record.id}
                        className="p-2 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-standard cursor-pointer"
                        title="Recheck risk assessment"
                      >
                        <RefreshCw className={`w-4 h-4 ${analyzingId === record.id ? "animate-spin" : ""}`} />
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="p-2 hover:bg-destructive/10 rounded-full text-muted-foreground hover:text-destructive transition-standard cursor-pointer"
                        title="Delete subject record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
