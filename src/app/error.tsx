"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CloudOff, RotateCcw, Home, MessageCircle } from "lucide-react";

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
          {/* Warm amber icon circle */}
          <div
            style={{
              position: "relative",
              display: "flex",
              width: 80,
              height: 80,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              backgroundColor: "#fef3c7",
              marginBottom: 24,
              boxShadow: "0 0 0 12px rgba(254, 243, 199, 0.5), 0 0 0 24px rgba(254, 243, 199, 0.25)",
            }}
          >
            <CloudOff size={36} color="#d97706" />
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Oops, something went wrong
          </h1>
          <p
            style={{
              marginTop: 8,
              maxWidth: 400,
              fontSize: 14,
              color: "#737373",
              lineHeight: 1.6,
            }}
          >
            Don&apos;t worry — this is just a temporary hiccup. You can try
            again, or head back to the home page.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#a3a3a3",
              }}
            >
              Error reference: {error.digest}
            </p>
          )}
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
                backgroundColor: "#0B9178",
                color: "white",
                cursor: "pointer",
              }}
            >
              <RotateCcw size={14} />
              Try Again
            </button>
            <Link
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
              Go to Dashboard
            </Link>
          </div>
          <a
            href="mailto:support@example.com?subject=Bug%20Report"
            style={{
              marginTop: 16,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#a3a3a3",
              textDecoration: "none",
            }}
          >
            <MessageCircle size={12} />
            Report this issue
          </a>
        </div>
      </body>
    </html>
  );
}
