import Link from "next/link";
import { MapPinOff, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      {/* Friendly illustration */}
      <div className="relative mb-6">
        <div className="absolute -inset-4 rounded-full bg-primary/5" />
        <div className="absolute -inset-8 rounded-full bg-primary/[0.02]" />
        <div className="relative flex size-20 items-center justify-center rounded-full bg-primary/10">
          <MapPinOff className="size-9 text-primary" />
        </div>
        <div className="absolute -right-3 -top-1 size-2.5 rounded-full bg-primary/20" />
        <div className="absolute -bottom-2 -left-4 size-2 rounded-full bg-primary/15" />
        <div className="absolute -right-5 bottom-2 size-1.5 rounded-full bg-primary/10" />
      </div>
      {/* Large 404 */}
      <p className="text-6xl font-bold text-primary/20 mb-2">404</p>
      <h1 className="text-2xl font-bold text-foreground">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        moved. Let&apos;s get you back on track.
      </p>
      <Button asChild size="sm" className="mt-6">
        <Link href="/">
          <LayoutDashboard className="mr-1.5 size-3.5" />
          Go to Dashboard
        </Link>
      </Button>
    </div>
  );
}
