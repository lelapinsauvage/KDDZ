import { WifiOff, RefreshCw } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-stone-100">
          <WifiOff className="h-10 w-10 text-stone-400" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-stone-900">
          You appear to be offline
        </h1>
        <p className="mb-8 text-stone-500">
          Please check your internet connection and try again. Some features may
          not be available while you&apos;re offline.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-[#0B9178] px-6 py-3 font-medium text-white transition hover:bg-[#0B7464]"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </a>
      </div>
    </div>
  )
}
