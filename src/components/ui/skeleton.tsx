import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-md", className)}
      style={{
        background:
          "linear-gradient(100deg, #E5E3E1 40%, #F2F1F0 50%, #E5E3E1 60%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.8s ease-in-out infinite",
      }}
      {...props}
    />
  )
}

export { Skeleton }
