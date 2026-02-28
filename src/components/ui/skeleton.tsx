import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-md", className)}
      style={{
        background:
          "linear-gradient(90deg, var(--muted) 25%, var(--color-bg-subtle, var(--muted)) 50%, var(--muted) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
      {...props}
    />
  )
}

/**
 * Wrapper that fades in content when it replaces a skeleton.
 * Use as: <FadeIn>...real content...</FadeIn>
 */
function FadeIn({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(className)}
      style={{ animation: "skeleton-fade-in 150ms ease-out" }}
      {...props}
    >
      {children}
    </div>
  )
}

export { Skeleton, FadeIn }
