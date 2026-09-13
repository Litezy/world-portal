import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { ComingSoonNotice } from "@/components/sections/coming-soon";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { worldspace } from "@/content/landing";
import { WorldSpacePostCard } from "@/features/worldspace/components/post-card";
import { WORLDSPACE } from "@/features/worldspace/config";
import { getWorldSpaceFeed } from "@/server/worldspace/client";

/**
 * Six posts — two flush rows of three at `lg`, three rows of two at `sm`.
 *
 * Every tile is the same width on purpose. An earlier version made the first
 * tile `lg:col-span-2`, which looks clever and is a trap: the card is a fixed
 * `aspect-[4/5]` box, so doubling a tile's width doubles its height, and
 * `auto-rows-fr` then stretched every other card in that row to match. Their
 * images kept their own aspect ratio and the leftover height rendered as a tall
 * dark void under the caption. Keep the tiles uniform and the rows resolve
 * themselves.
 */
const FEED_SIZE = 6;

/**
 * Posts from WorldSpace — the sister social platform under the same parent
 * company — shown as a wall of images that lead back out to the original post.
 *
 * The feed is fetched on the server and `getWorldSpaceFeed` never throws and
 * never comes back empty, so there is no error or empty state to design; the
 * one thing this section must not do is imply the posts are live when they are
 * not, which is what `placeholderNotice` is for.
 */
export async function WorldSpace() {
  const feed = await getWorldSpaceFeed(FEED_SIZE);

  if (feed.posts.length === 0) return null;

  return (
    // tone="muted": Experiences above is `default` (white) and Contact below is
    // a dark photograph, so an ink band here would stack two dark surfaces and
    // swallow the seam between them. The soft grey lifts the white tiles off
    // the page, separates this section from Experiences, and lets Contact keep
    // being the one dark moment before the footer.
    <Section
      id="worldspace"
      spacing="md"
      tone="muted"
      data-worldspace-section=""
      data-worldspace-source={feed.source}
    >
      {/* size="content": a heading over a card grid is exactly what the 1200px
          column is for. `panel` is reserved for the inset rounded panels (Why
          Us, Journey) and this section has no panel — at 1200px the three
          columns land near 380px, which is already generous for a photo tile. */}
      <Container>
        <SectionHeading
          eyebrow={worldspace.eyebrow}
          lead={worldspace.headingLead}
          accent={worldspace.headingAccent}
          body={worldspace.body}
          align="center"
          size="md"
        >
          {feed.source === "placeholder" ? (
            <ComingSoonNotice
              data-worldspace-notice=""
              notice={worldspace.placeholderNotice}
            />
          ) : null}
        </SectionHeading>

        <Reveal
          as="ul"
          stagger={0.07}
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
        >
          {feed.posts.map((post) => (
            <li key={post.id}>
              {/* No `h-full` and no `auto-rows-fr` on the grid: the card owns
                  its own 4:5 ratio, so letting it size itself is what keeps
                  every tile the same shape with nothing left over. */}
              {/* No `priority` either. This section sits near the bottom of a
                  long landing page, so preloading its tiles would put a
                  preload link in competition with the Three.js hero during the
                  exact window the basket drawer is kept lazy for. Below the
                  fold, priority costs LCP rather than buying it. */}
              <WorldSpacePostCard post={post} />
            </li>
          ))}
        </Reveal>

        <div className="mt-12 flex justify-center">
          {/* asChild forwards a single child, so the icon goes inside the link
              rather than through rightIcon. */}
          <Button asChild variant="outline" size="lg">
            <a href={WORLDSPACE.exploreUrl} target="_blank" rel="noopener noreferrer">
              {worldspace.cta.label}
              <ArrowUpRight />
            </a>
          </Button>
        </div>
      </Container>
    </Section>
  );
}
