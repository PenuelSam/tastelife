/**
 * Content for the three lane pages (/fashion-design, /styling, /modeling).
 *
 * Media lives in /public/lanes/<slug>/ and is referenced from the site root,
 * e.g. public/lanes/styling/look.jpg → "/lanes/styling/look.jpg".
 * Items without `src` show a placeholder block until you add a file.
 *
 * The 14 slots per lane map, in order, to the fixed scatter layout in
 * components/lane/layout.ts.
 */

export type LaneSlug = "fashion-design" | "styling" | "modeling";

export type LaneItem = {
  /** URL segment: /<lane>/<id> */
  id: string;
  /** Shown as [num] */
  num: string;
  kind: "image" | "video" | "card";
  src?: string;
  /** Videos: still shown before playback. */
  poster?: string;
  /** Videos: short muted loop for the gallery tile (5–8s, 720p, no audio). */
  clip?: string;
  alt: string;
  title: string;
  meta: string;
  year: string;
  date: string;
  credit: string;
  description: string;
  /** The two-style name at the bottom of the detail panel. */
  nameScript: string;
  nameCaps: string;
  /** Placeholder / card proportions, e.g. "3 / 4". */
  aspect: string;
};

export type Lane = {
  slug: LaneSlug;
  title: string;
  /** How the hero title breaks on mobile. */
  titleLines: string[];
  items: LaneItem[];
};

// Desktop aspect ratios of the 14 scatter slots (see components/lane/layout.ts).
const ASPECTS = ["3 / 4", "2 / 3", "4 / 5", "1 / 1", "3 / 4", "2 / 3", "4 / 5", "3 / 2", "3 / 4", "2 / 3", "1 / 1", "3 / 4", "3 / 4", "4 / 5"];

const pad = (n: number) => String(n).padStart(2, "0");

/* ---------- Fashion design: 14 looks across 3 collections ---------- */
// Add a photo: put it in public/lanes/fashion-design/ and map the item id to it,
// e.g. "07": "/lanes/fashion-design/look-07.jpg".
const FASHION_MEDIA: Record<string, string> = {};

const fashionItems: LaneItem[] = ASPECTS.map((aspect, i) => {
  const look = pad(i + 1);
  const collection = pad(i < 5 ? 1 : i < 10 ? 2 : 3);
  return {
    id: look,
    num: look,
    kind: "image",
    src: FASHION_MEDIA[look],
    alt: `[Look ${look}]`,
    title: `[Look ${look}]`,
    meta: `[Collection ${collection}]`,
    year: "[Year]",
    date: "[Season] [Year]",
    credit: `Collection · [Name ${collection}]`,
    description: "[description]",
    nameScript: `[Collection ${collection}]`,
    nameCaps: `[Look ${look}]`,
    aspect,
  };
});

/* ---------- Styling: looks for three clients; 02 and 08 are films ---------- */
const S = "/lanes/styling";
const stylingMedia: { client: "A" | "B" | "C"; src?: string; video?: string }[] = [
  { client: "A", src: `${S}/DSC00362 copy.jpeg` },
  { client: "B", video: "IMG_3168" },
  { client: "A", src: `${S}/DSC00376 copy.jpeg` },
  { client: "C", src: `${S}/DSC00473 copy.jpeg` },
  { client: "A", src: `${S}/DSC00396 copy.jpeg` },
  { client: "B", src: `${S}/IMG_3171.jpg` },
  { client: "C", src: `${S}/DSC00495 copy.jpeg` },
  { client: "B", video: "IMG_3169" },
  { client: "A", src: `${S}/DSC00468 copy.jpeg` },
  { client: "C", src: `${S}/IMG_2738.JPG` },
  { client: "C", src: `${S}/IMG_2746.JPG` },
  { client: "A" },
  { client: "B" },
  { client: "C" },
];

const stylingItems: LaneItem[] = stylingMedia.map((m, i) => {
  const num = pad(i + 1);
  const client = `[Client ${m.client}]`;
  const isVideo = Boolean(m.video);
  return {
    id: num,
    num,
    kind: isVideo ? "video" : "image",
    src: isVideo ? `${S}/${m.video}.mp4` : m.src,
    poster: isVideo ? `${S}/${m.video}-poster.jpg` : undefined,
    clip: isVideo ? `${S}/${m.video}-clip.mp4` : undefined,
    alt: isVideo ? `[Describe this film]` : `[Describe this look]`,
    title: isVideo ? `[Campaign film ${num}]` : `[Look ${num}]`,
    meta: `${client} · ${isVideo ? "Campaign film" : "Editorial"}`,
    year: "[Year]",
    date: "[Month] [Year]",
    credit: `Styled for ${client}`,
    description: "[description]",
    nameScript: client,
    nameCaps: "[Project]",
    aspect: ASPECTS[i],
  };
});

/* ---------- Modeling: the comp card ([00]) plus 13 editorials ---------- */
// Add a photo: put it in public/lanes/modeling/ and map the item id to it,
// e.g. "03": "/lanes/modeling/editorial-03.jpg".
const MODELING_MEDIA: Record<string, string> = {};

const modelingItems: LaneItem[] = ASPECTS.map((aspect, i) => {
  if (i === 0) {
    return {
      id: "00",
      num: "00",
      kind: "card",
      alt: "Comp card",
      title: "Comp card",
      meta: "Stats · Measurements",
      year: "[Year]",
      date: "[Agency]",
      credit: "Comp card",
      description: "[availability]",
      nameScript: "Taiwo",
      nameCaps: "Adeoshun",
      aspect,
    };
  }
  const num = pad(i);
  return {
    id: num,
    num,
    kind: "image",
    src: MODELING_MEDIA[num],
    alt: `[Editorial ${num}]`,
    title: `[Editorial ${num}]`,
    meta: "[Publication]",
    year: "[Year]",
    date: "[Month] [Year]",
    credit: "Photographed by [Photographer] · [Publication]",
    description: "[description]",
    nameScript: "[Publication]",
    nameCaps: "[Editorial]",
    aspect,
  };
});

export const lanes: Record<LaneSlug, Lane> = {
  "fashion-design": { slug: "fashion-design", title: "Fashion Design", titleLines: ["Fashion", "Design"], items: fashionItems },
  styling: { slug: "styling", title: "Styling", titleLines: ["Styling"], items: stylingItems },
  modeling: { slug: "modeling", title: "Modeling", titleLines: ["Modeling"], items: modelingItems },
};

/**
 * Items that are shown: anything with a photo or film, plus the comp card.
 * Placeholder items (no src yet) stay hidden until you add their media.
 */
export function visibleItems(lane: Lane): LaneItem[] {
  return lane.items.filter((item) => item.kind === "card" || Boolean(item.src));
}

/** Fashion → Styling → Modeling → Fashion Design */
export const nextLane: Record<LaneSlug, LaneSlug> = {
  "fashion-design": "styling",
  styling: "modeling",
  modeling: "fashion-design",
};

/** Comp card stats shown in the card's detail panel. */
export const compCardStats = ["Height", "Bust", "Waist", "Hips", "Shoes", "Hair/Eyes"];

export const BOOKING_EMAIL = "[email]";
