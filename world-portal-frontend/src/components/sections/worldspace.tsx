import { WorldSpaceColumns } from "@/components/sections/worldspace-columns";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { worldspace } from "@/content/landing";
import { Icon } from "@/ds/components/icon";
import { WorldSpacePostCard } from "@/features/worldspace/components/post-card";
import { WORLDSPACE } from "@/features/worldspace/config";
import { cn } from "@/lib/utils";
import { getWorldSpaceFeed } from "@/server/worldspace/client";

/**
 * Eight posts: four columns of two from xl, three of two at lg, two of three
 * at sm, and a swipeable row on a phone. The last two only appear from xl,
 * where the fourth column needs them; below that they are `display: none`, so
 * the grid's auto-placement (and the drift, which follows it) never sees them.
 *
 * Every tile is the same shape on purpose. An earlier version made the first
 * tile `lg:col-span-2`, which looks clever and is a trap: the card owns a fixed
 * `aspect-[5/6]` photograph, so doubling a tile's width doubles its height, and
 * the rest of that row stretched to match with a dark void under the caption.
 * The rhythm comes from the columns instead — staggered at rest (see
 * `columnOffset`) and drifting at different speeds while the page moves.
 */
const FEED_SIZE = 8;
const WIDE_ONLY_FROM = 6;

/**
 * Drops alternate columns down, so the wall reads as a feed someone is
 * scrolling rather than a table of thumbnails — the resting rhythm, and the
 * whole of it under reduced motion.
 *
 * It is the CSS `translate` property (Tailwind v4's `translate-y-*`), not
 * `transform`, so it composes with the drift `WorldSpaceColumns` runs on the
 * card wrapper instead of being overwritten by it. The list pads its own
 * bottom by the same amount so the lowered column never hangs into the next
 * section.
 */
function columnOffset(index: number) {
  return cn(
    index % 2 === 1 && "sm:max-lg:translate-y-10",
    index % 3 === 1 && "lg:max-xl:translate-y-14",
    index % 2 === 1 && "xl:translate-y-16",
  );
}

/**
 * Posts from WorldSpace — the sister social platform under the same parent
 * company — shown as a wall of posts that lead back out to the original.
 *
 * The feed is fetched on the server and `getWorldSpaceFeed` never throws and
 * never comes back empty, so there is no error or empty state to design; the
 * one thing this section must not do is imply the posts are live when they are
 * not, which is what `placeholderNotice` is for.
 *
 * The section clips its own edges (`overflow-hidden`), because the drifting
 * columns travel past the wall's box while the page moves.
 */
export async function WorldSpace() {
  const feed = await getWorldSpaceFeed(FEED_SIZE);

  if (feed.posts.length === 0) return null;

  return (
    // tone="muted": Experiences above is `default` (white) and Agency below is
    // white around its dark island, so the soft grey is what lifts the white
    // post cards off the page and marks the seam on both sides.
    <Section
      id="worldspace"
      spacing="md"
      tone="muted"
      data-worldspace-section=""
      data-worldspace-source={feed.source}
      className="overflow-hidden"
    >
      <Container>
        {/* An editorial header row: the argument on the left, the way out to
            WorldSpace on the right, both above the wall rather than one of
            them stranded under a staggered bottom edge. */}
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <SectionHeading
            eyebrow={worldspace.eyebrow}
            lead={worldspace.headingLead}
            accent={worldspace.headingAccent}
            body={worldspace.body}
            size="md"
            className="max-w-2xl"
          >
            {feed.source === "placeholder" ? (
              <p
                data-worldspace-notice=""
                className="mt-5 inline-flex max-w-lg items-start gap-2 rounded-2xl bg-surface-2 px-3.5 py-2 text-[13px] leading-snug text-muted-foreground sm:rounded-pill"
              >
                {/* The section's one gold touch. */}
                <Icon
                  name="info"
                  tone="current"
                  size={15}
                  className="mt-px shrink-0 text-gold-ink"
                />
                {worldspace.placeholderNotice}
              </p>
            ) : null}
          </SectionHeading>

          {/* A plain <a>: it leaves this site, so next/link would only
              prefetch a route that is not ours. */}
          <a
            href={WORLDSPACE.exploreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cx-btn cx-btn--ghost cx-btn--arrow cx-btn--sm h-11 self-start px-5 lg:mb-1 lg:self-auto"
          >
            {worldspace.cta.label}
            <Icon name="arrow-up-right" tone="current" size={18} />
          </a>
        </div>

        {/* Below `sm` the wall is a swipeable row that bleeds to the screen
            edge (-mx-5 cancels the container gutter, px-5 puts it back
            inside the scroller), so six tall posts are not a 3,000px column. */}
        <WorldSpaceColumns
          className={cn(
            "-mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "sm:mx-0 sm:mt-12 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-10",
            "lg:grid-cols-3 lg:gap-6 lg:pb-14 xl:grid-cols-4 xl:gap-5 xl:pb-16",
          )}
        >
          {feed.posts.map((post, index) => (
            <li
              key={post.id}
              className={cn(
                "w-[78%] shrink-0 snap-start sm:w-auto",
                index >= WIDE_ONLY_FROM && "hidden xl:block",
                columnOffset(index),
              )}
            >
              <div data-ws-drift="" className="h-full will-change-transform">
                {/* No `priority`: this section sits near the bottom of a long
                    landing page, so preloading its tiles would compete with
                    the Three.js hero for the window the basket drawer is kept
                    lazy for. Below the fold, priority costs LCP. */}
                <WorldSpacePostCard post={post} />
              </div>
            </li>
          ))}
        </WorldSpaceColumns>
      </Container>
    </Section>
  );
}
