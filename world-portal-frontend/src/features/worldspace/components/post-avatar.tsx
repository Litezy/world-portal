import Image from "next/image";

import type { WorldSpaceAuthor } from "@/features/worldspace/types";
import { cn, initials } from "@/lib/utils";

/**
 * A WorldSpace author's picture, or a monogram tile when there is none.
 *
 * Mirrors `features/hire/components/pro-avatar.tsx`: `avatarUrl` is nullable by
 * contract — plenty of real accounts have no picture — so the fallback has to
 * look deliberate rather than broken. The gradient is hashed from the author's
 * id, so it is stable across renders and every author still reads as distinct.
 *
 * The picture is decorative: the author's name sits next to it in the card, so
 * announcing it twice only makes the link's name longer.
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

export function WorldSpaceAvatar({
  author,
  className,
}: {
  author: WorldSpaceAuthor;
  className?: string;
}) {
  if (author.avatarUrl) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "relative block size-9 shrink-0 overflow-hidden rounded-full",
          className,
        )}
      >
        <Image
          src={author.avatarUrl}
          alt=""
          fill
          sizes="40px"
          className="object-cover"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[12px] font-semibold tracking-tight text-white",
        gradientFor(author.id),
        className,
      )}
    >
      {initials(author.name)}
    </span>
  );
}
