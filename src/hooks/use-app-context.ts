"use client";

import { createContext, useContext } from "react";

export interface Branch {
  id: string;
  name: string;
}

export interface SchoolYear {
  id: string;
  label: string;
}

export interface AppContextValue {
  /** Currently selected branch (null = all branches / admin view) */
  currentBranch: Branch | null;
  setBranch: (branch: Branch | null) => void;

  /** Currently selected school year */
  currentYear: SchoolYear | null;
  setYear: (year: SchoolYear | null) => void;

  /** Available branches for the current user */
  branches: Branch[];

  /** Available school years */
  years: SchoolYear[];
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within AppContextProvider");
  }
  return ctx;
}
