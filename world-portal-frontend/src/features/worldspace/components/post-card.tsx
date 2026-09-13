import Image from "next/image";

import { ArrowUpRight, BadgeCheck, Heart, MapPin, MessageCircle } from "lucide-react";

import { WorldSpaceAvatar } from "@/features/worldspace/components/post-avatar";
import { WORLDSPACE } from "@/features/worldspace/config";
import type { WorldSpacePost } from "@/features/worldspace/types";
import { cn, formatDate } from "@/lib/utils";

/** How many tags fit under a caption before the card starts to look like a feed. */
const MAX_TAGS = 2;

/**
 * Coarse, deliberately imprecise age: "today", "4d", "3w", "14 Aug".
 *
 * This renders on the server and hydrates on the client, so anything finer than
 * a day would tick between the two renders and show up as a hydration mismatch.
 * Days are the smallest unit that cannot realistically disagree, and the exact
 * timestamp is still available on the `<time>` element's `title`.
 */
function postAge(iso: string, now: number = Date.now()) {
  const posted = new Date(iso).getTime();
  if (!Number.isFinite(posted)) return "";

  const days = Math.floor((now - posted) / 86_400_000);
  if (days < 1) return "today";
  if (days < 7) return `${days}d`;
  if (days < 28) return `${Math.floor(days / 7)}w`;
  if (days < 365) return formatDate(iso, { day: "numeric", month: "short" });
  return formatDate(iso, { month: "short", year: "numeric" });
}

/** 1240 -> "1.2K". Counts are glanced at, not read. */
function compact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * One traveller's WorldSpace post, as a photograph.
 *
 * The whole card is a single link off this site, so it is a plain `<a>` with
 * `target="_blank"` — not `next/link`, which would prefetch a route that is not
 * ours. The `aria-label` carries the destination: a screen-reader user hearing
 * only the caption would have no idea the link leaves E-Embassy for a different
 * product. Everything inside is decorative duplication of that label.
 *
 * Presentational and server-rendered on purpose: no state, no handlers, no
 * reveal of its own — the section owns the motion.
 */
export function WorldSpacePostCard({
  post,
  className,
  priority,
}: {
  post: WorldSpacePost;
  className?: string;
  /** Passed to next/image for the first row only. */
  priority?: boolean;
}) {
  const { author, place } = post;
  const tags = post.tags.slice(0, MAX_TAGS);
  const where = `${place.city}, ${place.country}`;
  const posted = formatDate(post.postedAt);

  return (
    <a
      data-worldspace-post
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${author.name} (@${author.handle}) in ${where}: ${post.caption} — posted ${posted}. Opens on ${WORLDSPACE.name} in a new tab.`}
      className={cn(
        "group relative block overflow-hidden rounded-[1.5rem] bg-ink-900 shadow-lg",
        "transition-transform duration-500 ease-glass motion-safe:hover:-translate-y-1",
        "focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none",
        className,
      )}
    >
      <div className="relative aspect-[4/5] w-full">
        <Image
          src={post.imageUrl}
          alt={post.imageAlt}
          fill
          priority={priority}
          sizes="(max-width: 640px) 88vw, (max-width: 1024px) 44vw, (max-width: 1280px) 30vw, 22vw"
          className="object-cover transition-transform duration-[900ms] ease-glass motion-safe:group-hover:scale-[1.05]"
        />

        {/* Scrim. Deepens on hover so the type keeps its contrast while the
            photograph underneath it moves. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink-950/92 via-ink-950/45 to-ink-950/5 transition-colors duration-500 group-hover:from-ink-950 group-hover:via-ink-950/60"
        />

        {/* "Opens on WorldSpace" — the visual half of the affordance. */}
        <span
          aria-hidden="true"
          className="glass-dark absolute top-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-white"
        >
          {WORLDSPACE.name}
          <ArrowUpRight className="size-3.5" strokeWidth={2.5} />
        </span>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 p-4 sm:p-5"
        >
          <div className="flex items-center gap-2.5">
            <WorldSpaceAvatar author={author} />
            <span className="min-w-0">
              <span className="flex items-center gap-1 text-[13px] leading-tight font-semibold text-white">
                <span className="truncate">{author.name}</span>
                {author.verified ? (
                  <BadgeCheck className="size-3.5 shrink-0 text-cyan-300" />
                ) : null}
              </span>
              <span className="block truncate text-[11.5px] text-white/65">
                @{author.handle}
              </span>
            </span>
          </div>

          <p className="line-clamp-2 text-[13px] leading-snug text-white/90">
            {post.caption}
          </p>

          {tags.length > 0 ? (
            <p className="flex flex-wrap gap-x-2 text-[11px] text-white/55">
              {tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </p>
          ) : null}

          <div className="flex items-center gap-3 text-[11.5px] text-white/70">
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{where}</span>
            </span>
            <span className="ml-auto flex shrink-0 items-center gap-2.5">
              <span className="flex items-center gap-1">
                <Heart className="size-3.5" />
                {compact(post.likes)}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="size-3.5" />
                {compact(post.comments)}
              </span>
              <time dateTime={post.postedAt} title={posted}>
                {postAge(post.postedAt)}
              </time>
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
