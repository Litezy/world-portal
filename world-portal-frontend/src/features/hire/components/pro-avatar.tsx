import Image from "next/image";

import type { Professional } from "@/content/professionals";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * A professional's portrait, or a monogram tile when there is no photo.
 *
 * The tile is not a placeholder box — the gradient is hashed from the id, so
 * it is stable across renders and each card still looks distinct. See the note
 * in `content/professionals.ts` about what the current photographs are.
 */
const GRADIENTS = [
  "from-brand-500 to-cyan-500",
  "from-brand-700 to-brand-400",
  "from-cyan-600 to-brand-500",
  "from-brand-600 to-cyan-400",
  "from-brand-800 to-brand-500",
  "from-cyan-700 to-brand-600",
];

function gradientFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

export function ProAvatar({
  pro,
  className,
  textClassName,
}: {
  pro: Professional;
  className?: string;
  textClassName?: string;
}) {
  if (pro.photo) {
    return (
      <span className={cn("relative block overflow-hidden", className)}>
        <Image src={pro.photo} alt="" fill sizes="96px" className="object-cover" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center bg-gradient-to-br font-semibold text-white",
        gradientFor(pro.id),
        className,
      )}
    >
      <span className={cn("tracking-tight", textClassName)}>{initials(pro.name)}</span>
    </span>
  );
}
