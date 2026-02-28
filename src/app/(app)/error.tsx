"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CloudOff, RotateCcw, LayoutDashboard, MessageCircle } from "lucide-react";
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
      {/* Warm, friendly illustration */}
      <div className="relative mb-6">
        <div className="absolute -inset-4 rounded-full bg-amber-50" />
        <div className="absolute -inset-8 rounded-full bg-amber-50/50" />
        <div className="relative flex size-20 items-center justify-center rounded-full bg-amber-100">
          <CloudOff className="size-9 text-amber-600" />
        </div>
        <div className="absolute -right-2 -top-1 size-2.5 rounded-full bg-amber-200" />
        <div className="absolute -bottom-2 -left-3 size-2 rounded-full bg-amber-200/70" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">
        Oops, something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
        Don&apos;t worry — this is just a temporary hiccup. You can try again, or
        head back to the dashboard.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground/60">
          Error reference: {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Button onClick={reset} variant="default" size="sm">
          <RotateCcw className="mr-1.5 size-3.5" />
          Try Again
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <LayoutDashboard className="mr-1.5 size-3.5" />
            Go to Dashboard
          </Link>
        </Button>
      </div>
      <a
        href="mailto:support@example.com?subject=Bug%20Report&body=Error%20reference%3A%20"
        className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageCircle className="size-3" />
        Report this issue
      </a>
    </div>
  );
}
