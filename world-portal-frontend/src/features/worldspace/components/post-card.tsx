import Image from "next/image";

import { Icon } from "@/ds/components/icon";
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
 * One traveller's WorldSpace post, laid out the way a post looks on WorldSpace:
 * the photograph inset in a corner-lit card, and the person, their words and
 * the reactions underneath it on the card's own surface.
 *
 * The caption used to sit on a dark scrim over the photograph, where its
 * contrast depended on whichever picture happened to be behind it. On the card
 * surface it reads at full body contrast in both themes, and the photograph is
 * left alone apart from the two pieces of chrome that belong on it (where it
 * was taken, and where the link goes), each on E-Embassy's dark water glass.
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
        // The kit's corner-lit, elevated card (what <Card elevated interactive>
        // renders), written out because Card's props have no `target`/`rel`.
        "cx-card cx-lit cx-card--elevated cx-card--interactive group h-full gap-0 p-2",
        className,
      )}
    >
      <span className="cx-lit-2" aria-hidden="true" />

      {/* Inset photograph: 8px inside a 20px card, so a 12px radius keeps the
          two corners concentric. */}
      <div className="relative aspect-[5/6] w-full overflow-hidden rounded-[12px] bg-ink-950">
        <Image
          src={post.imageUrl}
          alt={post.imageAlt}
          fill
          priority={priority}
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 44vw, (max-width: 1280px) 30vw, 300px"
          className="object-cover transition-transform duration-[900ms] ease-cx motion-safe:group-hover:scale-[1.04]"
        />

        {/* A soft floor under the place tag, so it seats on a bright beach as
            well as on a dark jungle. The caption no longer lives on the photo. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-950/35 to-transparent"
        />

        {/* Where it was taken sits at the foot of the photo and the way out
            at the top, so on a narrow phone card the two never collide. */}
        <span
          aria-hidden="true"
          className="glass-dark absolute bottom-3 left-3 flex h-7 max-w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-pill pr-3 pl-2 text-[12px] font-medium text-white"
        >
          <Icon name="map-pin" tone="current" size={14} className="shrink-0" />
          <span className="truncate">{where}</span>
        </span>

        {/* "Opens on WorldSpace" — the visual half of the affordance. */}
        <span
          aria-hidden="true"
          className="glass-dark absolute top-3 right-3 flex h-7 items-center gap-1 rounded-pill pr-2 pl-2.5 text-[12px] font-medium text-white"
        >
          {WORLDSPACE.name}
          <Icon
            name="arrow-up-right"
            tone="current"
            size={14}
            className="transition-transform duration-300 ease-cx motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
          />
        </span>
      </div>

      <div aria-hidden="true" className="flex flex-1 flex-col px-2.5 pt-4 pb-2.5">
        <div className="flex items-center gap-3">
          <WorldSpaceAvatar author={author} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1 text-[14px] leading-tight font-semibold tracking-tight text-foreground">
              <span className="truncate">{author.name}</span>
              {author.verified ? (
                <Icon name="badge-check" size={15} className="shrink-0" />
              ) : null}
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
              <span className="truncate">@{author.handle}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.postedAt} title={posted} className="shrink-0">
                {postAge(post.postedAt)}
              </time>
            </span>
          </span>
        </div>

        <p className="mt-3.5 line-clamp-3 text-[14.5px] leading-[1.55] text-pretty text-foreground/85">
          {post.caption}
        </p>

        {/* mt-auto pins the reactions to the bottom edge, so cards in a row
            share a baseline whatever the caption length. */}
        <div className="mt-auto flex items-center gap-3 pt-4 text-[12.5px] text-muted-foreground">
          {tags.length > 0 ? (
            <span className="flex min-w-0 flex-wrap gap-x-2 gap-y-1">
              {tags.map((tag) => (
                <span key={tag} className="truncate">
                  #{tag}
                </span>
              ))}
            </span>
          ) : null}
          <span className="ml-auto flex shrink-0 items-center gap-3 tabular-nums">
            <span className="flex items-center gap-1">
              <Icon name="heart" tone="current" size={15} />
              {compact(post.likes)}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="chat" tone="current" size={15} />
              {compact(post.comments)}
            </span>
          </span>
        </div>
      </div>
    </a>
  );
}
