"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { api } from "@/lib/api";

export function AiTipWidget() {
  const [tip, setTip] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ tip: string }>("/api/ai/tip")
      .then((res) => setTip(res.tip))
      .catch(() => setTip("Take regular breaks while studying!"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-border rounded-[10px] p-5 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">AI Tip of the Day</h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-full animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded-full animate-pulse w-1/2" />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed italic">
          &ldquo;{tip}&rdquo;
        </p>
      )}
    </div>
  );
}
