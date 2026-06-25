"use client";

import { create } from "zustand";

interface AuthStore {
  isLoginMode: boolean;
  setLoginMode: (mode: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isLoginMode: true,
  setLoginMode: (mode) => set({ isLoginMode: mode }),
}));
