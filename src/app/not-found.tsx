import Link from "next/link";
import { SearchX, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 mb-6">
        <SearchX className="size-10 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        moved. Head back to the dashboard to continue.
      </p>
      <Button asChild size="sm" className="mt-6">
        <Link href="/">
          <Home className="mr-1.5 size-3.5" />
          Back to Dashboard
        </Link>
      </Button>
    </div>
  );
}
