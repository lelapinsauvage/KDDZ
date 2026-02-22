"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif",
          backgroundColor: "#fafafa",
          color: "#0a0a0a",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 80,
              height: 80,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              marginBottom: 24,
            }}
          >
            <AlertTriangle size={40} color="#ef4444" />
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              marginTop: 8,
              maxWidth: 400,
              fontSize: 14,
              color: "#737373",
            }}
          >
            An unexpected error occurred. Please try again, or go back to the
            home page.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 24,
            }}
          >
            <button
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 500,
                border: "none",
                borderRadius: 8,
                backgroundColor: "#14B8A6",
                color: "white",
                cursor: "pointer",
              }}
            >
              <RotateCcw size={14} />
              Try Again
            </button>
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 500,
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                backgroundColor: "white",
                color: "#0a0a0a",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              <Home size={14} />
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
