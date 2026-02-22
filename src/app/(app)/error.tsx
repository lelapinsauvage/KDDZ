"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10 mb-6">
        <AlertTriangle className="size-10 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. Please try again, or go back to the
        dashboard if the problem persists.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset} variant="default" size="sm">
          <RotateCcw className="mr-1.5 size-3.5" />
          Try Again
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <Home className="mr-1.5 size-3.5" />
            Go Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
