"use client";

import { useState, useCallback, useEffect } from "react";
import {
  AppContext,
  type Branch,
  type SchoolYear,
} from "@/hooks/use-app-context";

interface AppContextProviderProps {
  children: React.ReactNode;
  branches: Branch[];
  years: SchoolYear[];
  /** Pre-select branch for non-admin users tied to a specific branch */
  defaultBranchId?: string | null;
}

export function AppContextProvider({
  children,
  branches,
  years,
  defaultBranchId,
}: AppContextProviderProps) {
  // Initialize from localStorage if available, else use defaults
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(() => {
    if (defaultBranchId) {
      return branches.find((b) => b.id === defaultBranchId) || null;
    }
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("garderie-branch");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return branches.find((b) => b.id === parsed.id) || null;
        } catch {
          return null;
        }
      }
    }
    return null; // null = all branches (admin view)
  });

  const [currentYear, setCurrentYear] = useState<SchoolYear | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("garderie-year");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return years.find((y) => y.id === parsed.id) || null;
        } catch {
          return null;
        }
      }
    }
    // Default to the first year (should be the active one)
    return years[0] || null;
  });

  // Persist selections
  useEffect(() => {
    if (currentBranch) {
      localStorage.setItem("garderie-branch", JSON.stringify(currentBranch));
    } else {
      localStorage.removeItem("garderie-branch");
    }
  }, [currentBranch]);

  useEffect(() => {
    if (currentYear) {
      localStorage.setItem("garderie-year", JSON.stringify(currentYear));
    } else {
      localStorage.removeItem("garderie-year");
    }
  }, [currentYear]);

  const setBranch = useCallback((branch: Branch | null) => {
    setCurrentBranch(branch);
  }, []);

  const setYear = useCallback((year: SchoolYear | null) => {
    setCurrentYear(year);
  }, []);

  return (
    <AppContext
      value={{
        currentBranch,
        setBranch,
        currentYear,
        setYear,
        branches,
        years,
      }}
    >
      {children}
    </AppContext>
  );
}
