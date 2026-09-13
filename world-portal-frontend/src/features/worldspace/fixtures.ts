import { worldSpacePostUrl } from "@/features/worldspace/config";
import type { WorldSpacePost } from "@/features/worldspace/types";

/**
 * Curated placeholder posts standing in for the WorldSpace feed.
 *
 * **None of this is real users' content.** WorldSpace has no public API yet, so
 * every post below is invented for design: the names, handles, captions, like
 * counts and permalinks are made up, and the photographs are the same stock
 * travel images already shipped in `public/images` — reused here, not taken by
 * the person credited above them. Nobody should later mistake one of these for
 * something a traveller actually posted.
 *
 * Before this section shows anyone genuinely identifiable, the feed must come
 * from `getWorldSpaceFeed()` with `WORLDSPACE_API_URL` set, so each post is
 * that person's own photograph, their own words, and their own permalink.
 *
 * Some authors deliberately have `avatarUrl: null` — the monogram fallback has
 * to be exercised on the real page, not only in a test.
 */
export const worldSpacePosts: WorldSpacePost[] = [
  {
    id: "wsp-ulun-danu",
    url: worldSpacePostUrl("wsp-ulun-danu"),
    caption:
      "Got to the lake before six to beat the coach parties. Worth every minute of the alarm — for about twenty minutes it was just me and two men fishing.",
    imageUrl: "/images/intro/temple.jpg",
    imageAlt:
      "A tiered temple standing in still lake water at dawn, mirrored in the surface",
    author: {
      id: "wsa-amara-okafor",
      name: "Amara Okafor",
      handle: "amararoams",
      avatarUrl: "/images/avatars/1.jpg",
      verified: true,
    },
    place: { city: "Bedugul", country: "Indonesia", countryCode: "ID" },
    postedAt: "2026-09-06T01:20:00.000Z",
    likes: 1284,
    comments: 63,
    tags: ["sunrise", "bali"],
  },
  {
    id: "wsp-tegallalang-steps",
    url: worldSpacePostUrl("wsp-tegallalang-steps"),
    caption:
      "Walked the whole valley instead of stopping at the viewpoint. Two hours, one very wrong turn, and a farmer who pointed me back up the hill laughing.",
    imageUrl: "/images/intro/rice.jpg",
    imageAlt: "Sunlit rice terraces stepping down a valley, lined with tall palm trees",
    author: {
      id: "wsa-daniel-mensah",
      name: "Daniel Mensah",
      handle: "dmensah",
      avatarUrl: null,
      verified: false,
    },
    place: { city: "Tegallalang", country: "Indonesia", countryCode: "ID" },
    postedAt: "2026-09-02T09:41:00.000Z",
    likes: 342,
    comments: 18,
    tags: ["hiking"],
  },
  {
    id: "wsp-atoll-mornings",
    url: worldSpacePostUrl("wsp-atoll-mornings"),
    caption:
      "Swam before breakfast every morning for nine days. I have never slept better in my life and I am not sure I can go back.",
    imageUrl: "/images/stays/ocean-villa.jpg",
    imageAlt:
      "A modern villa on the water with a long infinity pool running out towards the ocean",
    author: {
      id: "wsa-lena-castillo",
      name: "Lena Castillo",
      handle: "lenacastillo",
      avatarUrl: "/images/avatars/2.jpg",
      verified: true,
    },
    place: { city: "Malé", country: "Maldives", countryCode: "MV" },
    postedAt: "2026-08-29T06:05:00.000Z",
    likes: 2971,
    comments: 147,
    tags: ["maldives", "swim"],
  },
  {
    id: "wsp-samui-quiet",
    url: worldSpacePostUrl("wsp-samui-quiet"),
    caption:
      "Booked two nights, stayed six. The rain came in every afternoon at four and we just sat under the roof and waited it out.",
    imageUrl: "/images/stays/jungle-retreat.jpg",
    imageAlt:
      "A thatched open-sided pavilion beside a curved pool, surrounded by dense green jungle",
    author: {
      id: "wsa-marco-pereira",
      name: "Marco Pereira",
      handle: "marcopereira",
      avatarUrl: null,
      verified: false,
    },
    place: { city: "Koh Samui", country: "Thailand", countryCode: "TH" },
    postedAt: "2026-08-24T11:30:00.000Z",
    likes: 508,
    comments: 27,
    tags: ["thailand", "rainyseason"],
  },
  {
    id: "wsp-doha-layover",
    url: worldSpacePostUrl("wsp-doha-layover"),
    caption:
      "Eleven hour layover, so I paid for the day room, slept, and then caught this out of the window on the way out. Best decision of the trip.",
    imageUrl: "/images/travel/flight-dusk.jpg",
    imageAlt: "An aircraft climbing away through an orange and violet dusk sky",
    author: {
      id: "wsa-priya-raman",
      name: "Priya Raman",
      handle: "priyainflight",
      avatarUrl: "/images/avatars/3.jpg",
      verified: false,
    },
    place: { city: "Doha", country: "Qatar", countryCode: "QA" },
    postedAt: "2026-08-19T16:58:00.000Z",
    likes: 733,
    comments: 41,
    tags: ["layover", "doha"],
  },
  {
    id: "wsp-el-nido-kayaks",
    url: worldSpacePostUrl("wsp-el-nido-kayaks"),
    caption:
      "Took the kayaks out to the far side of the bay and had the whole beach to ourselves until lunch. No signal, which turned out to be the point.",
    imageUrl: "/images/gallery/1.jpg",
    imageAlt:
      "A wooden hut on a headland above a secluded beach, with kayaks pulled up on the sand",
    author: {
      id: "wsa-hannah-lindqvist",
      name: "Hannah Lindqvist",
      handle: "hlindqvist",
      avatarUrl: null,
      verified: false,
    },
    place: { city: "El Nido", country: "Philippines", countryCode: "PH" },
    postedAt: "2026-08-11T09:22:00.000Z",
    likes: 1156,
    comments: 74,
    tags: ["islands", "kayaking"],
  },
  {
    id: "wsp-marrakech-arrival",
    url: worldSpacePostUrl("wsp-marrakech-arrival"),
    caption:
      "Landed late and thought we had made a mistake. Then we came through this door. Mint tea was waiting and nobody mentioned the hour.",
    imageUrl: "/images/travel/arrival.jpg",
    imageAlt:
      "A warmly lit resort entrance at dusk, lanterns on either side of the door",
    author: {
      id: "wsa-yusuf-benali",
      name: "Yusuf Benali",
      handle: "yusufbenali",
      avatarUrl: "/images/avatars/4.jpg",
      verified: true,
    },
    place: { city: "Marrakech", country: "Morocco", countryCode: "MA" },
    postedAt: "2026-08-03T20:44:00.000Z",
    likes: 897,
    comments: 52,
    tags: ["morocco", "arrival"],
  },
  {
    id: "wsp-ella-falls",
    url: worldSpacePostUrl("wsp-ella-falls"),
    caption:
      "Forty minutes down through the trees and you can hear it long before you see it. Cold enough to take your breath away. Went in twice anyway.",
    imageUrl: "/images/intro/falls.jpg",
    imageAlt: "A waterfall dropping through dense green forest into a rock pool",
    author: {
      id: "wsa-tom-abara",
      name: "Tom Abara",
      handle: "tomabara",
      avatarUrl: null,
      verified: false,
    },
    place: { city: "Ella", country: "Sri Lanka", countryCode: "LK" },
    postedAt: "2026-07-28T07:15:00.000Z",
    likes: 421,
    comments: 22,
    tags: ["srilanka", "waterfall"],
  },
];
