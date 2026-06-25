"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, RotateCcw, Timer, SkipForward } from "lucide-react";

const POMODORO_MINUTES = 25;
const BREAK_MINUTES = 5;

export function FocusTimerWidget() {
  const [totalSeconds, setTotalSeconds] = useState(POMODORO_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  useEffect(() => {
    if (isRunning && totalSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTotalSeconds((prev) => {
          if (prev <= 1) {
            clearTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (totalSeconds === 0) {
      clearTimer();
      setIsRunning(false);
      if (!isBreak) {
        setSessionsCompleted((s) => s + 1);
        setIsBreak(true);
        setTotalSeconds(BREAK_MINUTES * 60);
      } else {
        setIsBreak(false);
        setTotalSeconds(POMODORO_MINUTES * 60);
      }
    } else {
      clearTimer();
    }
    return () => clearTimer();
  }, [isRunning, totalSeconds, isBreak, clearTimer]);

  const handlePlay = () => {
    if (totalSeconds > 0) setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTotalSeconds(POMODORO_MINUTES * 60);
  };

  const handleSkip = () => {
    setIsRunning(false);
    if (!isBreak) {
      setSessionsCompleted((s) => s + 1);
      setIsBreak(true);
      setTotalSeconds(BREAK_MINUTES * 60);
    } else {
      setIsBreak(false);
      setTotalSeconds(POMODORO_MINUTES * 60);
    }
  };

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const progress = isBreak
    ? ((BREAK_MINUTES * 60 - totalSeconds) / (BREAK_MINUTES * 60)) * 100
    : ((POMODORO_MINUTES * 60 - totalSeconds) / (POMODORO_MINUTES * 60)) * 100;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 rounded-xl p-5 card-hover h-full text-white">
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <Timer className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm">Focus Timer</h3>
        </div>

        <div className="text-center mb-2">
          <p className="text-5xl font-bold font-mono tracking-wider" style={{ letterSpacing: "-0.02em" }}>{display}</p>
          <p className="text-xs text-white/70 mt-1">
            {isBreak ? "Break Time" : "Pomodoro Session"}
          </p>
        </div>

        <div className="w-full h-1 bg-white/15 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleReset}
            className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-all"
            aria-label="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={isRunning ? handlePause : handlePlay}
            className="w-14 h-14 rounded-xl bg-white flex items-center justify-center text-primary hover:shadow-lg transition-all hover:scale-105"
            aria-label={isRunning ? "Pause timer" : "Start timer"}
          >
            {isRunning ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>
          <button
            onClick={handleSkip}
            className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-all"
            aria-label="Skip to next"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {sessionsCompleted > 0 && (
          <p className="text-center text-xs text-white/50 mt-3">
            {sessionsCompleted} session{sessionsCompleted > 1 ? "s" : ""} completed
          </p>
        )}
      </div>
    </div>
  );
}
